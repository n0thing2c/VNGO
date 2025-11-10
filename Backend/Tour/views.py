from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from .models import Tour, Place, TourImage
from .serializers import TourSerializer
from django.conf import settings
import json
from rest_framework import status
from .models import Tour, Place, TourImage, Transportation, TourPlace, TourRating, TourRatingImage
from .serializers import TourSerializer, PlaceSerializer, TourRatingSerializer, TourImageSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, parser_classes, permission_classes
from django.db.models import Count, Q # for get get_popular_tours()
from collections import Counter
# --- CREATE TOUR ---
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def tour_post(request):
    try:
        data = request.data
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
            city = p.get('city', '')
            city_en = p.get('city_en', '')
            province = p.get('province', '')
            province_en = p.get('province_en', '')

            place_obj = Place.objects.filter(lat=lat, lon=lon, name=name).first()
            if not place_obj:
                place_obj = Place.objects.create(
                    name=name,
                    lat=lat,
                    lon=lon,
                    name_en=name_en,
                    city=city,
                    city_en=city_en,
                    province=province,
                    province_en=province_en
                )
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

    # --- Places with order ---
    places_data = data.get('places', '[]')
    if isinstance(places_data, str):
        places_data = json.loads(places_data)

    # Clear old TourPlace entries for this tour
    tour.tour_places.all().delete()

    # Re-create TourPlace entries with order
    for idx, p in enumerate(places_data):
        lat = p.get('lat')
        lon = p.get('lon')
        name = p.get('name', '')
        name_en = p.get('name_en', '')
        city = p.get('city', '')
        city_en = p.get('city_en', '')
        province = p.get('province', '')
        province_en = p.get('province_en', '')

        place_obj = Place.objects.filter(lat=lat, lon=lon, name=name).first()

        if not place_obj:
            # Create new place if not exist
            place_obj = Place.objects.create(
                name=name,
                lat=lat,
                lon=lon,
                name_en=name_en,
                city=city,
                city_en=city_en,
                province=province,
                province_en=province_en,
            )
        else:
            # Update missing fields if provided
            updated = False
            if name_en and not place_obj.name_en:
                place_obj.name_en = name_en
                updated = True
            if city and not place_obj.city:
                place_obj.city = city
                updated = True
            if city_en and not place_obj.city_en:
                place_obj.city_en = city_en
                updated = True
            if province and not place_obj.province:
                place_obj.province = province
                updated = True
            if province_en and not place_obj.province_en:
                place_obj.province_en = province_en
                updated = True
            if updated:
                place_obj.save()

        # Create TourPlace entry with order
        TourPlace.objects.create(tour=tour, place=place_obj, order=idx)

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

    # Optional: flatten places with order for frontend
    data['places'] = [
        {
            'lat': tp.place.lat,
            'lon': tp.place.lon,
            'name': tp.place.name,
            'name_en': tp.place.name_en,
            'city': tp.place.city,
            'city_en': tp.place.city_en,
            'province': tp.place.province,
            'province_en': tp.place.province_en,
            'order': tp.order
        } for tp in tour.tour_places.all()
    ]
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

# --- GET ACHIEVEMENT ---
@api_view(["GET"])
@permission_classes([AllowAny])
def tour_achievements(request, tour_id):
    try:
        tour = Tour.objects.get(pk=tour_id)
    except Tour.DoesNotExist:
        return Response({"error": "Tour not found"}, status=404)

    achievements = []

    # Popular: 50+ bookings
    # booking_count = Booking.objects.filter(tour=tour).count()
    # if booking_count >= 50:
    #     achievements.append("Popular")

    # Highly Rated: 4+ stars
    # avg_rating = tour.ratings / max(tour.rates, 1)  # Avoid division by zero
    # if avg_rating >= 4:
    #     achievements.append("Highly Rated")

    # Multilingual: Tour guide knows 3+ languages
    # guide = TourGuide.objects.filter(tour=tour).first()
    # if guide and len(guide.languages) >= 3:
    #     achievements.append("Multilingual")

    # Budget: price < 300k
    if tour.price < 300_000:
        achievements.append("Budget")

    # Luxury: price > 1,000,000
    if tour.price > 1_000_000:
        achievements.append("Luxury")

    # Reliable: 80%+ confirmed bookings
    # confirmed_count = ConfirmedBooking.objects.filter(tour=tour).count()
    # if booking_count and confirmed_count / booking_count >= 0.8:
    #     achievements.append("Reliable")

    return Response({"achievements": achievements})
