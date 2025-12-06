from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from datetime import datetime

from .models import Booking, BookingNotification, BookingStatus, PastTour
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingResponseSerializer,
    BookingListSerializer,
    BookingNotificationSerializer,
    PastTourSerializer,
    PastTourListSerializer,
    FrontendBookingCardSerializer,
    FrontendPastTourCardSerializer,
    send_booking_ws_notification,
)
from Profiles.models import Tourist, Guide
from Tour.models import Tour


class BookingPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


def get_future_booking_ids(bookings_queryset):
    """
    Helper function to filter bookings that haven't started yet.
    Uses timezone-aware datetime comparison.
    Returns list of booking IDs that are in the future.
    """
    now = timezone.now()
    future_ids = []

    for booking in bookings_queryset:
        try:
            booking_datetime = timezone.make_aware(
                datetime.combine(booking.tour_date, booking.tour_time),
                timezone.get_current_timezone(),
            )
            if booking_datetime >= now:
                future_ids.append(booking.id)
        except Exception:
            # If error, include the booking (fail-safe)
            future_ids.append(booking.id)

    return future_ids


def cleanup_expired_pending_bookings():
    """
    Helper function to automatically delete pending bookings that have passed
    their tour date+time (never accepted by guide).
    This prevents "zombie" pending requests from accumulating in the database.
    """
    now = timezone.now()

    # Find all pending bookings
    pending_bookings = Booking.objects.filter(
        status=BookingStatus.PENDING,
    ).select_related("tourist", "guide", "tour")

    deleted_count = 0

    for booking in pending_bookings:
        try:
            # Combine date and time into timezone-aware datetime
            booking_datetime = timezone.make_aware(
                datetime.combine(booking.tour_date, booking.tour_time),
                timezone.get_current_timezone(),
            )

            # Check if the booking datetime has passed
            if booking_datetime < now:
                # Delete expired pending booking
                booking.delete()
                deleted_count += 1
        except Exception as e:
            # Log error but continue processing other bookings
            print(f"Error deleting expired pending booking {booking.id}: {str(e)}")
            continue

    return deleted_count


def migrate_past_bookings_to_history():
    """
    Helper function to automatically migrate accepted bookings that have passed
    their tour date+time into PastTour records.
    This uses timezone-aware datetime comparison to respect Vietnam timezone.
    """
    now = timezone.now()

    # Find all accepted bookings where the tour datetime has passed
    past_bookings = Booking.objects.filter(
        status=BookingStatus.ACCEPTED,
    ).select_related("tourist", "guide", "tour")

    migrated_count = 0

    for booking in past_bookings:
        try:
            # Combine date and time into a timezone-aware datetime
            booking_datetime = timezone.make_aware(
                datetime.combine(booking.tour_date, booking.tour_time),
                timezone.get_current_timezone(),
            )

            # Check if the booking datetime has passed
            if booking_datetime < now:
                # Check if already migrated
                if not PastTour.objects.filter(booking=booking).exists():
                    PastTour.create_from_booking(booking)
                    migrated_count += 1

                # Create "review your tour" reminder notification once per booking
                try:
                    has_reminder = BookingNotification.objects.filter(
                        booking=booking,
                        notification_type="booking_reminder",
                    ).exists()
                    if not has_reminder:
                        reminder_message = (
                            f"Your tour '{booking.tour.name}' on {booking.tour_date} has completed. "
                            f"Please leave a review for your guide {booking.guide.name}."
                        )
                        notification = BookingNotification.objects.create(
                            booking=booking,
                            recipient=booking.tourist.user,
                            notification_type="booking_reminder",
                            message=reminder_message,
                        )
                        # Send realtime WebSocket reminder 
                        send_booking_ws_notification(notification)
                except Exception as e:
                    # Log error but keep processing other bookings
                    print(
                        f"Error creating review reminder for booking {booking.id}: {str(e)}"
                    )
        except Exception as e:
            # Log error but continue processing other bookings
            print(f"Error migrating booking {booking.id}: {str(e)}")
            continue

    return migrated_count


