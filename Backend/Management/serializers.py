from rest_framework import serializers
from .models import Booking, BookingNotification, BookingStatus, PastTour
from Tour.models import Tour
from Profiles.models import Tourist, Guide
from django.utils import timezone
from datetime import datetime
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def send_booking_ws_notification(notification):
    """Send a realtime WebSocket notification for a BookingNotification instance."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    try:
        payload = {
            "type": "booking_notification",
            "id": notification.id,
            "booking_id": notification.booking_id,
            "tour_name": notification.booking.tour.name if notification.booking and notification.booking.tour else "",
            "notification_type": notification.notification_type,
            "message": notification.message,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
        }

        async_to_sync(channel_layer.group_send)(
            f"notify_user_{notification.recipient_id}",
            {
                "type": "chat.notification",
                "payload": payload,
            },
        )
    except Exception:
        # Fail silently - notifications should not break main flow
        pass


class BookingSerializer(serializers.ModelSerializer):
    """
    Serializer for Booking model with full details
    """
    tourist_name = serializers.CharField(source='tourist.name', read_only=True)
    tourist_username = serializers.CharField(source='tourist.user.username', read_only=True)
    guide_name = serializers.CharField(source='guide.name', read_only=True)
    guide_username = serializers.CharField(source='guide.user.username', read_only=True)
    tour_name = serializers.CharField(source='tour.name', read_only=True)
    tour_duration = serializers.IntegerField(source='tour.duration', read_only=True)
    is_upcoming = serializers.SerializerMethodField()
    is_past = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'tourist',
            'tourist_name',
            'tourist_username',
            'guide',
            'guide_name',
            'guide_username',
            'tour',
            'tour_name',
            'tour_duration',
            'number_of_guests',
            'tour_date',
            'tour_time',
            'status',
            'special_requests',
            'total_price',
            'created_at',
            'updated_at',
            'responded_at',
            'is_upcoming',
            'is_past',
        ]
        read_only_fields = [
            'id',
            'status',
            'total_price',
            'created_at',
            'updated_at',
            'responded_at',
        ]
    
    def get_is_upcoming(self, obj):
        return obj.is_upcoming()
    
    def get_is_past(self, obj):
        return obj.is_past()
    
    def validate_number_of_guests(self, value):
        """Validate number of guests is within tour limits"""
        tour_id = self.initial_data.get('tour')
        if tour_id:
            try:
                tour = Tour.objects.get(id=tour_id)
                if value < tour.min_people:
                    raise serializers.ValidationError(
                        f"Minimum number of guests is {tour.min_people}"
                    )
                if value > tour.max_people:
                    raise serializers.ValidationError(
                        f"Maximum number of guests is {tour.max_people}"
                    )
            except Tour.DoesNotExist:
                raise serializers.ValidationError("Tour not found")
        return value
    
    def validate_tour_date(self, value):
        """Validate tour date is in the future"""
        if value < timezone.now().date():
            raise serializers.ValidationError("Tour date must be in the future")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Check if tour date and time combination is in the future
        if 'tour_date' in data and 'tour_time' in data:
            booking_datetime = timezone.make_aware(
                datetime.combine(data['tour_date'], data['tour_time'])
            )
            if booking_datetime < timezone.now():
                raise serializers.ValidationError(
                    "Booking date and time must be in the future"
                )
        
        # Verify guide owns the tour
        if 'tour' in data and 'guide' in data:
            if data['tour'].guide != data['guide']:
                raise serializers.ValidationError(
                    "The selected tour does not belong to this guide"
                )
        
        return data


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating bookings (tourist perspective)
    """
    class Meta:
        model = Booking
        fields = [
            'tour',
            'number_of_guests',
            'tour_date',
            'tour_time',
            'special_requests',
        ]
    
    def validate_tour(self, value):
        """Validate tour exists and has a guide"""
        if not value.guide:
            raise serializers.ValidationError("This tour does not have an assigned guide")
        return value
    
    def validate_number_of_guests(self, value):
        """Validate number of guests is positive"""
        if value <= 0:
            raise serializers.ValidationError("Number of guests must be greater than 0")
        return value
    
    def validate_tour_date(self, value):
        """Validate tour date is in the future"""
        if value < timezone.now().date():
            raise serializers.ValidationError("Tour date must be in the future")
        return value
    
    def create(self, validated_data):
        """Create booking with automatic guide assignment and price calculation"""
        tour = validated_data['tour']
        tourist = validated_data['tourist']
        
        # Validate guest count against tour limits
        if validated_data['number_of_guests'] < tour.min_people:
            raise serializers.ValidationError(
                f"Minimum number of guests is {tour.min_people}"
            )
        if validated_data['number_of_guests'] > tour.max_people:
            raise serializers.ValidationError(
                f"Maximum number of guests is {tour.max_people}"
            )
        
        # Assign guide and calculate price
        validated_data['guide'] = tour.guide
        validated_data['total_price'] = tour.price * validated_data['number_of_guests']
        
        booking = Booking.objects.create(**validated_data)
        
        # Create notification for guide
        notification = BookingNotification.objects.create(
            booking=booking,
            recipient=booking.guide.user,
            notification_type='new_booking',
            message=f"New booking request from {tourist.user.username} for {tour.name}"
        )
        # Send realtime WebSocket notification 
        send_booking_ws_notification(notification)
        
        return booking


