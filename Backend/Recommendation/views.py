from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from datetime import datetime, timedelta

from .models import (
    UserPreference,
    TourViewHistory,
    SearchHistory,
    TripPlan,
    TripPlanDay,
    TripPlanItem,
    HotelSuggestion,
    TourInteraction,
)
from .serializers import (
    UserPreferenceSerializer,
    TourViewHistorySerializer,
    SearchHistorySerializer,
    TripPlanSerializer,
    TripPlanCreateSerializer,
    TripPlanModifySerializer,
    HotelSuggestionSerializer,
    TourInteractionSerializer,
    TourRecommendationRequestSerializer,
    SimilarToursRequestSerializer,
)
from .services.trip_planner import TripPlannerService
from .services.hotel_service import HotelService


class TripPlannerView(APIView):
    """
    API endpoint for generating and managing trip plans.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Generate a new trip plan.
        
        POST /api/recommendation/trip-plan/
        {
            "province": "Ho Chi Minh",
            "num_days": 3,
            "budget": 5000000,
            "num_people": 2,
            "preferred_tags": ["food", "culture"],
            "start_date": "2024-01-15"  // optional
        }
        """
        serializer = TripPlanCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Generate trip plan
        planner = TripPlannerService()
        result = planner.generate_trip_plan(
            province=data['province'],
            num_days=data['num_days'],
            budget=data['budget'],
            num_people=data.get('num_people', 1),
            place_ids=data.get('place_ids'),
            preferred_tags=data.get('preferred_tags'),
            user_id=request.user.id,
            max_hours_per_day=data.get('max_hours_per_day', 10),
            start_date=data.get('start_date'),
        )
        
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        
        # Get hotel suggestions
        hotel_service = HotelService()
        hotels = hotel_service.get_hotels_for_trip(result)
        result['hotels'] = hotels
        
        # Save search history
        SearchHistory.objects.create(
            user=request.user,
            province=data['province'],
            tags=data.get('preferred_tags', []),
            num_days=data['num_days'],
            budget=data['budget'],
            results_count=result.get('tours_included', 0),
        )
        
        return Response(result, status=status.HTTP_200_OK)


