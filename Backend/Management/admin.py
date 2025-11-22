from django.contrib import admin
from .models import Booking, BookingNotification


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
