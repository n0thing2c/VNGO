from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from Management.models import Booking, PastTour, BookingStatus
from Profiles.models import Guide, Tourist
import json
from rest_framework import status
from .models import Tour, Place, TourImage, Transportation, TourPlace, TourRating, TourRatingImage
from .serializers import TourSerializer, PlaceSerializer, TourRatingSerializer, TourImageSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, parser_classes, permission_classes
from django.db.models import Count, Q, F, FloatField, ExpressionWrapper, Case, When, Value
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

        # Assign the guide automatically
        guide_profile = getattr(request.user, 'guide_profile', None)
        if not guide_profile:
            return Response(
                {"success": False, "error": "You are not authorized to post tours"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        # Save simple fields
        serializer = TourSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        tour = serializer.save(guide=guide_profile)
        # --- Tags ---
        tags = data.get('tags')
        if tags:
            try:
                tour.tags = json.loads(tags)
                tour.save()
            except json.JSONDecodeError:
                tour.tags = []
                tour.save()

        # --- Stops Descriptions ---
        stops_descriptions = data.get('stops_descriptions')
        if stops_descriptions:
            try:
                if isinstance(stops_descriptions, str):
                    tour.stops_descriptions = json.loads(stops_descriptions)
                else:
                    tour.stops_descriptions = stops_descriptions
                tour.save()
            except json.JSONDecodeError:
                tour.stops_descriptions = []
                tour.save()
        else:
            tour.stops_descriptions = []
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
        for idx, place in enumerate(place_instances):
            TourPlace.objects.create(tour=tour, place=place, order=idx)

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

    if not hasattr(request.user, 'guide_profile'):
        return Response({'success': False, 'error': 'Permission denied'}, status=403)

    now = timezone.now()

    has_active_accepted_bookings = tour.bookings.filter(
        status=BookingStatus.ACCEPTED
    ).filter(
        Q(tour_date__gt=now.date()) |  # future date
        Q(tour_date=now.date(), tour_time__gte=now.time())  # today but time not passed
    ).exists()

    if has_active_accepted_bookings:
        return Response(
            {
                'success': False,
                'error': 'This tour cannot be edited because it has upcoming accepted bookings.'
            },
            status=403
        )

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

    # --- Stops Descriptions ---
    stops_descriptions = data.get('stops_descriptions')
    if stops_descriptions is not None:
        try:
            if isinstance(stops_descriptions, str):
                tour.stops_descriptions = json.loads(stops_descriptions)
            else:
                tour.stops_descriptions = stops_descriptions
        except json.JSONDecodeError:
            tour.stops_descriptions = []
    # If stops_descriptions is not provided, keep existing value (partial update)
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

@api_view(['DELETE'])
@permission_classes([AllowAny])
def tour_delete(request, tour_id):
    try:
        tour = Tour.objects.get(pk=tour_id)
    except Tour.DoesNotExist:
        return Response({'success': False, 'error': 'Tour not found'}, status=404)

    # Only guide who owns the tour can delete
    if not hasattr(request.user, 'guide_profile') or tour.guide != request.user.guide_profile:
        return Response({'success': False, 'error': 'Permission denied'}, status=403)

    # --- Force delete the tour (cascades to related objects) ---
    tour.delete()

    return Response({'success': True, 'message': 'Tour deleted successfully.'}, status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def guide_get_all_tours(request, guide_id):
    """
    Get all tours created by a specific guide, formatted for TourCard.
    """
    try:
        guide = Guide.objects.get(pk=guide_id)
    except Guide.DoesNotExist:
        return Response({'success': False, 'error': 'Guide not found'}, status=404)

    try:
        tours = Tour.objects.filter(guide=guide).order_by('-id')  # latest first
        serializer = TourSerializer(tours, many=True, context={'request': request})
        tours_data = []

        for t in serializer.data:
            tours_data.append({
                "id": t['id'],
                "title": t['name'],
                "description": t['description'],
                "image": t['tour_images'][0]['image'] if t.get('tour_images') else "https://placehold.co/400x300/60a5fa/ffffff?text=Tour+Image",
                "rating": t.get('average_rating', 0),
                "reviews": t.get('rating_count', 0),
                "duration": t['duration'],
                "groupSize": t['max_people'],
                "min_people": t['min_people'],
                "max_people": t['max_people'],
                "transportation": t['transportation'],
                "price": t['price'],
            })

        return Response({'success': True, 'tours': tours_data})

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
    total_bookings= Booking.objects.filter(tour=tour).count()
    accepted_bookings = Booking.objects.filter(tour=tour,status='accepted').count()

    if total_bookings > 0 and(accepted_bookings/total_bookings >= 0.7):
        achievements.append("Popular")

    # Highly Rated: 4+ stars
    avg_rating = tour.average_rating()  # uses your model method
    if avg_rating >= 4:
        achievements.append("Highly Rated")

    # Multilingual: Tour guide knows 3+ languages
    guide = tour.guide
    if guide and guide.languages and len(guide.languages) >= 3:
        achievements.append("Multilingual")

    # Budget: price < 300k
    if tour.price <= 300_000:
        achievements.append("Budget")

    # Luxury: price > 1,000,000
    if tour.price >= 1_000_000:
        achievements.append("Luxury")

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

    tourist_profile = getattr(request.user, 'tourist_profile', None)
    if tourist_profile is None:
        return Response({"success": False, "error": "User is not a tourist"}, status=403)

        # Prevent duplicate ratings
    if TourRating.objects.filter(tour=tour, tourist=tourist_profile).exists():
        return Response({"success": False, "error": "You already rated this tour"}, status=400)

    has_completed = PastTour.objects.filter(
        tourist=tourist_profile,
        tour=tour
    ).exists()

    if not has_completed:
        return Response(
            {"success": False, "error": "You can only rate tours you have completed"},
            status=403
        )

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
        rating_instance = serializer.save(tour=tour, tourist=tourist_profile)

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

    ratings = (
        TourRating.objects
        .filter(tour=tour)
        .prefetch_related('images')  # <-- Important: use prefetched images
        .order_by('-created_at')
    )
    serialized_ratings = []

    for rating in ratings:
        serializer = TourRatingSerializer(rating)
        rating_data = serializer.data

        # Include images for this rating
        rating_data['images'] = [
            request.build_absolute_uri(img.image.url)
            for img in rating.images.all()
        ]
        serialized_ratings.append(rating_data)

    return Response({"success": True, "ratings": serialized_ratings}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def guide_get_all_tour_ratings(request, guide_id):
    """
    Get all ratings for all tours created by a specific guide.
    Returns serialized rating data including images and tour info.
    """
    try:
        guide = Guide.objects.get(pk=guide_id)
    except Guide.DoesNotExist:
        return Response({'success': False, 'error': 'Guide not found'}, status=status.HTTP_404_NOT_FOUND)

    ratings = TourRating.objects.filter(tour__guide=guide).order_by('-created_at')
    serialized_ratings = []

    for rating in ratings:
        serializer = TourRatingSerializer(rating, context={'request': request})
        data = serializer.data

        # Include images for this rating
        images = TourRatingImage.objects.filter(rating=rating)
        data['images'] = [request.build_absolute_uri(img.image.url) for img in images]

        # Include tour info
        data['tour'] = {
            'id': rating.tour.id,
            'name': rating.tour.name,
        }

        serialized_ratings.append(data)

    return Response({
        'success': True,
        'ratings': serialized_ratings,
    }, status=status.HTTP_200_OK)

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
# Top Reviews
# ------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_top_reviews(request):
    try:
        # Fetch top rated reviews (4 or 5 stars), ordered by newest first
        reviews = TourRating.objects.filter(rating__gte=4).order_by('-created_at')[:6]
        
        response_data = []
        for review in reviews:
            tourist = review.tourist
            response_data.append({
                'id': review.id,
                'rating': review.rating,
                'text': review.review,
                'tourist_name': tourist.name if tourist else "Anonymous",
                'tourist_image': tourist.face_image if tourist and tourist.face_image else "https://ui-avatars.com/api/?name=Anonymous",
                'tour_name': review.tour.name,
                'created_at': review.created_at
            })
            
        return Response({'success': True, 'reviews': response_data}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------
# Get All Tours with filters
# ------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_tours(request):
    try:
        tours_queryset = Tour.objects.all()


        # Query params
        # search_term = request.GET.get('search')
        location_name = request.GET.get('location')
        price_min = request.GET.get('price_min')
        price_max = request.GET.get('price_max')
        duration_min = request.GET.get('duration_min')
        duration_max = request.GET.get('duration_max')
        group_size = request.GET.get('group_size')
        rating_min = request.GET.get('rating_min')
        transport = request.GET.get('transportation')
        tags = request.GET.get('tags')

        guide_gender = request.GET.get('guide_gender')
        guide_language = request.GET.get('guide_language')

        # Filters
        # if search_term:
        #     tours_queryset = tours_queryset.filter(
        #         Q(name__icontains=search_term) |
        #         Q(description__icontains=search_term) |
        #         Q(places__name__icontains=search_term) |
        #         Q(places__name_en__icontains=search_term) |
        #         Q(places__city__icontains=search_term) |
        #         Q(places__city_en__icontains=search_term) |
        #         Q(places__province__icontains=search_term) |
        #         Q(places__province_en__icontains=search_term)
        #     ).distinct()

        if location_name: # Location filter
            tours_queryset = tours_queryset.filter(
                Q(places__city__icontains=location_name) |
                Q(places__city_en__icontains=location_name) |
                Q(places__province__icontains=location_name) |
                Q(places__province_en__icontains=location_name)
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
            # Filter based on average rating
            # (Assumes rating > 0, rates > 0)
            try:
                min_r = int(rating_min)
                if min_r > 0:
                    tours_queryset = tours_queryset.filter(
                        rating_count__gt=0, 
                        rating_total__gte=(min_r * F('rating_count'))
                    )
            except (ValueError, TypeError):
                pass # Skip if rating_min is invalid

        if transport:
            transport_list = transport.split(',')
            tours_queryset = tours_queryset.filter(transportation__in=transport_list)

        if tags:
            # Split, strip, and lowercase query tags
            tags_list = [t.strip().lower() for t in tags.split(',') if t.strip()]
            q_filter = Q()
            for tag in tags_list:
                # Use icontains for case-insensitive match in JSON array
                tours_queryset = tours_queryset.filter(tags__icontains=tag)
            tours_queryset = tours_queryset.filter(q_filter).distinct()

        if guide_gender:
            tours_queryset = tours_queryset.filter(guide__gender__iexact=guide_gender)
        if guide_language:
            tours_queryset = tours_queryset.filter(guide__languages__icontains=guide_language)

        # -------------------
        # Sorting
        # -------------------
        sort_option = request.GET.get('sort', '')
        # Only annotate avg_rating if needed
        if sort_option in ['rating_asc', 'rating_desc']:
            tours_queryset = tours_queryset.annotate(
                avg_rating=ExpressionWrapper(
                    Case(
                        When(rating_count__lte=0, then=Value(0.0)),
                        default=F('rating_total') * 1.0 / F('rating_count'),  # cast to float
                    ),
                    output_field=FloatField()
                )
            )
        if sort_option == 'price_asc':
            tours_queryset = tours_queryset.order_by('price')
        elif sort_option == 'price_desc':
            tours_queryset = tours_queryset.order_by('-price')
        elif sort_option == 'duration_asc':
            tours_queryset = tours_queryset.order_by('duration')
        elif sort_option == 'duration_desc':
            tours_queryset = tours_queryset.order_by('-duration')
        elif sort_option == 'rating_asc':
            tours_queryset = tours_queryset.order_by('avg_rating')
        elif sort_option == 'rating_desc':
            tours_queryset = tours_queryset.order_by('-avg_rating')
        else:
            tours_queryset = tours_queryset.order_by('-id')  # default newest first

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

            average_rating = round(tour.average_rating(), 1)
            response_data.append({
                'id': tour.id,
                'title': tour.name,
                'price': tour.price,
                'rating': average_rating,
                'reviews': tour.rating_count, # number of reviews
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
        return Response([], status=status.HTTP_200_OK)  # Always return a list


# ------------------------
# Popular Destinations
# ------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def get_popular_destinations(request):
    try:
        # 1. Group Places by 'province_en' (data is already clean)
        #    and count the number of 'distinct' (unique) tours related to each province.
        # Add exclude to remove Places that don't have province names filled in
        popular_provinces = Place.objects.exclude(
            Q(province_en__isnull=True) | Q(province_en="")
        ).values('province', 'province_en').annotate(
            tour_count=Count('tours', distinct=True)
        ).filter(tour_count__gt=0).order_by('-tour_count')[:6]

        response_data = []

        # 2. Get representative image for each province
        for province in popular_provinces:
            # image_url = "https://unsplash.com/photos/aerial-view-of-cars-on-road-during-daytime-5QbZIJV8k4E"
            
            # # 3. Find any tour in this province to get an image
            # #    Find the first Place in this 'province' that HAS a tour
            # first_place_in_province = Place.objects.filter(
            #     province_en=province['province_en'], 
            #     tours__isnull=False
            # ).first()

            # if first_place_in_province:
            #     # Get the first tour of that place
            #     first_tour = first_place_in_province.tours.first()
            #     if first_tour:
            #         # Get the first image of that tour
            #         image_obj = TourImage.objects.filter(tour=first_tour).first()
            #         if image_obj:
            #             image_url = request.build_absolute_uri(image_obj.image.url)

            response_data.append({
                # Use province_en as 'id' or key for React
                'id': province['province_en'], 
                'name': province['province'], # Vietnamese name
                'name_en': province['province_en'], # English name
                'tour_count': province['tour_count'],
                # 'image': image_url
            })

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_provinces(request):
    try:
        # Get province and province_en values, and remove duplicates
        provinces = Place.objects.values('province', 'province_en').distinct().order_by('province_en')
        # Format data for easier use in frontend
        response_data = [
            {'province_vi': p['province'], 'province_en': p['province_en']}
            for p in provinces if p['province_en'] # Ensure we don't get null values
        ]
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------
# My Tours (For Guide Management Page)
# ------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_tours(request):
    """
    Get all tours created by the authenticated guide.
    For Guide Management Page - My Tours section.
    """
    try:
        # Check if user is a guide
        guide_profile = getattr(request.user, 'guide_profile', None)
        if not guide_profile:
            return Response(
                {'success': False, 'error': 'Only guides can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all tours by this guide
        tours_queryset = Tour.objects.filter(guide=guide_profile).order_by('-id')
        
        # Build response with tour details
        response_data = []
        for tour in tours_queryset:
            # Get thumbnail image
            images = TourImage.objects.filter(tour=tour)
            thumbnail = images.filter(isthumbnail=True).first()
            image_obj = thumbnail or images.first()
            image_url = request.build_absolute_uri(image_obj.image.url) if image_obj else None
            
            # Get location string
            tour_places = tour.tour_places.select_related('place').all()
            if tour_places:
                names = [tp.place.name_en.split(',')[0] for tp in tour_places]
                names = names[:4]
                location_str = " - ".join(names)
            else:
                location_str = "Many Places"
            
            # Get booking statistics for this tour
            from Management.models import Booking, BookingStatus
            from django.utils import timezone
            
            total_bookings = Booking.objects.filter(tour=tour, tour_date__gte=timezone.now().date()).count()
            pending_bookings = Booking.objects.filter(
                tour=tour, 
                status=BookingStatus.PENDING,
                tour_date__gte=timezone.now().date()
            ).count()
            accepted_bookings = Booking.objects.filter(
                tour=tour,
                status=BookingStatus.ACCEPTED,
                tour_date__gte=timezone.now().date()
            ).count()
            
            average_rating = round(tour.average_rating(), 1)
            
            response_data.append({
                'id': tour.id,
                'title': tour.name,
                'price': tour.price,
                'rating': average_rating,
                'reviews': tour.rating_count,
                'duration': tour.duration,
                'groupSize': f"{tour.min_people}-{tour.max_people} people",
                'transportation': tour.transportation,
                'tags': tour.tags,
                'image': image_url,
                'location': location_str,
                'description': tour.description,
                # Booking statistics
                'bookings': {
                    'total': total_bookings,
                    'pending': pending_bookings,
                    'accepted': accepted_bookings,
                }
            })
        
        return Response({
            'success': True,
            'tours': response_data,
            'count': len(response_data)
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)