class BookingResponseSerializer(serializers.Serializer):
    """
    Serializer for guide's response to booking request
    """
    action = serializers.ChoiceField(choices=['accept', 'decline'], required=True)
    decline_reason = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True
    )
    
    def validate(self, data):
        """Validate decline reason is provided when declining"""
        if data['action'] == 'decline' and not data.get('decline_reason'):
            raise serializers.ValidationError(
                "Please provide a reason for declining the booking"
            )
        return data


class BookingListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing bookings
    """
    tourist_name = serializers.CharField(source='tourist.name', read_only=True)
    guide_name = serializers.CharField(source='guide.name', read_only=True)
    tour_name = serializers.CharField(source='tour.name', read_only=True)
    tour_thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'tourist_name',
            'guide_name',
            'tour',
            'tour_name',
            'tour_thumbnail',
            'number_of_guests',
            'tour_date',
            'tour_time',
            'status',
            'total_price',
            'created_at',
        ]
    
    def get_tour_thumbnail(self, obj):
        """Get tour thumbnail image URL"""
        thumbnail = obj.tour.tour_images.filter(isthumbnail=True).first()
        if thumbnail and thumbnail.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(thumbnail.image.url)
        return None


class BookingNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for booking notifications
    """
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    tour_name = serializers.CharField(source='booking.tour.name', read_only=True)
    
    class Meta:
        model = BookingNotification
        fields = [
            'id',
            'booking_id',
            'tour_name',
            'notification_type',
            'message',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'booking_id', 'tour_name', 'notification_type', 'message', 'created_at']


class PastTourSerializer(serializers.ModelSerializer):
    """
    Serializer for PastTour model - showing completed tour history
    """
    # Additional computed fields
    tour_thumbnail = serializers.SerializerMethodField()
    tourist_username = serializers.CharField(source='tourist.user.username', read_only=True)
    guide_username = serializers.CharField(source='guide.user.username', read_only=True)
    
    class Meta:
        model = PastTour
        fields = [
            'id',
            'tourist',
            'tourist_name',
            'tourist_username',
            'guide',
            'guide_name',
            'guide_username',
            'tour',
            'tour_name',
            'tour_description',
            'number_of_guests',
            'tour_date',
            'tour_time',
            'duration',
            'total_price',
            'special_requests',
            'completed_at',
            'original_booking_date',
            'tour_thumbnail',
        ]
        read_only_fields = fields  # All fields are read-only
    
    def get_tour_thumbnail(self, obj):
        """Get tour thumbnail image URL if tour still exists"""
        if obj.tour:
            thumbnail = obj.tour.tour_images.filter(isthumbnail=True).first()
            if thumbnail and thumbnail.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(thumbnail.image.url)
        return None


class PastTourListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing past tours
    """
    tourist_username = serializers.CharField(source='tourist.user.username', read_only=True)
    guide_username = serializers.CharField(source='guide.user.username', read_only=True)
    tour_thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = PastTour
        fields = [
            'id',
            'tourist_name',
            'tourist_username',
            'guide_name',
            'guide_username',
            'tour_name',
            'tour_thumbnail',
            'number_of_guests',
            'tour_date',
            'tour_time',
            'duration',
            'total_price',
            'completed_at',
        ]
        read_only_fields = fields
    
    def get_tour_thumbnail(self, obj):
        """Get tour thumbnail image URL if tour still exists"""
        if obj.tour:
            thumbnail = obj.tour.tour_images.filter(isthumbnail=True).first()
            if thumbnail and thumbnail.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(thumbnail.image.url)
        return None


class FrontendBookingCardSerializer(serializers.ModelSerializer):
    """
    Lightweight booking serializer tailored for the current frontend cards
    """

    title = serializers.CharField(source="tour.name", read_only=True)
    tourId = serializers.IntegerField(source="tour.id", read_only=True)
    guideId = serializers.IntegerField(source="guide.id", read_only=True)
    guideName = serializers.CharField(source="guide.name", read_only=True)
    touristId = serializers.IntegerField(source="tourist.id", read_only=True)
    touristName = serializers.CharField(source="tourist.name", read_only=True)
    status = serializers.CharField(source="get_status_display", read_only=True)
    status_key = serializers.CharField(source="status", read_only=True)
    image = serializers.SerializerMethodField()
    totalPrice = serializers.SerializerMethodField()
    tourDate = serializers.DateField(source="tour_date", read_only=True)
    tourTime = serializers.TimeField(source="tour_time", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "tourId",
            "title",
            "guideId",
            "guideName",
            "touristId",
            "touristName",
            "status",
            "status_key",
            "image",
            "tourDate",
            "tourTime",
            "number_of_guests",
            "totalPrice",
            "created_at",
        ]
        read_only_fields = fields

    def get_image(self, obj):
        """Return the same thumbnail logic used elsewhere"""
        thumbnail = obj.tour.tour_images.filter(isthumbnail=True).first()
        if thumbnail and thumbnail.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(thumbnail.image.url)
        return None

    def get_totalPrice(self, obj):
        return float(obj.total_price)


class FrontendPastTourCardSerializer(serializers.ModelSerializer):
    """
    Past tour serializer matching the simplified cards in the frontend
    """

    title = serializers.CharField(source="tour_name", read_only=True)
    tourId = serializers.IntegerField(source="tour.id", read_only=True)
    guideName = serializers.CharField(source="guide_name", read_only=True)
    touristName = serializers.CharField(source="tourist_name", read_only=True)
    date = serializers.SerializerMethodField()
    revenue = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = PastTour
        fields = [
            "id",
            "tourId",
            "title",
            "guideName",
            "touristName",
            "number_of_guests",
            "duration",
            "date",
            "revenue",
            "rating",
            "image",
        ]
        read_only_fields = fields

    def get_date(self, obj):
        return obj.tour_date.strftime("%d/%m/%Y")

    def get_revenue(self, obj):
        amount = obj.total_price or 0
        return f"{amount:,.0f} ₫"

    def get_rating(self, obj):
        if obj.tour and obj.tour.rating_count:
            return round(obj.tour.average_rating(), 1)
        return None

    def get_image(self, obj):
        if obj.tour:
            thumbnail = obj.tour.tour_images.filter(isthumbnail=True).first()
            if thumbnail and thumbnail.image:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(thumbnail.image.url)
        return None

