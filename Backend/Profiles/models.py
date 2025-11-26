from django.db import models
from django.conf import settings


# Choices for Gender fields
class Gender(models.TextChoices):
    MALE = "Male", "Male"
    FEMALE = "Female", "Female"
    OTHER = "Other", "Other"


class Tourist(models.Model):
    # This is the link to your User model.
    # primary_key=True makes this the PK, just like 'GuestID' in your diagram.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="tourist_profile",  # Use this to access from the user
    )

    # Below fields are from your diagram
    name = models.CharField(max_length=255, blank=True)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=10, choices=Gender.choices, blank=True, null=True
    )
    nationality = models.CharField(max_length=100, blank=True, null=True)
    face_image = models.URLField(max_length=2055, blank=True, null=True)

    def __str__(self):
        return f"Tourist Profile for {self.user.username}"

    @property
    def is_completed(self):
        required_fields = ["name", "age", "gender", "nationality"]
        for field in required_fields:
            if not getattr(self, field):
                return False
        return True


class Guide(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="guide_profile",
    )

    name = models.CharField(max_length=255, blank=True)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=10, choices=Gender.choices, blank=True, null=True
    )
    rating_total = models.PositiveIntegerField(
        default=0, help_text="Sum of all ratings received"
    )
    rating_count = models.PositiveIntegerField(
        default=0, help_text="Number of ratings received"
    )

    languages = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    face_image = models.URLField(max_length=2055, blank=True, null=True)
    bio = models.TextField(max_length=2000, blank=True, null=True, help_text="Giới thiệu bản thân (About me)")
    def average_rating(self):
        """Return average rating, or 0 if no ratings"""
        if self.rating_count > 0:
            return self.rating_total / self.rating_count
        return 0

    def add_rating(self, value: int):
        """Add a new rating"""
        self.rating_total += value
        self.rating_count += 1
        self.save()

    def __str__(self):
        return f"Guide Profile for {self.user.username}"

    @property
    def is_completed(self):
        required_fields = ["name", "age", "gender", "location"]
        for field in required_fields:
            if not getattr(self, field):
                return False
        languages = self.languages or []
        if isinstance(languages, list):
            return len(languages) > 0
        return bool(languages)

class GuideRating(models.Model):
    tourist = models.ForeignKey(
        Tourist,
        on_delete=models.CASCADE,
        related_name='guide_ratings',
        null=True,
        blank=True,
    )
    guide = models.ForeignKey(
        Guide,
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    rating = models.PositiveSmallIntegerField()  # 1 to 5 stars
    review = models.TextField(max_length=1000, blank=True, null=True)
    review_tags = models.JSONField(
        default=list,
        blank=True,
        help_text="JSON array of tags describing this review, e.g., ['Friendly', 'Professional']"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('tourist', 'guide')  # one user can rate a guide only once
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tourist} - {self.guide} ({self.rating}⭐)"


class GuideRatingImage(models.Model):
    rating = models.ForeignKey(
        GuideRating,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='guide_rating_images/')

    def __str__(self):
        return f"Image for {self.rating}"