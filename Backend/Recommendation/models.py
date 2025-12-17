from django.db import models
from django.conf import settings
from django.db.models import JSONField


class UserPreference(models.Model):
    """
    Store user preferences learned from their behavior
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='preferences'
    )
    
    # Learned preferences from history
    preferred_tags = JSONField(
        default=list, 
        blank=True,
        help_text="List of preferred tour tags with weights, e.g., [{'tag': 'food', 'weight': 0.8}]"
    )
    preferred_price_min = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Minimum preferred price based on history"
    )
    preferred_price_max = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Maximum preferred price based on history"
    )
    preferred_duration_min = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Minimum preferred duration (hours)"
    )
    preferred_duration_max = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Maximum preferred duration (hours)"
    )
    preferred_provinces = JSONField(
        default=list,
        blank=True,
        help_text="List of preferred provinces with weights"
    )
    preferred_transportation = JSONField(
        default=list,
        blank=True,
        help_text="List of preferred transportation types"
    )
    
    # Feature vector for ML (computed periodically)
    feature_vector = JSONField(
        default=list,
        blank=True,
        help_text="Computed feature vector for content-based filtering"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Preference"
        verbose_name_plural = "User Preferences"
    
    def __str__(self):
        return f"Preferences for {self.user.username}"


class TourViewHistory(models.Model):
    """
    Track tours that users have viewed
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tour_views'
    )
    tour = models.ForeignKey(
        'Tour.Tour',
        on_delete=models.CASCADE,
        related_name='views'
    )
    view_count = models.PositiveIntegerField(default=1)
    total_view_duration = models.PositiveIntegerField(
        default=0,
        help_text="Total time spent viewing this tour (seconds)"
    )
    first_viewed_at = models.DateTimeField(auto_now_add=True)
    last_viewed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'tour')
        ordering = ['-last_viewed_at']
        indexes = [
            models.Index(fields=['user', 'last_viewed_at']),
            models.Index(fields=['tour']),
        ]
    
    def __str__(self):
        return f"{self.user.username} viewed {self.tour.name}"
    
    def increment_view(self, duration=0):
        """Increment view count and update duration"""
        self.view_count += 1
        self.total_view_duration += duration
        self.save()


class SearchHistory(models.Model):
    """
    Store user search queries for better recommendations
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='search_history'
    )
    
    # Search parameters
    query_text = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Free text search query"
    )
    province = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    place_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Specific place searched"
    )
    tags = JSONField(
        default=list,
        blank=True,
        help_text="Tags used in search filter"
    )
    min_price = models.IntegerField(null=True, blank=True)
    max_price = models.IntegerField(null=True, blank=True)
    min_duration = models.IntegerField(null=True, blank=True)
    max_duration = models.IntegerField(null=True, blank=True)
    num_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Number of days for trip planning"
    )
    budget = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total budget for trip planning"
    )
    
    # Results info
    results_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of results returned"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['province']),
        ]
    
    def __str__(self):
        return f"Search by {self.user.username} at {self.created_at}"


class TripPlan(models.Model):
    """
    Store generated trip plans
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('saved', 'Saved'),
        ('booked', 'Partially Booked'),
        ('completed', 'Completed'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trip_plans'
    )
    
    # Plan parameters
    name = models.CharField(
        max_length=255,
        blank=True,
        help_text="User-given name for the trip"
    )
    province = models.CharField(max_length=100)
    place_ids = JSONField(
        default=list,
        blank=True,
        help_text="Specific places included in planning"
    )
    num_days = models.PositiveIntegerField()
    budget = models.IntegerField(help_text="Total budget in VND")
    num_people = models.PositiveIntegerField(default=1)
    
    # User preferences for this plan
    preferred_tags = JSONField(
        default=list,
        blank=True,
        help_text="Tags user wanted to focus on"
    )
    
    # Computed results
    total_estimated_cost = models.IntegerField(
        default=0,
        help_text="Total estimated cost of tours"
    )
    total_duration_hours = models.IntegerField(
        default=0,
        help_text="Total duration of all tours (hours)"
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    
    # Sharing
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this plan is publicly shareable"
    )
    share_token = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        unique=True,
        help_text="Token for sharing the plan"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['province']),
            models.Index(fields=['share_token']),
        ]
    
    def __str__(self):
        return f"Trip to {self.province} ({self.num_days} days) by {self.user.username}"
    
    def generate_share_token(self):
        """Generate a unique share token"""
        import secrets
        self.share_token = secrets.token_urlsafe(32)
        self.save()
        return self.share_token