class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bookings
    Handles all CRUD operations for bookings
    """

    permission_classes = [IsAuthenticated]
    pagination_class = BookingPagination

    def get_queryset(self):
        """
        Filter bookings based on user role
        Auto-exclude past bookings (where tour date/time has passed)
        """
        user = self.request.user

        if user.role == "tourist":
            # Tourist sees their own bookings (only future or today's bookings)
            try:
                tourist = user.tourist_profile
                return (
                    Booking.objects.filter(
                        tourist=tourist, tour_date__gte=timezone.now().date()
                    )
                    .select_related("tourist", "guide", "tour")
                    .prefetch_related("tour__tour_images")
                )
            except Tourist.DoesNotExist:
                return Booking.objects.none()

        elif user.role == "guide":
            # Guide sees bookings for their tours (only future or today's bookings)
            try:
                guide = user.guide_profile
                return (
                    Booking.objects.filter(
                        guide=guide, tour_date__gte=timezone.now().date()
                    )
                    .select_related("tourist", "guide", "tour")
                    .prefetch_related("tour__tour_images")
                )
            except Guide.DoesNotExist:
                return Booking.objects.none()

        return Booking.objects.none()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == "create":
            return BookingCreateSerializer
        elif self.action == "list":
            return BookingListSerializer
        return BookingSerializer

    def create(self, request, *args, **kwargs):
        """
        Operation 1: Tourist sends a booking request
        POST /management/bookings/
        """
        # Only tourists can create bookings
        if request.user.role != "tourist":
            return Response(
                {"error": "Only tourists can create booking requests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            tourist = request.user.tourist_profile
        except Tourist.DoesNotExist:
            return Response(
                {
                    "error": "Tourist profile not found. Please complete your profile first."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Add tourist to data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Add tourist to validated data
        serializer.validated_data["tourist"] = tourist

        # --- VALIDATION LOGIC START ---
        tour = serializer.validated_data.get('tour')
        tour_date = serializer.validated_data.get('tour_date')
        tour_time = serializer.validated_data.get('tour_time')
        
        # 1. Prevent multiple active bookings for the SAME TOUR
        # "Active" means PENDING or ACCEPTED.
        if Booking.objects.filter(
            tourist=tourist,
            tour=tour,
            status__in=[BookingStatus.PENDING, BookingStatus.ACCEPTED]
        ).exists():
            return Response(
                {"error": "You already have an active booking for this tour. Please wait for it to be completed or cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Prevent TIME OVERLAP for the tourist
        # A tourist cannot be in two places at once.
        # We need to know the duration of the new tour.
        tour_duration = tour.duration  # in hours
        
        # Calculate start and end datetime for the NEW booking
        new_start = datetime.combine(tour_date, tour_time)
        from datetime import timedelta
        new_end = new_start + timedelta(hours=tour_duration)
        
        # Check against all other ACTIVE bookings of this tourist
        active_bookings = Booking.objects.filter(
            tourist=tourist,
            status__in=[BookingStatus.PENDING, BookingStatus.ACCEPTED]
        ).select_related('tour')

        for existing in active_bookings:
            existing_start = datetime.combine(existing.tour_date, existing.tour_time)
            existing_duration = existing.tour.duration
            existing_end = existing_start + timedelta(hours=existing_duration)

            # Check for overlap: StartA < EndB and StartB < EndA
            if new_start < existing_end and existing_start < new_end:
                 return Response(
                    {
                        "error": f"This booking overlaps with your existing booking for '{existing.tour.name}' ({existing.tour_date} at {existing.tour_time})."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # 3. Prevent BOOKING if GUIDE is already BUSY
        # If the guide has an ACCEPTED booking effectively overlapping this time, they are busy.
        # Pending bookings for the guide do not block, as they can be declined.
        guide = tour.guide
        if guide:
            guide_confirmed_bookings = Booking.objects.filter(
                guide=guide,
                status=BookingStatus.ACCEPTED
            ).select_related('tour')

            for confirmed in guide_confirmed_bookings:
                confirmed_start = datetime.combine(confirmed.tour_date, confirmed.tour_time)
                confirmed_duration = confirmed.tour.duration
                confirmed_end = confirmed_start + timedelta(hours=confirmed_duration)

                if new_start < confirmed_end and confirmed_start < new_end:
                        return Response(
                        {
                            "error": f"The guide is not available at this time. They have a confirmed tour '{confirmed.tour.name}' from {confirmed.tour_time} to {confirmed_end.time()}."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        # --- VALIDATION LOGIC END ---

        booking = serializer.save()

        # Return full booking details
        response_serializer = BookingSerializer(booking)
        return Response(
            {
                "message": "Booking request sent successfully",
                "booking": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        """
        Get detailed booking information
        GET /management/bookings/{id}/
        """
        booking = self.get_object()
        serializer = BookingSerializer(booking, context={"request": request})
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        """
        List bookings with filtering
        GET /management/bookings/
        Query params:
        - status: filter by status (pending/accepted/declined/cancelled/completed)
        - upcoming: true/false (only accepted future bookings)
        """
        queryset = self.get_queryset()

        # Filter by status
        status_filter = request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter upcoming bookings
        upcoming = request.query_params.get("upcoming", None)
        if upcoming and upcoming.lower() == "true":
            queryset = queryset.filter(
                status=BookingStatus.ACCEPTED, tour_date__gte=timezone.now().date()
            )

        # Order by date
        queryset = queryset.order_by("-tour_date", "-tour_time")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="respond")
    def respond_to_booking(self, request, pk=None):
        """
        Operation 2: Guide responds to booking request (accept/decline)
        POST /management/bookings/{id}/respond/
        Body: { "action": "accept" or "decline", "decline_reason": "..." }
        """
        # Only guides can respond to bookings
        if request.user.role != "guide":
            return Response(
                {"error": "Only guides can respond to booking requests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        booking = self.get_object()

        # Verify guide owns this booking
        try:
            guide = request.user.guide_profile
            if booking.guide != guide:
                return Response(
                    {"error": "You can only respond to your own bookings"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Guide.DoesNotExist:
            return Response(
                {"error": "Guide profile not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Check booking is pending
        if booking.status != BookingStatus.PENDING:
            return Response(
                {"error": f"Cannot respond to booking with status: {booking.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate response data
        response_serializer = BookingResponseSerializer(data=request.data)
        response_serializer.is_valid(raise_exception=True)

        action_type = response_serializer.validated_data["action"]

        if action_type == "accept":
            # --- GUIDE OVERLAP VALIDATION START ---
            # A guide cannot accept a booking if it overlaps with another ACCEPTED booking.
            
            # Calculate time range for the booking being accepted
            current_start = datetime.combine(booking.tour_date, booking.tour_time)
            from datetime import timedelta
            current_duration = booking.tour.duration
            current_end = current_start + timedelta(hours=current_duration)
            
            # Check against other ACCEPTED bookings for this guide
            guide_schedule_conflicts = Booking.objects.filter(
                guide=guide,
                status=BookingStatus.ACCEPTED
            ).exclude(id=booking.id).select_related('tour') # Exclude self just in case
            
            for confirmed in guide_schedule_conflicts:
                confirmed_start = datetime.combine(confirmed.tour_date, confirmed.tour_time)
                confirmed_duration = confirmed.tour.duration
                confirmed_end = confirmed_start + timedelta(hours=confirmed_duration)
                
                if current_start < confirmed_end and confirmed_start < current_end:
                     return Response(
                        {
                            "error": f"You cannot accept this booking because it overlaps with confirmed booking for '{confirmed.tour.name}' at {confirmed.tour_time}."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            # --- GUIDE OVERLAP VALIDATION END ---

            booking.accept()
            message = f"Your booking for {booking.tour.name} on {booking.tour_date} has been accepted!"

            # Create notification for tourist
            notification = BookingNotification.objects.create(
                booking=booking,
                recipient=booking.tourist.user,
                notification_type="booking_accepted",
                message=message,
            )

            # Send realtime WebSocket notification (best-effort)
            send_booking_ws_notification(notification)

            serializer = BookingSerializer(booking)
            return Response(
                {"message": "Booking accepted successfully", "booking": serializer.data}
            )

        else:  # decline - notify and delete immediately
            decline_reason = response_serializer.validated_data.get(
                "decline_reason", ""
            )
            tour_name = booking.tour.name
            tour_date = booking.tour_date
            tourist_user = booking.tourist.user

            # Create notification before deleting
            # Note: We create notification without FK to booking since it will be deleted
            from Authentication.models import User
            from django.core.mail import send_mail

            # Send in-app notification or email (since booking will be deleted, we can't link to it)
            # For now, we'll skip creating BookingNotification since it requires a booking FK
            # Instead, you might want to implement a separate NotificationLog model for deleted bookings
            # However, we still send a realtime WebSocket notification so the tourist is informed.
            try:
                temp_notification = BookingNotification(
                    booking=booking,
                    recipient=tourist_user,
                    notification_type="booking_declined",
                    message=(
                        f"Your booking for {tour_name} on {tour_date} was declined. "
                        f"Reason: {decline_reason or 'No reason provided.'}"
                    ),
                )
                # This object is not saved to DB, so id/created_at are null.
                # send_booking_ws_notification can still use recipient_id/booking_id
                # to target the correct user in realtime.
                send_booking_ws_notification(temp_notification)
            except Exception as e:
                print(f"Error sending decline notification for booking {booking.id}: {str(e)}")

            # Delete the booking immediately
            booking.delete()

            return Response(
                {
                    "message": "Booking declined and removed from system",
                    "details": {
                        "tour_name": tour_name,
                        "tour_date": str(tour_date),
                        "reason": decline_reason,
                    },
                },
                status=status.HTTP_200_OK,
            )

    @action(detail=False, methods=["get"], url_path="my-requests")
    def my_booking_requests(self, request):
        """
        Operation 3: View booking requests for created tours (for tourist)
        GET /management/bookings/my-requests/
        Returns all bookings made by the authenticated tourist (only future bookings)
        Uses timezone-aware datetime comparison.
        """
        if request.user.role != "tourist":
            return Response(
                {"error": "This endpoint is only for tourists"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            tourist = request.user.tourist_profile
        except Tourist.DoesNotExist:
            return Response(
                {"error": "Tourist profile not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all bookings and filter by future datetime
        all_bookings = Booking.objects.filter(tourist=tourist).select_related(
            "tourist", "guide", "tour"
        )
        future_ids = get_future_booking_ids(all_bookings)

        queryset = (
            Booking.objects.filter(id__in=future_ids)
            .select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("-created_at")
        )

        # Filter by status if provided
        status_filter = request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BookingSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = BookingSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="requests")
    def booking_requests(self, request):
        """
        Operation 2 (View): View all booking requests (for guide)
        GET /management/bookings/requests/
        Returns all bookings (pending + accepted) for the guide's tours (only future bookings)
        Can filter by status using query param: ?status=pending or ?status=accepted
        Uses timezone-aware datetime comparison.
        """
        if request.user.role != "guide":
            return Response(
                {"error": "This endpoint is only for guides"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            guide = request.user.guide_profile
        except Guide.DoesNotExist:
            return Response(
                {"error": "Guide profile not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get all bookings and filter by future datetime
        all_bookings = Booking.objects.filter(guide=guide).select_related(
            "tourist", "guide", "tour"
        )
        future_ids = get_future_booking_ids(all_bookings)

        queryset = (
            Booking.objects.filter(id__in=future_ids)
            .select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("-created_at")
        )

        # Filter by status if provided
        status_filter = request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BookingSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = BookingSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="upcoming-tours")
    def upcoming_tours(self, request):
        """
        Operation 4: Manage upcoming tours for accepted requests
        GET /management/bookings/upcoming-tours/
        Returns all accepted bookings with future dates (for both tourists and guides)
        Uses timezone-aware datetime comparison.
        """
        user = request.user

        if user.role == "tourist":
            try:
                tourist = user.tourist_profile
                all_bookings = Booking.objects.filter(
                    tourist=tourist,
                    status=BookingStatus.ACCEPTED,
                ).select_related("tourist", "guide", "tour")
                future_ids = get_future_booking_ids(all_bookings)
                queryset = Booking.objects.filter(id__in=future_ids)
            except Tourist.DoesNotExist:
                return Response(
                    {"error": "Tourist profile not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        elif user.role == "guide":
            try:
                guide = user.guide_profile
                all_bookings = Booking.objects.filter(
                    guide=guide,
                    status=BookingStatus.ACCEPTED,
                ).select_related("tourist", "guide", "tour")
                future_ids = get_future_booking_ids(all_bookings)
                queryset = Booking.objects.filter(id__in=future_ids)
            except Guide.DoesNotExist:
                return Response(
                    {"error": "Guide profile not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {"error": "Invalid user role"}, status=status.HTTP_400_BAD_REQUEST
            )

        queryset = (
            queryset.select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("tour_date", "tour_time")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BookingSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = BookingSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="past-tours")
    def past_tours(self, request):
        """
        View past tours from PastTour model (completed tours with saved history)
        GET /management/bookings/past-tours/
        Returns all past tour records (for both tourists and guides)

        This now queries the PastTour model instead of Booking model
        """
        user = request.user

        if user.role == "tourist":
            try:
                tourist = user.tourist_profile
                queryset = PastTour.objects.filter(tourist=tourist)
            except Tourist.DoesNotExist:
                return Response(
                    {"error": "Tourist profile not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        elif user.role == "guide":
            try:
                guide = user.guide_profile
                queryset = PastTour.objects.filter(guide=guide)
            except Guide.DoesNotExist:
                return Response(
                    {"error": "Guide profile not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {"error": "Invalid user role"}, status=status.HTTP_400_BAD_REQUEST
            )

        queryset = (
            queryset.select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("-tour_date", "-tour_time")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PastTourListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = PastTourListSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="past-tour-detail")
    def past_tour_detail(self, request, pk=None):
        """
        Get detailed information about a specific past tour
        GET /management/bookings/{past_tour_id}/past-tour-detail/
        """
        user = request.user

        try:
            past_tour = (
                PastTour.objects.select_related("tourist", "guide", "tour")
                .prefetch_related("tour__tour_images")
                .get(pk=pk)
            )

            # Verify user has access to this past tour
            if user.role == "tourist":
                if past_tour.tourist.user != user:
                    return Response(
                        {"error": "You don't have permission to view this past tour"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            elif user.role == "guide":
                if past_tour.guide.user != user:
                    return Response(
                        {"error": "You don't have permission to view this past tour"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                return Response(
                    {"error": "Invalid user role"}, status=status.HTTP_400_BAD_REQUEST
                )

            serializer = PastTourSerializer(past_tour, context={"request": request})
            return Response(serializer.data)

        except PastTour.DoesNotExist:
            return Response(
                {"error": "Past tour not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["post"], url_path="migrate-past-bookings")
    def migrate_past_bookings(self, request):
        """
        Manually trigger migration of past bookings to PastTour model
        POST /management/bookings/migrate-past-bookings/
        Only accessible by staff/admin users
        Uses timezone-aware datetime comparison.
        """
        if not request.user.is_staff:
            return Response(
                {"error": "Only staff can trigger this action"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Use the helper function to migrate
        migrated_count = migrate_past_bookings_to_history()

        return Response(
            {
                "message": "Migration completed",
                "migrated": migrated_count,
            }
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def booking_statistics(request):
    """
    Get booking statistics for the authenticated user
    GET /management/statistics/
    Now includes past_tours count from PastTour model
    Uses timezone-aware datetime comparison.
    """
    user = request.user

    if user.role == "tourist":
        try:
            tourist = user.tourist_profile
            all_bookings = Booking.objects.filter(tourist=tourist).select_related(
                "tourist", "guide", "tour"
            )
            future_ids = get_future_booking_ids(all_bookings)
            future_bookings = Booking.objects.filter(id__in=future_ids)

            # Count past tours from PastTour model instead
            past_tours_count = PastTour.objects.filter(tourist=tourist).count()

            stats = {
                "total_bookings": future_bookings.count(),
                "pending": future_bookings.filter(status=BookingStatus.PENDING).count(),
                "accepted": future_bookings.filter(
                    status=BookingStatus.ACCEPTED
                ).count(),
                "upcoming": future_bookings.filter(
                    status=BookingStatus.ACCEPTED
                ).count(),
                "past_tours": past_tours_count,
            }
        except Tourist.DoesNotExist:
            return Response(
                {"error": "Tourist profile not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    elif user.role == "guide":
        try:
            guide = user.guide_profile
            all_bookings = Booking.objects.filter(guide=guide).select_related(
                "tourist", "guide", "tour"
            )
            future_ids = get_future_booking_ids(all_bookings)
            future_bookings = Booking.objects.filter(id__in=future_ids)

            # Count past tours from PastTour model instead
            past_tours_count = PastTour.objects.filter(guide=guide).count()

            stats = {
                "total_bookings": future_bookings.count(),
                "pending": future_bookings.filter(status=BookingStatus.PENDING).count(),
                "accepted": future_bookings.filter(
                    status=BookingStatus.ACCEPTED
                ).count(),
                "upcoming": future_bookings.filter(
                    status=BookingStatus.ACCEPTED
                ).count(),
                "past_tours": past_tours_count,
            }
        except Guide.DoesNotExist:
            return Response(
                {"error": "Guide profile not found"}, status=status.HTTP_400_BAD_REQUEST
            )
    else:
        return Response(
            {"error": "Invalid user role"}, status=status.HTTP_400_BAD_REQUEST
        )

    return Response(stats)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def frontend_management_snapshot(request):
    """
    Simplified dataset tailored for the current frontend management UI
    GET /management/frontend/snapshot/

    Automatically migrates past bookings to PastTour and cleans up expired pending bookings.
    """
    user = request.user
    context = {"request": request}

    # Auto-cleanup expired pending bookings (timezone-aware)
    cleanup_expired_pending_bookings()

    # Auto-migrate past accepted bookings to PastTour (timezone-aware)
    migrate_past_bookings_to_history()

    if user.role == "tourist":
        try:
            tourist = user.tourist_profile
        except Tourist.DoesNotExist:
            return Response(
                {"error": "Tourist profile not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter bookings: only show future bookings (using timezone-aware comparison)
        now = timezone.now()
        all_bookings = Booking.objects.filter(tourist=tourist).select_related(
            "tourist", "guide", "tour"
        )

        future_bookings = []
        for booking in all_bookings:
            booking_datetime = timezone.make_aware(
                datetime.combine(booking.tour_date, booking.tour_time),
                timezone.get_current_timezone(),
            )
            if booking_datetime >= now:
                future_bookings.append(booking.id)

        bookings = (
            Booking.objects.filter(id__in=future_bookings)
            .select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("-created_at")
        )

        past_tours = (
            PastTour.objects.filter(tourist=tourist)
            .select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("-tour_date", "-tour_time")
        )

        return Response(
            {
                "role": "tourist",
                "bookings": FrontendBookingCardSerializer(
                    bookings, many=True, context=context
                ).data,
                "incomingRequests": [],
                "pastTours": FrontendPastTourCardSerializer(
                    past_tours, many=True, context=context
                ).data,
            }
        )

    if user.role == "guide":
        try:
            guide = user.guide_profile
        except Guide.DoesNotExist:
            return Response(
                {"error": "Guide profile not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter bookings: only show future bookings (using timezone-aware comparison)
        now = timezone.now()
        all_bookings = Booking.objects.filter(guide=guide).select_related(
            "tourist", "guide", "tour"
        )

        future_bookings = []
        for booking in all_bookings:
            booking_datetime = timezone.make_aware(
                datetime.combine(booking.tour_date, booking.tour_time),
                timezone.get_current_timezone(),
            )
            if booking_datetime >= now:
                future_bookings.append(booking.id)

        incoming = (
            Booking.objects.filter(id__in=future_bookings)
            .select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("-created_at")
        )

        past_tours = (
            PastTour.objects.filter(guide=guide)
            .select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("-tour_date", "-tour_time")
        )

        return Response(
            {
                "role": "guide",
                "bookings": [],
                "incomingRequests": FrontendBookingCardSerializer(
                    incoming, many=True, context=context
                ).data,
                "pastTours": FrontendPastTourCardSerializer(
                    past_tours, many=True, context=context
                ).data,
            }
        )

    return Response(
        {"error": "Invalid user role"},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications(request):
    """
    Get notifications for the authenticated user
    GET /management/notifications/
    Query params:
    - unread: true/false (filter unread notifications)
    """
    user = request.user

    queryset = BookingNotification.objects.filter(recipient=user).select_related(
        "booking", "booking__tour"
    )

    # Filter unread if requested
    unread_filter = request.query_params.get("unread", None)
    if unread_filter and unread_filter.lower() == "true":
        queryset = queryset.filter(is_read=False)

    queryset = queryset.order_by("-created_at")[:50]  # Limit to last 50 notifications

    serializer = BookingNotificationSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Mark a notification as read
    POST /management/notifications/{id}/read/
    """
    user = request.user

    notification = get_object_or_404(
        BookingNotification, id=notification_id, recipient=user
    )

    notification.mark_as_read()

    serializer = BookingNotificationSerializer(notification)
    return Response(
        {"message": "Notification marked as read", "notification": serializer.data}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for the authenticated user
    POST /management/notifications/read-all/
    """
    user = request.user

    updated_count = BookingNotification.objects.filter(
        recipient=user, is_read=False
    ).update(is_read=True)

    return Response(
        {
            "message": f"{updated_count} notifications marked as read",
            "count": updated_count,
        }
    )