class TripPlanSaveView(APIView):
    """
    Save a generated trip plan to the database.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Save a trip plan.
        
        POST /api/recommendation/trip-plan/save/
        {
            "name": "My Saigon Trip",
            "plan_data": { ... }  // The generated plan from TripPlannerView
        }
        """
        plan_data = request.data.get('plan_data', {})
        name = request.data.get('name', '')
        
        if not plan_data or not plan_data.get('days'):
            return Response(
                {'error': 'Invalid plan data'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Create TripPlan
            trip_plan = TripPlan.objects.create(
                user=request.user,
                name=name or f"Trip to {plan_data.get('province', 'Unknown')}",
                province=plan_data.get('province', ''),
                place_ids=plan_data.get('place_ids', []),
                num_days=plan_data.get('num_days', 1),
                budget=plan_data.get('budget', 0),
                num_people=plan_data.get('num_people', 1),
                preferred_tags=plan_data.get('preferred_tags', []),
                total_estimated_cost=plan_data.get('total_cost', 0),
                total_duration_hours=plan_data.get('total_duration', 0),
                status='saved',
            )
            
            # Create days and items
            for day_data in plan_data.get('days', []):
                day = TripPlanDay.objects.create(
                    trip_plan=trip_plan,
                    day_number=day_data.get('day_number', 1),
                    date=day_data.get('date'),
                )
                
                for tour_data in day_data.get('tours', []):
                    from Tour.models import Tour
                    try:
                        tour = Tour.objects.get(id=tour_data.get('id'))
                        
                        # Parse start time if provided
                        start_time = None
                        if tour_data.get('suggested_start_time'):
                            try:
                                start_time = datetime.strptime(
                                    tour_data['suggested_start_time'], '%H:%M'
                                ).time()
                            except ValueError:
                                pass
                        
                        TripPlanItem.objects.create(
                            trip_plan_day=day,
                            tour=tour,
                            order=tour_data.get('order', 0),
                            suggested_start_time=start_time,
                            recommendation_score=tour_data.get('recommendation_score', 0),
                            recommendation_reason=', '.join(tour_data.get('recommendation_reasons', [])),
                            is_user_added=tour_data.get('is_user_added', False),
                        )
                    except Tour.DoesNotExist:
                        continue
            
            # Save hotel suggestions
            for hotel_data in plan_data.get('hotels', []):
                HotelSuggestion.objects.create(
                    trip_plan=trip_plan,
                    external_id=hotel_data.get('external_id', ''),
                    name=hotel_data.get('name', ''),
                    address=hotel_data.get('address', ''),
                    latitude=hotel_data.get('latitude'),
                    longitude=hotel_data.get('longitude'),
                    price_per_night=hotel_data.get('price_per_night', 0),
                    currency=hotel_data.get('currency', 'VND'),
                    rating=hotel_data.get('rating'),
                    review_count=hotel_data.get('review_count', 0),
                    thumbnail_url=hotel_data.get('thumbnail_url', ''),
                    booking_url=hotel_data.get('booking_url', ''),
                    source=hotel_data.get('source', 'mock'),
                    distance_to_center=hotel_data.get('distance_to_center'),
                    match_score=hotel_data.get('match_score', 0),
                )
        
        serializer = TripPlanSerializer(trip_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TripPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing saved trip plans.
    """
    serializer_class = TripPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TripPlan.objects.filter(user=self.request.user).prefetch_related(
            'days__items__tour',
            'hotel_suggestions',
        )
    
    @action(detail=True, methods=['post'])
    def modify(self, request, pk=None):
        """
        Modify a trip plan (add/remove/swap tours).
        
        POST /api/recommendation/trip-plans/{id}/modify/
        {
            "action": "swap",
            "day_number": 1,
            "tour_id": 123,
            "new_tour_id": 456
        }
        """
        trip_plan = self.get_object()
        serializer = TripPlanModifySerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        action = data['action']
        day_number = data['day_number']
        
        try:
            day = trip_plan.days.get(day_number=day_number)
        except TripPlanDay.DoesNotExist:
            return Response(
                {'error': f'Day {day_number} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from Tour.models import Tour
        
        if action == 'add':
            tour = get_object_or_404(Tour, id=data['tour_id'])
            
            # Check if already in plan
            if TripPlanItem.objects.filter(
                trip_plan_day__trip_plan=trip_plan,
                tour=tour
            ).exists():
                return Response(
                    {'error': 'Tour already in plan'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            max_order = day.items.aggregate(max_order=models.Max('order'))['max_order'] or 0
            TripPlanItem.objects.create(
                trip_plan_day=day,
                tour=tour,
                order=max_order + 1,
                is_user_added=True,
            )
        
        elif action == 'remove':
            TripPlanItem.objects.filter(
                trip_plan_day=day,
                tour_id=data['tour_id']
            ).delete()
            
            # Reorder remaining items
            for i, item in enumerate(day.items.order_by('order'), start=1):
                item.order = i
                item.save()
        
        elif action == 'swap':
            item = get_object_or_404(TripPlanItem, trip_plan_day=day, tour_id=data['tour_id'])
            new_tour = get_object_or_404(Tour, id=data['new_tour_id'])
            
            item.tour = new_tour
            item.is_user_added = True
            item.save()
        
        # Recalculate totals
        self._recalculate_totals(trip_plan)
        
        serializer = TripPlanSerializer(trip_plan)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """
        Generate a share link for the trip plan.
        """
        trip_plan = self.get_object()
        trip_plan.is_public = True
        token = trip_plan.generate_share_token()
        
        return Response({
            'share_token': token,
            'share_url': f"/trip-plan/shared/{token}",
        })
    
    @action(detail=True, methods=['get'])
    def alternatives(self, request, pk=None):
        """
        Get alternative tours for a day.
        
        GET /api/recommendation/trip-plans/{id}/alternatives/?day=1
        """
        trip_plan = self.get_object()
        day_number = int(request.query_params.get('day', 1))
        
        planner = TripPlannerService()
        
        # Convert trip plan to dict format
        plan_dict = {
            'province': trip_plan.province,
            'num_days': trip_plan.num_days,
            'budget': trip_plan.budget,
            'num_people': trip_plan.num_people,
            'preferred_tags': trip_plan.preferred_tags,
            'budget_remaining': trip_plan.budget - trip_plan.total_estimated_cost,
            'days': [],
        }
        
        for day in trip_plan.days.all():
            day_dict = {
                'day_number': day.day_number,
                'tours': [],
                'total_duration': 0,
            }
            for item in day.items.filter(is_user_removed=False):
                day_dict['tours'].append({
                    'id': item.tour.id,
                    'duration': item.tour.duration,
                })
                day_dict['total_duration'] += item.tour.duration
            plan_dict['days'].append(day_dict)
        
        alternatives = planner.get_alternative_tours(plan_dict, day_number)
        
        return Response(alternatives)
    
    def _recalculate_totals(self, trip_plan):
        """Recalculate cost and duration totals."""
        total_cost = 0
        total_duration = 0
        
        for day in trip_plan.days.all():
            for item in day.items.filter(is_user_removed=False):
                total_cost += item.tour.price * trip_plan.num_people
                total_duration += item.tour.duration
        
        trip_plan.total_estimated_cost = total_cost
        trip_plan.total_duration_hours = total_duration
        trip_plan.save()


class SharedTripPlanView(APIView):
    """
    View a shared trip plan (public access).
    """
    permission_classes = [AllowAny]
    
    def get(self, request, share_token):
        """
        GET /api/recommendation/trip-plan/shared/{share_token}/
        """
        trip_plan = get_object_or_404(
            TripPlan,
            share_token=share_token,
            is_public=True
        )
        
        serializer = TripPlanSerializer(trip_plan)
        return Response(serializer.data)


class TourRecommendationView(APIView):
    """
    Get personalized tour recommendations.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Get tour recommendations based on criteria and user history.
        
        POST /api/recommendation/tours/
        {
            "province": "Ho Chi Minh",
            "tags": ["food", "culture"],
            "price_max": 500000,
            "limit": 10
        }
        """
        serializer = TourRecommendationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Get all tours for fitting the recommender
        from Tour.models import Tour
        all_tours = list(Tour.objects.prefetch_related(
            'tour_places__place',
            'guide',
        ).values())
        
        # Convert to proper format
        tours_data = []
        for tour in Tour.objects.prefetch_related('tour_places__place', 'guide').all():
            places = []
            for tp in tour.tour_places.all():
                place = tp.place
                places.append({
                    'id': place.id,
                    'name': place.name,
                    'province': place.province,
                    'province_en': place.province_en,
                })
            
            tours_data.append({
                'id': tour.id,
                'name': tour.name,
                'duration': tour.duration,
                'price': tour.price,
                'min_people': tour.min_people,
                'max_people': tour.max_people,
                'transportation': tour.transportation,
                'meeting_location': tour.meeting_location,
                'tags': tour.tags if isinstance(tour.tags, list) else [],
                'description': tour.description,
                'rating_total': tour.rating_total,
                'rating_count': tour.rating_count,
                'places': places,
            })
        
        # Initialize and fit recommender
        from .ml.recommender import ContentBasedRecommender
        from .ml.user_profile import UserProfileBuilder, get_user_interaction_history
        
        recommender = ContentBasedRecommender()
        recommender.fit(tours_data)
        
        # Get user profile
        user_profile_vector = None
        try:
            history = get_user_interaction_history(request.user.id)
            if history['viewed'] or history['booked']:
                profile_builder = UserProfileBuilder(recommender.feature_extractor)
                profile = profile_builder.build_profile_from_history(
                    history['viewed'],
                    history['booked'],
                    history['rated'],
                )
                user_profile_vector = profile_builder.build_feature_vector(profile, tours_data)
        except Exception as e:
            print(f"Error building user profile: {e}")
        
        # Get recommendations
        recommendations = recommender.recommend_by_criteria(
            province=data.get('province'),
            tags=data.get('tags'),
            price_min=data.get('price_min'),
            price_max=data.get('price_max'),
            duration_min=data.get('duration_min'),
            duration_max=data.get('duration_max'),
            min_rating=data.get('min_rating'),
            top_k=data.get('limit', 10),
            exclude_ids=data.get('exclude_ids', []),
            user_profile_vector=user_profile_vector,
        )
        
        # Format response
        results = []
        for tour_id, score, tour_data in recommendations:
            # Get thumbnail
            tour = Tour.objects.prefetch_related('tour_images').get(id=tour_id)
            thumbnail = None
            for img in tour.tour_images.all():
                if img.isthumbnail and img.image:
                    thumbnail = img.image.url
                    break
            if not thumbnail:
                first_img = tour.tour_images.first()
                if first_img and first_img.image:
                    thumbnail = first_img.image.url
            
            results.append({
                **tour_data,
                'recommendation_score': round(score, 2),
                'thumbnail': thumbnail,
            })
        
        # Log search
        SearchHistory.objects.create(
            user=request.user,
            province=data.get('province'),
            tags=data.get('tags', []),
            min_price=data.get('price_min'),
            max_price=data.get('price_max'),
            results_count=len(results),
        )
        
        return Response({
            'recommendations': results,
            'count': len(results),
        })


class SimilarToursView(APIView):
    """
    Get tours similar to a given tour.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, tour_id):
        """
        GET /api/recommendation/tours/{tour_id}/similar/
        """
        limit = int(request.query_params.get('limit', 5))
        
        from Tour.models import Tour
        
        # Get the reference tour
        try:
            reference_tour = Tour.objects.get(id=tour_id)
        except Tour.DoesNotExist:
            return Response(
                {'error': 'Tour not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all tours for the recommender
        tours_data = []
        for tour in Tour.objects.prefetch_related('tour_places__place').all():
            places = []
            for tp in tour.tour_places.all():
                place = tp.place
                places.append({
                    'id': place.id,
                    'province_en': place.province_en,
                })
            
            tours_data.append({
                'id': tour.id,
                'name': tour.name,
                'duration': tour.duration,
                'price': tour.price,
                'transportation': tour.transportation,
                'meeting_location': tour.meeting_location,
                'tags': tour.tags if isinstance(tour.tags, list) else [],
                'description': tour.description,
                'rating_total': tour.rating_total,
                'rating_count': tour.rating_count,
                'places': places,
            })
        
        # Get similar tours
        from .ml.recommender import ContentBasedRecommender
        
        recommender = ContentBasedRecommender()
        recommender.fit(tours_data)
        
        similar = recommender.get_similar_tours(tour_id, top_k=limit)
        
        # Format response with thumbnails
        results = []
        for tid, score, tour_data in similar:
            tour = Tour.objects.prefetch_related('tour_images').get(id=tid)
            thumbnail = None
            for img in tour.tour_images.all():
                if img.isthumbnail and img.image:
                    thumbnail = img.image.url
                    break
            
            results.append({
                **tour_data,
                'similarity_score': round(score, 3),
                'thumbnail': thumbnail,
            })
        
        return Response({
            'reference_tour_id': tour_id,
            'similar_tours': results,
        })


class TourViewTrackingView(APIView):
    """
    Track tour views for recommendation improvement.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, tour_id):
        """
        Track a tour view.
        
        POST /api/recommendation/tours/{tour_id}/view/
        {
            "duration": 30  // seconds spent viewing
        }
        """
        from Tour.models import Tour
        
        try:
            tour = Tour.objects.get(id=tour_id)
        except Tour.DoesNotExist:
            return Response(
                {'error': 'Tour not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        duration = request.data.get('duration', 0)
        
        view_history, created = TourViewHistory.objects.get_or_create(
            user=request.user,
            tour=tour,
        )
        
        if not created:
            view_history.increment_view(duration)
        else:
            view_history.total_view_duration = duration
            view_history.save()
        
        # Also create interaction record
        TourInteraction.objects.create(
            user=request.user,
            tour=tour,
            interaction_type='view',
            metadata={'duration': duration},
        )
        
        return Response({'status': 'tracked'})


class UserPreferenceView(APIView):
    """
    Get and update user preferences.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        GET /api/recommendation/preferences/
        """
        try:
            preference = UserPreference.objects.get(user=request.user)
            serializer = UserPreferenceSerializer(preference)
            return Response(serializer.data)
        except UserPreference.DoesNotExist:
            return Response({
                'preferred_tags': [],
                'preferred_provinces': [],
                'preferred_transportation': [],
                'message': 'No preferences yet. Keep browsing to build your profile!',
            })
    
    def post(self, request):
        """
        Manually update preferences.
        
        POST /api/recommendation/preferences/
        {
            "preferred_tags": [{"tag": "food", "weight": 0.8}],
            "preferred_price_max": 500000
        }
        """
        preference, created = UserPreference.objects.get_or_create(
            user=request.user
        )
        
        serializer = UserPreferenceSerializer(
            preference,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RebuildUserProfileView(APIView):
    """
    Rebuild user preference profile from history.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        POST /api/recommendation/preferences/rebuild/
        """
        from .ml.user_profile import UserProfileBuilder, get_user_interaction_history
        
        # Get user history
        history = get_user_interaction_history(request.user.id)
        
        if not history['viewed'] and not history['booked']:
            return Response({
                'message': 'No interaction history found',
                'preferences': None,
            })
        
        # Build and save profile
        profile_builder = UserProfileBuilder()
        profile_builder.update_user_preferences_model(
            request.user,
            history['viewed'],
            history['booked'],
            history['rated'],
        )
        
        # Return updated preferences
        try:
            preference = UserPreference.objects.get(user=request.user)
            serializer = UserPreferenceSerializer(preference)
            return Response({
                'message': 'Profile rebuilt successfully',
                'preferences': serializer.data,
            })
        except UserPreference.DoesNotExist:
            return Response({
                'message': 'Failed to save preferences',
                'preferences': None,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Import for model aggregation
from django.db import models
