from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from .models import Tour, Place, TourImage
from .serializers import TourSerializer
from django.conf import settings
import json

# --- CREATE TOUR ---
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def tour_post(request):
    try:
        data = request.data.copy()
        images = request.FILES.getlist('images')

        # Remove images from serializer data
        if 'images' in data:
            data.pop('images')

        # Save simple fields
        serializer = TourSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        tour = serializer.save()

        # --- Tags ---
        tags = data.get('tags')
        if tags:
            try:
                tour.tags = json.loads(tags)
                tour.save()
            except json.JSONDecodeError:
                tour.tags = []
                tour.save()

        # --- Places (ManyToMany, avoid duplicates by lat+lon) ---
        places_data = data.get('places', '[]')
        if isinstance(places_data, str):
            places_data = json.loads(places_data)
        place_instances = []
        for p in places_data:
            lat = p.get('lat')
            lon = p.get('lon')
            name = p.get('name', '')
            name_en = p.get('name_en', '')

            place_obj = Place.objects.filter(lat=lat, lon=lon, name=name).first()
            if not place_obj:
                place_obj = Place.objects.create(name=name, lat=lat, lon=lon, name_en=name_en)
            place_instances.append(place_obj)
        tour.places.set(place_instances)

        # --- Images ---
        thumb_idx = int(data.get('thumbnail_idx', 0))
        for i, img in enumerate(images):
            TourImage.objects.create(
                tour=tour,
                image=img,
                isthumbnail=(i == thumb_idx)
            )

        return Response({'success': True, 'tour_id': tour.id})

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=400)


# --- UPDATE TOUR ---
@api_view(['PUT'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def tour_put(request, tour_id):
    try:
        tour = Tour.objects.get(pk=tour_id)
    except Tour.DoesNotExist:
        return Response({'success': False, 'error': 'Tour not found'}, status=404)

    data = request.data.copy()
    images = request.FILES.getlist('images')

    # --- Update simple fields ---
    serializer = TourSerializer(tour, data=data, partial=True, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    tour = serializer.save()

    # --- Tags ---
    tags = data.get('tags')
    if tags:
        try:
            tour.tags = json.loads(tags)
        except json.JSONDecodeError:
            tour.tags = []
    else:
        tour.tags = []
    tour.save()

    # --- Places ---
    places_data = data.get('places', '[]')
    if isinstance(places_data, str):
        places_data = json.loads(places_data)
    place_instances = []
    for p in places_data:
        lat = p.get('lat')
        lon = p.get('lon')
        name = p.get('name', '')
        name_en = p.get('name_en', '')

        place_obj = Place.objects.filter(lat=lat, lon=lon, name=name).first()
        if not place_obj:
            place_obj = Place.objects.create(name=name, lat=lat, lon=lon, name_en=name_en)
        else:
            # Update name_en if provided
            if name_en and not place_obj.name_en:
                place_obj.name_en = name_en
                place_obj.save()
        place_instances.append(place_obj)
    tour.places.set(place_instances)

    # --- Remove images ---
    removed_images_json = data.get('removed_images')
    if removed_images_json:
        try:
            removed_urls = json.loads(removed_images_json)
            for img in tour.tour_images.all():
                absolute_url = request.build_absolute_uri(img.image.url)
                if absolute_url in removed_urls:
                    img.image.delete(save=False)
                    img.delete()
        except json.JSONDecodeError:
            pass

    # --- Add new images ---
    new_tour_images = []
    for img_file in images:
        new_img_obj = TourImage.objects.create(tour=tour, image=img_file, isthumbnail=False)
        new_tour_images.append(new_img_obj)

    # --- Handle thumbnail ---
    thumbnail_data_json = data.get('thumbnail_data')
    thumbnail_to_set = None
    if thumbnail_data_json:
        try:
            thumb_data = json.loads(thumbnail_data_json)
            thumb_type = thumb_data.get('type')
            if thumb_type == 'old':
                thumb_url = thumb_data.get('url')
                for img in tour.tour_images.all():
                    if request.build_absolute_uri(img.image.url) == thumb_url:
                        thumbnail_to_set = img
                        break
            elif thumb_type == 'new':
                thumb_index = thumb_data.get('index')
                if thumb_index is not None and 0 <= thumb_index < len(new_tour_images):
                    thumbnail_to_set = new_tour_images[thumb_index]
        except Exception as e:
            print(f"Error parsing thumbnail_data: {e}")

    # Clear all thumbnails
    tour.tour_images.update(isthumbnail=False)
    if thumbnail_to_set:
        thumbnail_to_set.isthumbnail = True
        thumbnail_to_set.save()
    else:
        first_image = tour.tour_images.first()
        if first_image:
            first_image.isthumbnail = True
            first_image.save()

    # --- Return updated tour ---
    data = TourSerializer(tour, context={'request': request}).data
    data['images'] = data['tour_images']  # flatten for frontend
    return Response({'tour': data}, status=200)


# --- GET TOUR ---
@api_view(['GET'])
@permission_classes([AllowAny])
def tour_get(request, tour_id):
    try:
        tour = Tour.objects.get(pk=tour_id)
        serializer = TourSerializer(tour, context={'request': request})
        data = serializer.data
        data['images'] = data['tour_images']  # flatten for frontend
        return Response({'tour': data})
    except Tour.DoesNotExist:
        return Response({'success': False, 'error': 'Tour not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=400)
