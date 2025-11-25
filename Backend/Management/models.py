from django.db import models
from django.utils import timezone
from Profiles.models import Guide, Tourist
from Tour.models import Tour


class BookingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"


class Booking(models.Model):
    """
    Model to handle tour booking requests between tourists and guides
    """

    id = models.AutoField(primary_key=True)

    # Relationships
    tourist = models.ForeignKey(
        Tourist,
        on_delete=models.CASCADE,
        related_name="bookings",
        help_text="Tourist who made the booking",
    )
    guide = models.ForeignKey(
        Guide,
        on_delete=models.CASCADE,
        related_name="received_bookings",
        help_text="Guide who receives the booking",
    )
    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        related_name="bookings",
        help_text="Tour being booked",
    )

    # Booking details
    number_of_guests = models.PositiveIntegerField(
        help_text="Number of people attending the tour"
    )
    tour_date = models.DateField(help_text="Requested date for the tour")
    tour_time = models.TimeField(help_text="Requested time for the tour")

    # Status and tracking
    status = models.CharField(
        max_length=20,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING,
        db_index=True,
    )

    # Additional information
    special_requests = models.TextField(
        max_length=1000,
        blank=True,
        null=True,
        help_text="Any special requests from the tourist",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(
        null=True, blank=True, help_text="When the guide responded to the request"
    )

    # Payment and pricing
    total_price = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Total price for the booking"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tourist", "status"]),
            models.Index(fields=["guide", "status"]),
            models.Index(fields=["tour", "status"]),
            models.Index(fields=["tour_date", "status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Booking #{self.id} - {self.tourist.user.username} -> {self.tour.name}"

    def save(self, *args, **kwargs):
        # Calculate total price if not set
        if not self.total_price and self.tour:
            self.total_price = self.tour.price * self.number_of_guests
        super().save(*args, **kwargs)

    def accept(self):
        """Mark booking as accepted"""
        self.status = BookingStatus.ACCEPTED
        self.responded_at = timezone.now()
        self.save()

    def is_upcoming(self):
        """Check if booking is upcoming (accepted and future date)"""
        from datetime import datetime

        if self.status == BookingStatus.ACCEPTED:
            booking_datetime = timezone.make_aware(
                datetime.combine(self.tour_date, self.tour_time)
            )
            return booking_datetime > timezone.now()
        return False

    def is_past(self):
        """Check if booking date has passed"""
        from datetime import datetime

        booking_datetime = timezone.make_aware(
            datetime.combine(self.tour_date, self.tour_time)
        )
        return booking_datetime < timezone.now()

    def should_auto_delete(self):
        """Check if booking should be auto-deleted (tour date/time has passed)"""
        return self.is_past()


class BookingNotification(models.Model):
    """
    Model to track notifications related to bookings
    """

    NOTIFICATION_TYPE_CHOICES = [
        ("new_booking", "New Booking Request"),
        ("booking_accepted", "Booking Accepted"),
        ("booking_reminder", "Booking Reminder"),
    ]

    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="notifications"
    )
    recipient = models.ForeignKey(
        "Authentication.User",
        on_delete=models.CASCADE,
        related_name="booking_notifications",
    )
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPE_CHOICES
    )
    message = models.TextField(max_length=500)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Notification for {self.recipient.username} - {self.notification_type}"

    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.save()


class PastTour(models.Model):
    """
    Model to store completed tours (accepted bookings that have passed)
    This preserves tour history even after bookings are cleaned up
    """

    id = models.AutoField(primary_key=True)

    # Original booking reference (nullable in case booking is deleted)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="past_tour_records",
        help_text="Reference to original booking if it still exists",
    )

    # Participant information
    tourist = models.ForeignKey(
        Tourist,
        on_delete=models.CASCADE,
        related_name="past_tours",
        help_text="Tourist who participated in the tour",
    )
    tourist_name = models.CharField(
        max_length=100, help_text="Tourist name at time of tour"
    )

    guide = models.ForeignKey(
        Guide,
        on_delete=models.CASCADE,
        related_name="past_tours",
        help_text="Guide who led the tour",
    )
    guide_name = models.CharField(max_length=100, help_text="Guide name at time of tour")

    # Tour information (stored as snapshot to preserve history)
    tour = models.ForeignKey(
        Tour,
        on_delete=models.SET_NULL,
        null=True,
        related_name="past_tours",
        help_text="Reference to tour (nullable if tour is deleted)",
    )
    tour_name = models.CharField(max_length=100, help_text="Tour name at time of booking")
    tour_description = models.TextField(
        max_length=1000, blank=True, help_text="Tour description at time of booking"
    )

    # Tour details
    number_of_guests = models.PositiveIntegerField(
        help_text="Number of people who attended"
    )
    tour_date = models.DateField(help_text="Date the tour took place")
    tour_time = models.TimeField(help_text="Time the tour started")
    duration = models.IntegerField(help_text="Tour duration in hours")

    # Pricing
    total_price = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Total price paid for the tour"
    )

    # Additional information
    special_requests = models.TextField(
        max_length=1000,
        blank=True,
        null=True,
        help_text="Special requests from the tourist",
    )

    # Timestamps
    completed_at = models.DateTimeField(
        auto_now_add=True, help_text="When this past tour record was created"
    )
    original_booking_date = models.DateTimeField(
        help_text="When the original booking was created"
    )

    class Meta:
        ordering = ["-tour_date", "-tour_time"]
        indexes = [
            models.Index(fields=["tourist", "tour_date"]),
            models.Index(fields=["guide", "tour_date"]),
            models.Index(fields=["tour_date"]),
            models.Index(fields=["completed_at"]),
        ]

    def __str__(self):
        return f"Past Tour: {self.tour_name} - {self.tourist_name} with {self.guide_name} on {self.tour_date}"

    @classmethod
    def create_from_booking(cls, booking):
        """
        Create a PastTour record from a completed booking
        """
        if booking.status != BookingStatus.ACCEPTED:
            raise ValueError("Only accepted bookings can be converted to past tours")

        if not booking.is_past():
            raise ValueError("Booking must be in the past to create a past tour record")

        # Check if past tour already exists for this booking
        if cls.objects.filter(booking=booking).exists():
            return cls.objects.get(booking=booking)

        # Create past tour record
        past_tour = cls.objects.create(
            booking=booking,
            tourist=booking.tourist,
            tourist_name=booking.tourist.name,
            guide=booking.guide,
            guide_name=booking.guide.name,
            tour=booking.tour,
            tour_name=booking.tour.name,
            tour_description=booking.tour.description,
            number_of_guests=booking.number_of_guests,
            tour_date=booking.tour_date,
            tour_time=booking.tour_time,
            duration=booking.tour.duration,
            total_price=booking.total_price,
            special_requests=booking.special_requests,
            original_booking_date=booking.created_at,
        )

        return past_tour