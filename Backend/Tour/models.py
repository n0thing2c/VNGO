from django.db import models
from django.db.models import JSONField
from Profiles.models import Guide, Tourist
class Transportation(models.TextChoices):
    PUBLIC = 'public', 'Public Transportation'
    PRIVATE = 'private', 'Private Transportation'
    WALKING = 'walk', 'Walking'


class MeetingLocation(models.TextChoices):
    MY = 'mine', 'My Place'
    YOUR = 'yours', 'Your Place'
    FIRST = 'first', 'First place'

class Place(models.Model):
    id = models.AutoField(primary_key=True)
    lat = models.FloatField()
    lon = models.FloatField()
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    city_en = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    province_en = models.CharField(max_length=100)
    def __str__(self):
        return self.name  # or name_en if you want

class TourPlace(models.Model):
    tour = models.ForeignKey('Tour', on_delete=models.CASCADE, related_name='tour_places')
    place = models.ForeignKey('Place', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ('tour', 'place')


class Tour(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    duration = models.IntegerField()
    min_people = models.IntegerField()
    max_people = models.IntegerField()
    transportation = models.CharField(choices=Transportation.choices,max_length=20)
    meeting_location = models.CharField(choices=MeetingLocation.choices,max_length=20)
    price = models.IntegerField()
    places = models.ManyToManyField(
        Place,
        related_name='tours',
        blank=True,
        through='TourPlace',
        through_fields=('tour', 'place'),
    )
    guide = models.ForeignKey(
        Guide,
        on_delete=models.CASCADE,
        related_name='tours',
        null=True,
    )
    tags = JSONField(default=list, blank=True)
    description = models.TextField(max_length=1000, blank=True)
    stops_descriptions = JSONField(default=list, blank=True, help_text="List of descriptions for each stop in order")
    rating_total = models.PositiveIntegerField(default=0, help_text="Sum of all ratings")
    rating_count = models.PositiveIntegerField(default=0, help_text="Number of ratings received")

    def average_rating(self):
        """Return average rating, or 0 if no ratings"""
        if self.rating_count > 0:
            return self.rating_total / self.rating_count
        return 0

    def add_rating(self, value: int):
        """Add a new rating to the tour"""
        self.rating_total += value
        self.rating_count += 1
        self.save()

    def __str__(self):
        return self.name

class TourImage(models.Model):
    id = models.AutoField(primary_key=True)
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name='tour_images')
    image = models.ImageField(upload_to='tour_images/', null=True, blank=True)
    isthumbnail = models.BooleanField(default=False)

class TourRating(models.Model):
    tourist = models.ForeignKey(
        Tourist,
        on_delete=models.CASCADE,
        related_name='tour_ratings',
        null = True,
    )
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE, related_name='ratings'
    )
    rating = models.PositiveSmallIntegerField()  # 1 to 5 stars
    review = models.TextField(max_length=1000, blank=True, null=True)
    review_tags = models.JSONField(
        default=list,
        blank=True,
        help_text="JSON array of tags describing this review, e.g., ['Family-friendly', 'Adventure']"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('tourist', 'tour')  # user can only review a tour once
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tourist} - {self.tour} ({self.rating}⭐)"

# Optional: TourRatingImage model to store multiple images per review
class TourRatingImage(models.Model):
    rating = models.ForeignKey(
        TourRating, on_delete=models.CASCADE, related_name='images'
    )
    image = models.ImageField(upload_to='tour_rating_images/')
    def __str__(self):
        return f"Image for {self.rating}"