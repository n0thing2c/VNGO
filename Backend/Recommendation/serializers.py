from rest_framework import serializers
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
from Tour.serializers import TourSerializer


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = [
            'preferred_tags',
            'preferred_price_min',
            'preferred_price_max',
            'preferred_duration_min',
            'preferred_duration_max',
            'preferred_provinces',
            'preferred_transportation',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


class TourViewHistorySerializer(serializers.ModelSerializer):
    tour_name = serializers.CharField(source='tour.name', read_only=True)
    
    class Meta:
        model = TourViewHistory
        fields = [
            'id',
            'tour',
            'tour_name',
            'view_count',
            'total_view_duration',
            'first_viewed_at',
            'last_viewed_at',
        ]
        read_only_fields = ['first_viewed_at', 'last_viewed_at']


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = [
            'id',
            'query_text',
            'province',
            'place_id',
            'tags',
            'min_price',
            'max_price',
            'num_days',
            'budget',
            'results_count',
            'created_at',
        ]
        read_only_fields = ['created_at']


class TripPlanItemSerializer(serializers.ModelSerializer):
    tour_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TripPlanItem
        fields = [
            'id',
            'tour',
            'tour_details',
            'order',
            'suggested_start_time',
            'recommendation_score',
            'recommendation_reason',
            'is_user_added',
            'is_user_removed',
        ]
    
    def get_tour_details(self, obj):
        from Tour.models import Tour
        try:
            tour = obj.tour
            places = []
            for tp in tour.tour_places.select_related('place').all():
                place = tp.place
                places.append({
                    'id': place.id,
                    'name': place.name,
                    'name_en': place.name_en,
                    'province': place.province,
                    'province_en': place.province_en,
                })
            
            thumbnail = None
            for img in tour.tour_images.all():
                if img.isthumbnail and img.image:
                    thumbnail = img.image.url
                    break
            if not thumbnail:
                first_img = tour.tour_images.first()
                if first_img and first_img.image:
                    thumbnail = first_img.image.url
            
            return {
                'id': tour.id,
                'name': tour.name,
                'duration': tour.duration,
                'price': tour.price,
                'transportation': tour.transportation,
                'tags': tour.tags,
                'description': tour.description[:200] if tour.description else '',
                'rating': tour.average_rating(),
                'rating_count': tour.rating_count,
                'thumbnail': thumbnail,
                'places': places,
                'guide_name': tour.guide.name if tour.guide else None,
            }
        except Exception:
            return None


class TripPlanDaySerializer(serializers.ModelSerializer):
    items = TripPlanItemSerializer(many=True, read_only=True)
    tours = serializers.SerializerMethodField()
    
    class Meta:
        model = TripPlanDay
        fields = [
            'id',
            'day_number',
            'date',
            'notes',
            'items',
            'tours',
        ]
    
    def get_tours(self, obj):
        """Get tours in a simplified format for the frontend."""
        tours = []
        for item in obj.items.filter(is_user_removed=False).order_by('order'):
            tour = item.tour
            places = []
            for tp in tour.tour_places.select_related('place').all():
                place = tp.place
                places.append({
                    'id': place.id,
                    'name': place.name,
                    'name_en': place.name_en,
                    'province_en': place.province_en,
                    'lat': place.lat,
                    'lon': place.lon,
                })
            
            thumbnail = None
            for img in tour.tour_images.all():
                if img.isthumbnail and img.image:
                    thumbnail = img.image.url
                    break
            
            tours.append({
                'id': tour.id,
                'name': tour.name,
                'duration': tour.duration,
                'price': tour.price,
                'transportation': tour.transportation,
                'tags': tour.tags,
                'rating': tour.average_rating(),
                'rating_count': tour.rating_count,
                'thumbnail': thumbnail,
                'places': places,
                'guide_name': tour.guide.name if tour.guide else None,
                'order': item.order,
                'suggested_start_time': item.suggested_start_time.strftime('%H:%M') if item.suggested_start_time else None,
                'recommendation_score': item.recommendation_score,
                'recommendation_reason': item.recommendation_reason,
                'is_user_added': item.is_user_added,
            })
        return tours


class HotelSuggestionSerializer(serializers.ModelSerializer):
    booking_links = serializers.SerializerMethodField()
    
    class Meta:
        model = HotelSuggestion
        fields = [
            'id',
            'external_id',
            'name',
            'address',
            'latitude',
            'longitude',
            'price_per_night',
            'currency',
            'rating',
            'review_count',
            'thumbnail_url',
            'booking_url',
            'source',
            'distance_to_center',
            'match_score',
            'booking_links',
        ]
    
    def get_booking_links(self, obj):
        """Generate multiple booking platform links."""
        from .services.hotel_service import HotelService
        service = HotelService()
        
        trip_plan = obj.trip_plan
        # Use trip dates or generate default dates
        from datetime import datetime, timedelta
        checkin = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        checkout = (datetime.now() + timedelta(days=7 + trip_plan.num_days)).strftime('%Y-%m-%d')
        
        return service.generate_affiliate_links(
            {'name': obj.name},
            checkin,
            checkout,
        )


class TripPlanSerializer(serializers.ModelSerializer):
    days = TripPlanDaySerializer(many=True, read_only=True)
    hotel_suggestions = HotelSuggestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = TripPlan
        fields = [
            'id',
            'name',
            'province',
            'place_ids',
            'num_days',
            'budget',
            'num_people',
            'preferred_tags',
            'total_estimated_cost',
            'total_duration_hours',
            'status',
            'is_public',
            'share_token',
            'days',
            'hotel_suggestions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'share_token']


class TripPlanCreateSerializer(serializers.Serializer):
    """Serializer for creating a new trip plan."""
    province = serializers.CharField(max_length=100)
    num_days = serializers.IntegerField(min_value=1, max_value=30)
    budget = serializers.IntegerField(min_value=100000)  # Min 100k VND
    num_people = serializers.IntegerField(min_value=1, max_value=50, default=1)
    place_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )
    preferred_tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
    )
    start_date = serializers.DateField(required=False, allow_null=True)
    max_hours_per_day = serializers.IntegerField(min_value=4, max_value=14, default=10)
    
    def validate_province(self, value):
        """Validate that the province exists in our database."""
        from Tour.models import Place
        
        # Check if any places exist with this province
        exists = Place.objects.filter(
            models.Q(province__icontains=value) |
            models.Q(province_en__icontains=value) |
            models.Q(city__icontains=value) |
            models.Q(city_en__icontains=value)
        ).exists()
        
        # Allow even if no exact match - the planner will handle empty results
        return value