# --- POST RATING ---
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def tour_rate(request, tour_id):
    """
    Create a rating for a tour, with optional images.
    Expected form-data:
      - user: string
      - rating: integer (1-5)
      - review: string (optional)
      - review_tags: JSON array string (optional)
      - images: one or multiple image files
    """
    try:
        tour = Tour.objects.get(id=tour_id)
    except Tour.DoesNotExist:
        return Response({"success": False, "error": "Tour not found"}, status=status.HTTP_404_NOT_FOUND)

    user = request.data.get('user', 'anonymous')

    if TourRating.objects.filter(user=user, tour=tour).exists():
        return Response({"success": False, "error": "User has already rated this tour"}, status=status.HTTP_400_BAD_REQUEST)

    # Parse review_tags if it's a string
    review_tags = request.data.get('review_tags', '[]')
    import json
    try:
        review_tags = json.loads(review_tags) if isinstance(review_tags, str) else review_tags
    except json.JSONDecodeError:
        review_tags = []

    serializer = TourRatingSerializer(data={
        'rating': request.data.get('rating'),
        'review': request.data.get('review', ''),
        'review_tags': review_tags,
    })

    if serializer.is_valid():
        rating_instance = serializer.save(tour=tour, user=user)

        # Save images if provided
        images = request.FILES.getlist('images')
        for img in images:
            TourRatingImage.objects.create(rating=rating_instance, image=img)

        # Update tour aggregate rating
        tour.add_rating(serializer.validated_data['rating'])

        return Response({"success": True, "rating": serializer.data}, status=status.HTTP_201_CREATED)

    return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
#--- Get All Tour's Ratings ---
@api_view(['GET'])
@permission_classes([AllowAny])
def tour_get_ratings(request, tour_id):
    """
    Retrieve all ratings for a given tour.
    Returns rating info and associated images.
    """
    try:
        tour = Tour.objects.get(id=tour_id)
    except Tour.DoesNotExist:
        return Response({"success": False, "error": "Tour not found"}, status=status.HTTP_404_NOT_FOUND)

    ratings = TourRating.objects.filter(tour=tour).order_by('-created_at')  # newest first
    serialized_ratings = []

    for rating in ratings:
        serializer = TourRatingSerializer(rating)
        rating_data = serializer.data

        # Include images for this rating
        images = TourRatingImage.objects.filter(rating=rating)
        rating_data['images'] = [
            request.build_absolute_uri(img.image.url) for img in images
        ]
        serialized_ratings.append(rating_data)

    return Response({"success": True, "ratings": serialized_ratings}, status=status.HTTP_200_OK)
