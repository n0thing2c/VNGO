from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for the BookingViewSet
router = DefaultRouter()
router.register(r"bookings", views.BookingViewSet, basename="booking")

urlpatterns = [
    # ============================================
    # BOOKING ENDPOINTS (via Router)
    # ============================================
    # Standard REST endpoints:
    # - GET    /management/bookings/              - List bookings (filtered by role)
    # - POST   /management/bookings/              - Create booking (Tourist only)
    # - GET    /management/bookings/{id}/         - Get booking details
    # - PUT    /management/bookings/{id}/         - Update booking
    # - DELETE /management/bookings/{id}/         - Delete booking
    # Custom action endpoints:
    # - GET    /management/bookings/my-requests/  - Tourist: View my booking requests
    # - GET    /management/bookings/requests/     - Guide: View all requests (pending + accepted)
    # - GET    /management/bookings/upcoming-tours/ - Both: View upcoming accepted tours
    # - POST   /management/bookings/{id}/respond/ - Guide: Accept/Decline booking
    path("", include(router.urls)),
    # ============================================
    # STATISTICS
    # ============================================
    path("statistics/", views.booking_statistics, name="booking-statistics"),
    path(
        "frontend/snapshot/",
        views.frontend_management_snapshot,
        name="frontend-management-snapshot",
    ),
    # ============================================
    # NOTIFICATIONS
    # ============================================
    path("notifications/", views.notifications, name="notifications"),
    path(
        "notifications/<int:notification_id>/read/",
        views.mark_notification_read,
        name="mark-notification-read",
    ),
    path(
        "notifications/read-all/",
        views.mark_all_notifications_read,
        name="mark-all-notifications-read",
    ),
]
