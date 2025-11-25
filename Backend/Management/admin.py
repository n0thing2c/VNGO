from django.contrib import admin
from .models import Booking, BookingNotification, PastTour


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """
    Admin interface for Booking model
    """
    list_display = [
        'id',
        'tourist',
        'guide',
        'tour',
        'number_of_guests',
        'tour_date',
        'tour_time',
        'status',
        'total_price',
        'created_at',
    ]
    list_filter = [
        'status',
        'tour_date',
        'created_at',
    ]
    search_fields = [
        'tourist__user__username',
        'guide__user__username',
        'tour__name',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'responded_at',
    ]
    fieldsets = (
        ('Booking Information', {
            'fields': (
                'tourist',
                'guide',
                'tour',
                'number_of_guests',
                'tour_date',
                'tour_time',
                'total_price',
            )
        }),
        ('Status', {
            'fields': (
                'status',
                'special_requests',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
                'responded_at',
            )
        }),
    )
    ordering = ['-created_at']
    date_hierarchy = 'tour_date'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        queryset = queryset.select_related('tourist', 'guide', 'tour')
        return queryset


@admin.register(BookingNotification)
class BookingNotificationAdmin(admin.ModelAdmin):
    """
    Admin interface for BookingNotification model
    """
    list_display = [
        'id',
        'booking',
        'recipient',
        'notification_type',
        'is_read',
        'created_at',
    ]
    list_filter = [
        'notification_type',
        'is_read',
        'created_at',
    ]
    search_fields = [
        'recipient__username',
        'message',
    ]
    readonly_fields = [
        'created_at',
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        queryset = queryset.select_related('booking', 'recipient')
        return queryset


@admin.register(PastTour)
class PastTourAdmin(admin.ModelAdmin):
    """
    Admin interface for PastTour model
    """
    list_display = [
        'id',
        'tour_name',
        'tourist_name',
        'guide_name',
        'tour_date',
        'tour_time',
        'number_of_guests',
        'total_price',
        'completed_at',
    ]
    list_filter = [
        'tour_date',
        'completed_at',
    ]
    search_fields = [
        'tourist_name',
        'guide_name',
        'tour_name',
        'tourist__user__username',
        'guide__user__username',
    ]
    readonly_fields = [
        'completed_at',
        'original_booking_date',
    ]
    fieldsets = (
        ('Participant Information', {
            'fields': (
                'tourist',
                'tourist_name',
                'guide',
                'guide_name',
            )
        }),
        ('Tour Information', {
            'fields': (
                'tour',
                'tour_name',
                'tour_description',
                'duration',
            )
        }),
        ('Tour Details', {
            'fields': (
                'number_of_guests',
                'tour_date',
                'tour_time',
                'total_price',
                'special_requests',
            )
        }),
        ('References', {
            'fields': (
                'booking',
            )
        }),
        ('Timestamps', {
            'fields': (
                'original_booking_date',
                'completed_at',
            )
        }),
    )
    ordering = ['-tour_date', '-tour_time']
    date_hierarchy = 'tour_date'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        queryset = queryset.select_related('tourist', 'guide', 'tour', 'booking')
        return queryset