# ------------------------
# All Places
# ------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_places(request):
    try:
        places = Place.objects.all()
        serializer = PlaceSerializer(places, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------
# Filter Options
# ------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_filter_options(request):
    try:
        all_tags = set()
        tours_tags = Tour.objects.values_list('tags', flat=True)
        for tags_list in tours_tags:
            if isinstance(tags_list, list):
                all_tags.update(tags_list)

        transport_options = [
            {"value": choice[0], "label": choice[1]}
            for choice in Transportation.choices
        ]

        response_data = {
            'tags': sorted(list(all_tags)),
            'transportation': transport_options
        }
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------
# Get All Tours with filters
# ------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_tours(request):
    try:
        tours_queryset = Tour.objects.all().order_by('-id')


        # Query params
        search_term = request.GET.get('search')
        location_name = request.GET.get('location')
        price_min = request.GET.get('price_min')
        price_max = request.GET.get('price_max')
        duration_min = request.GET.get('duration_min')
        duration_max = request.GET.get('duration_max')
        group_size = request.GET.get('group_size')
        rating_min = request.GET.get('rating_min')
        transport = request.GET.get('transportation')
        tags = request.GET.get('tags')

        # Filters
        if search_term:
            tours_queryset = tours_queryset.filter(
                Q(name__icontains=search_term) |
                Q(description__icontains=search_term) |
                Q(places__name__icontains=search_term) |
                Q(places__name_en__icontains=search_term)
            ).distinct()

        if location_name:
            tours_queryset = tours_queryset.filter(
                Q(places__name__icontains=location_name) |
                Q(places__name_en__icontains=location_name)
            ).distinct()

        if price_min:
            tours_queryset = tours_queryset.filter(price__gte=price_min)
        if price_max:
            tours_queryset = tours_queryset.filter(price__lte=price_max)

        if duration_min:
            tours_queryset = tours_queryset.filter(duration__gte=duration_min)
        if duration_max:
            tours_queryset = tours_queryset.filter(duration__lte=duration_max)

        if group_size:
            tours_queryset = tours_queryset.filter(min_people__lte=group_size, max_people__gte=group_size)

        if rating_min:
            tours_queryset = tours_queryset.filter(rating__gte=rating_min)

        if transport:
            transport_list = transport.split(',')
            tours_queryset = tours_queryset.filter(transportation__in=transport_list)

        if tags:
            # Split, strip, and lowercase query tags
            tags_list = [t.strip().lower() for t in tags.split(',') if t.strip()]
            q_filter = Q()
            for tag in tags_list:
                # Use icontains for case-insensitive match in JSON array
                q_filter |= Q(tags__icontains=tag)
            tours_queryset = tours_queryset.filter(q_filter).distinct()

        # Build response
        response_data = []
        for tour in tours_queryset:
            images = TourImage.objects.filter(tour=tour)
            thumbnail = images.filter(isthumbnail=True).first()
            image_obj = thumbnail or images.first()
            image_url = request.build_absolute_uri(image_obj.image.url) if image_obj else \
                "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=300&fit=crop"

            places = tour.places.all()  # get all related places
            if places:
                # Extract English names
                names = [p.name_en.split(',')[0] for p in places]
                # Take at most 4 names
                names = names[:4]
                # Join with '-'
                location_str = " - ".join(names)
            else:
                location_str = "Many Places"

            response_data.append({
                'id': tour.id,
                'title': tour.name,
                'price': tour.price,
                'rating': tour.average_rating(),
                'reviews': tour.rating_count,
                'duration': tour.duration,
                'groupSize': f"{tour.min_people}-{tour.max_people} people",
                'transportation': tour.transportation,
                'tags': tour.tags,
                'image': image_url,
                'location': location_str,
                'description': tour.description,
            })

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        print("Error in get_all_tours:", e)  # debug
        return Response([], status=status.HTTP_200_OK)  # luôn trả về list


# ------------------------
# Popular Destinations
# ------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_popular_destinations(request):
    try:
        # Count number of tours per place
        popular_places = Place.objects.annotate(
            tour_count=Count('tours')  # <-- use the related_name of ManyToManyField
        ).filter(tour_count__gt=0).order_by('-tour_count')[:6]

        response_data = []
        for place in popular_places:
            image_url = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=300&fit=crop"
            first_tour = place.tours.first()
            if first_tour:
                image_obj = TourImage.objects.filter(tour=first_tour).first()
                if image_obj:
                    image_url = request.build_absolute_uri(image_obj.image.url)

            response_data.append({
                'id': place.id,
                'name': place.name,
                'name_en': place.name_en,
                'tour_count': place.tour_count,
                'image': image_url
            })

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)