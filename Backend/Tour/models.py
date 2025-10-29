from django.db import models
from django.db.models import JSONField

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
    def __str__(self):
        return self.name  # or name_en if you want

class Tour(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    duration = models.IntegerField()
    min_people = models.IntegerField()
    max_people = models.IntegerField()
    transportation = models.CharField(choices=Transportation.choices,max_length=20)
    meeting_location = models.CharField(choices=MeetingLocation.choices,max_length=20)
    price = models.IntegerField()
    places = models.ManyToManyField(Place,related_name='tours',blank=True)
    tags = JSONField(default=list, blank=True)
    description = models.TextField(max_length=150, blank=True)
    rating = models.IntegerField(default=0)
    rates = models.IntegerField(default=0)

class TourImage(models.Model):
    id = models.AutoField(primary_key=True)
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name='tour_images')
    image = models.ImageField(upload_to='tour_images/', null=True, blank=True)
    isthumbnail = models.BooleanField(default=False)

