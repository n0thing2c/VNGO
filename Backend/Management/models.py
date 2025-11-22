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
