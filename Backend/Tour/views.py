from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from .models import Tour, Place, TourImage
from .serializers import TourSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, parser_classes, permission_classes
from django.conf import settings
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
                lat=p['lat'], lon=p['lon'],
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