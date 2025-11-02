from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from .models import Tour, Place, TourImage, Transportation
from .serializers import TourSerializer, PlaceSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, parser_classes, permission_classes
from django.conf import settings
from django.db.models import Count # for get get_popular_tours()
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@transaction.atomic
def create_tour(request):
    try:
        data = request.data.copy()

        serializer = TourSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        tour = serializer.save()

        # Save places
        import json
        places_data = data.get('places', '[]')
        if isinstance(places_data, str):
            places_data = json.loads(places_data)

        for p in places_data:
            place, _ = Place.objects.get_or_create(
                lat=p['lat'], lng=p['lon'],
                name=p['name'], name_en=p['name_en']
            )
            tour.places.add(place)

        # Save images
        images = request.FILES.getlist('images')
        thumb_idx = int(data.get('thumbnail_idx', 0))
        for i, img in enumerate(images):
            TourImage.objects.create(
                tour=tour,
                image=img,
                isthumbnail=(i == thumb_idx),
            )

        return Response({'success': True, 'tour_id': tour.id})

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def load_tour(request, tour_id):
    try:
        tour = Tour.objects.get(pk=tour_id)
        serializer = TourSerializer(tour)

        places = tour.places.all().values('id', 'name', 'name_en', 'lat', 'lon')
        images = TourImage.objects.filter(tour=tour).values('id', 'image', 'isthumbnail')

        response_data = {
            'tour': serializer.data,
            'places': list(places),
            'images': [
                {
                    **img,
                    'image': request.build_absolute_uri(
                        settings.MEDIA_URL + img['image'].lstrip('/')
                    )
                }
                for img in images
            ],
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Tour.DoesNotExist:
        return Response({'success': False, 'error': 'Tour not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_places(request):
    """
    API view lấy danh sách tất cả các địa điểm (Place)
    sử dụng DRF Serializer.
    """
    try:
        # 1. Lấy tất cả object, không dùng .values() nữa
        places = Place.objects.all()
        
        # 2. Dùng serializer để chuyển đổi data
        #    many=True là bắt buộc vì đây là một danh sách (QuerySet)
        serializer = PlaceSerializer(places, many=True)
        
        # 3. Trả về bằng Response của DRF
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'success': False, 'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_filter_options(request):
    """
    API view mới: Lấy các tùy chọn cho bộ lọc.
    Trả về tất cả các tags đang có và các loại phương tiện.
    """
    try:
        # 1. Lấy tất cả các tags từ database
        all_tags = set()
        tours_tags = Tour.object.value_list('tags', flat=True)
        for tags_list in tours_tags:
            if isinstance(tags_list, list):
                all_tags.update(tags_list)
        # 2. Lấy các lựa chọn transportation từ model
        transport_options = [
            {"values": choice[0], "label": choice[1]}
            for choice in Transportation.choices
        ]

        response_data = {
            'tags': sorted(list(all_tags)),
            'transportation': transport_options
        }
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_tours(request):
    """
    API view (ĐÃ NÂNG CẤP): Lấy danh sách tour
    với đầy đủ filter và data rating thật.
    """
    try:
        tours_queryset = Tour.objects.all().order_by('-created_at')

        # --- Lấy các tham số filter từ query params ---
        search_term = request.query_params.get('search', None)
        location_name = request.query_params.get('location', None)
        
        # Filter giá
        price_min = request.query_params.get('price_min', None)
        price_max = request.query_params.get('price_max', None)
        
        # Filter thời lượng (duration)
        duration_min = request.query_params.get('duration_min', None)
        duration_max = request.query_params.get('duration_max', None)
        
        # Filter số người (group size)
        group_size = request.query_params.get('group_size', None)
        
        # Filter rating (tối thiểu)
        rating_min = request.query_params.get('rating_min', None)
        
        # Filter phương tiện (có thể chọn nhiều)
        transport = request.query_params.get('transportation', None)
        
        # Filter tags (có thể chọn nhiều)
        tags = request.query_params.get('tags', None)

        # --- Áp dụng logic filter ---
        
        # 1. Search (tên tour, mô tả, tên địa điểm)
        if search_term:
            tours_queryset = tours_queryset.filter(
                Q(name__icontains=search_term) |
                Q(description__icontains=search_term) |
                Q(places__name__icontains=search_term)
            ).distinct()

        # 2. Địa điểm
        if location_name:
            tours_queryset = tours_queryset.filter(places__name__icontains=location_name).distinct()
        
        # 3. Giá
        if price_min:
            tours_queryset = tours_queryset.filter(price__gte=price_min)
        if price_max:
            tours_queryset = tours_queryset.filter(price__lte=price_max)

        # 4. Thời lượng (duration là integer, vd: 3 ngày)
        if duration_min:
            tours_queryset = tours_queryset.filter(duration__gte=duration_min)
        if duration_max:
            tours_queryset = tours_queryset.filter(duration__lte=duration_max)
            
        # 5. Số người (vd: user muốn đi 5 người, thì 5 phải nằm trong [min_people, max_people])
        if group_size:
            tours_queryset = tours_queryset.filter(
                min_people__lte=group_size, 
                max_people__gte=group_size
            )

        # 6. Rating (vd: rating_min=4 -> lấy tour có rating >= 4)
        if rating_min:
            tours_queryset = tours_queryset.filter(rating__gte=rating_min)

        # 7. Phương tiện (vd: transportation=public,private)
        if transport:
            transport_list = transport.split(',')
            tours_queryset = tours_queryset.filter(transportation__in=transport_list)

        # 8. Tags (vd: tags=food,history)
        if tags:
            tags_list = tags.split(',')
            for tag in tags_list:
                tours_queryset = tours_queryset.filter(tags__contains=tag) # Lọc JSONField

        # --- Chuẩn bị data trả về (với rating thật) ---
        response_data = []
        for tour in tours_queryset:
            
            # Lấy thumbnail
            images = TourImage.objects.filter(tour=tour)
            thumbnail = images.filter(isthumbnail=True).first()
            image_obj = thumbnail if thumbnail else images.first()
            
            if image_obj:
                image_url = request.build_absolute_uri(image_obj.image.url)
            else:
                image_url = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=300&fit=crop" # Ảnh dự phòng

            # Lấy tên địa điểm đầu tiên
            first_place = tour.places.first()
            location_str = first_place.name if first_place else "Nhiều địa điểm"

            # Build data cho frontend
            tour_data = {
                'id': tour.id,
                'title': tour.name, # Frontend đang dùng 'title'
                'price': tour.price,
                'rating': tour.rating,   # <-- RATING THẬT
                'reviews': tour.rates, # <-- RATES THẬT (frontend dùng 'reviews')
                'duration': tour.duration, # vd: 3 (cho 3 ngày)
                'groupSize': f"{tour.min_people}-{tour.max_people} người",
                'transportation': tour.transportation,
                'tags': tour.tags,
                'image': image_url,
                'location': location_str,
                # Thêm các trường khác mà frontend TourSearchPage cần
                'description': tour.description,
                # 'departure': tour.meeting_location, # Bạn có thể map trường này nếu cần
            }
            response_data.append(tour_data)

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_popular_destinations(request):
    """
    API view mới: Lấy danh sách các địa điểm (Place) phổ biến nhất,
    dựa trên số lượng tour liên quan.
    """
    try:
        # 1. Đếm số tour cho mỗi Place, lọc ra những Place có tour
        popular_places = Tour.objects.annotate(
            tour_count = Count('tours')
        ).filter(tour_count__gt=0).order_by('-tour_count')
        
        # 2. Lấy top 6 (bạn có thể đổi số này)
        popular_places = popular_places[:6] 

        # 3. Build data trả về, kèm ảnh đại diện từ tour đầu tiên
        response_data = []
        for place in popular_places:
            image_url = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=300&fit=crop" # Ảnh dự phòng
            
            # Lấy tour đầu tiên của địa điểm này để làm ảnh đại diện
            first_tour = place.tours.first()
            if first_tour:
                # Lấy ảnh (thumbnail hoặc bất kỳ) của tour đó
                image_obj = TourImage.objects.filter(tour=first_tour).first()
                if image_obj:
                    image_url = request.build_absolute_uri(image_obj.image.url)

            response_data.append({
                'id': place.id,
                'name': place.name,
                'name_en': place.name_en,
                'tour_count': place.tour_count,
                'image': image_url  # Trả về URL ảnh
            })

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)