class TripPlanDay(models.Model):
    """
    Represents a single day in a trip plan
    """
    trip_plan = models.ForeignKey(
        TripPlan,
        on_delete=models.CASCADE,
        related_name='days'
    )
    day_number = models.PositiveIntegerField()
    date = models.DateField(
        null=True,
        blank=True,
        help_text="Actual date if user has set specific dates"
    )
    notes = models.TextField(
        blank=True,
        help_text="User notes for this day"
    )
    
    class Meta:
        unique_together = ('trip_plan', 'day_number')
        ordering = ['day_number']
    
    def __str__(self):
        return f"Day {self.day_number} of {self.trip_plan}"


class TripPlanItem(models.Model):
    """
    Individual tour item in a trip plan day
    """
    trip_plan_day = models.ForeignKey(
        TripPlanDay,
        on_delete=models.CASCADE,
        related_name='items'
    )
    tour = models.ForeignKey(
        'Tour.Tour',
        on_delete=models.CASCADE,
        related_name='trip_plan_items'
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Order of this tour in the day"
    )
    
    # Scheduling info
    suggested_start_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Suggested start time for the tour"
    )
    
    # Recommendation info
    recommendation_score = models.FloatField(
        default=0.0,
        help_text="Score from recommendation engine"
    )
    recommendation_reason = models.CharField(
        max_length=255,
        blank=True,
        help_text="Why this tour was recommended"
    )
    
    # User modifications
    is_user_added = models.BooleanField(
        default=False,
        help_text="Whether user manually added this tour"
    )
    is_user_removed = models.BooleanField(
        default=False,
        help_text="Whether user removed this from suggestions"
    )
    
    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['trip_plan_day', 'order']),
        ]
    
    def __str__(self):
        return f"{self.tour.name} on Day {self.trip_plan_day.day_number}"


class HotelSuggestion(models.Model):
    """
    Store hotel suggestions for trip plans
    """
    trip_plan = models.ForeignKey(
        TripPlan,
        on_delete=models.CASCADE,
        related_name='hotel_suggestions'
    )
    
    # Hotel info from external API
    external_id = models.CharField(
        max_length=100,
        help_text="ID from external hotel API"
    )
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Pricing
    price_per_night = models.IntegerField(
        help_text="Price per night in VND"
    )
    currency = models.CharField(max_length=10, default='VND')
    
    # Rating
    rating = models.FloatField(null=True, blank=True)
    review_count = models.PositiveIntegerField(default=0)
    
    # Images
    thumbnail_url = models.URLField(blank=True)
    
    # Booking links
    booking_url = models.URLField(
        blank=True,
        help_text="Direct booking URL"
    )
    source = models.CharField(
        max_length=50,
        default='booking.com',
        help_text="Source of the hotel data"
    )
    
    # Matching info
    distance_to_center = models.FloatField(
        null=True,
        blank=True,
        help_text="Distance to trip center point (km)"
    )
    match_score = models.FloatField(
        default=0.0,
        help_text="How well this hotel matches the trip"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-match_score', 'price_per_night']
    
    def __str__(self):
        return f"{self.name} for {self.trip_plan}"


class TourInteraction(models.Model):
    """
    Track various user interactions with tours for better recommendations
    """
    INTERACTION_TYPES = [
        ('view', 'Viewed'),
        ('click', 'Clicked'),
        ('bookmark', 'Bookmarked'),
        ('share', 'Shared'),
        ('book', 'Booked'),
        ('complete', 'Completed Tour'),
        ('rate', 'Rated'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tour_interactions'
    )
    tour = models.ForeignKey(
        'Tour.Tour',
        on_delete=models.CASCADE,
        related_name='interactions'
    )
    interaction_type = models.CharField(
        max_length=20,
        choices=INTERACTION_TYPES
    )
    
    # Additional data
    metadata = JSONField(
        default=dict,
        blank=True,
        help_text="Additional interaction data"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'interaction_type', 'created_at']),
            models.Index(fields=['tour', 'interaction_type']),
        ]
    
    def __str__(self):
        return f"{self.user.username} {self.interaction_type} {self.tour.name}"