class TripPlanModifySerializer(serializers.Serializer):
    """Serializer for modifying a trip plan."""
    action = serializers.ChoiceField(choices=['add', 'remove', 'swap', 'reorder'])
    day_number = serializers.IntegerField(min_value=1)
    tour_id = serializers.IntegerField(required=False)
    new_tour_id = serializers.IntegerField(required=False)
    new_order = serializers.IntegerField(required=False, min_value=1)
    
    def validate(self, data):
        action = data.get('action')
        
        if action == 'add' and not data.get('tour_id'):
            raise serializers.ValidationError("tour_id is required for add action")
        
        if action == 'remove' and not data.get('tour_id'):
            raise serializers.ValidationError("tour_id is required for remove action")
        
        if action == 'swap':
            if not data.get('tour_id') or not data.get('new_tour_id'):
                raise serializers.ValidationError(
                    "Both tour_id and new_tour_id are required for swap action"
                )
        
        return data


class TourInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourInteraction
        fields = [
            'id',
            'tour',
            'interaction_type',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['created_at']


class TourRecommendationRequestSerializer(serializers.Serializer):
    """Serializer for requesting tour recommendations."""
    province = serializers.CharField(max_length=100, required=False)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
    )
    price_min = serializers.IntegerField(required=False, min_value=0)
    price_max = serializers.IntegerField(required=False)
    duration_min = serializers.IntegerField(required=False, min_value=1)
    duration_max = serializers.IntegerField(required=False)
    min_rating = serializers.FloatField(required=False, min_value=0, max_value=5)
    limit = serializers.IntegerField(default=10, min_value=1, max_value=50)
    exclude_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )


class SimilarToursRequestSerializer(serializers.Serializer):
    """Serializer for finding similar tours."""
    tour_id = serializers.IntegerField()
    limit = serializers.IntegerField(default=5, min_value=1, max_value=20)
    exclude_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )


# Import models for validation
from django.db import models

