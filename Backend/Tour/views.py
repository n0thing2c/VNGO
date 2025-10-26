import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import Tour, Place, TourImage
from django.db import transaction

@csrf_exempt
@require_POST
@transaction.atomic
def create_tour(request):
    try:
        name = request.POST.get('name')
        duration = int(request.POST.get('duration'))
        min_people = int(request.POST.get('min_people'))
        max_people = int(request.POST.get('max_people'))
        transportation = request.POST.get('transportation')
        meeting_location = request.POST.get('meeting_location')
        price = int(request.POST.get('price'))
        tags_json = request.POST.get('tags', '[]')
        tags = json.loads(tags_json)
        description = request.POST.get('description')
        # Create tour
        tour = Tour.objects.create(
            name=name,
            duration=duration,
            min_people=min_people,
            max_people=max_people,
            transportation=transportation,
            meeting_location=meeting_location,
            price=price,
            tags=tags,
            description=description,
        )

        # Save places
        places_data = json.loads(request.POST.get('places', '[]'))
        for p in places_data:
            place, _ = Place.objects.get_or_create(
                lat=p['lat'], lng=p['lon'], name=p['name'], name_en=p['name_en'],
            )
            tour.places.add(place)

        # Save images
        images = request.FILES.getlist('images')
        thumb_idx = int(request.POST.get('thumbnail_idx', 0))
        for i, img in enumerate(images):
            TourImage.objects.create(
                tour=tour,
                image=img,
                isthumbnail=(i == thumb_idx),
            )

        return JsonResponse({'success': True, 'tour_id': tour.id})

    except Exception as e:
        print("Error:", e)
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
