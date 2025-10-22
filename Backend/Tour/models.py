from django.db import models
from django.db.models import ManyToManyField


class Transportation(models.TextChoices):
    PUBLIC = 'public', 'Public transportation'
    PRIVATE = 'private', 'Private transportation'
    WALKING = 'walking', 'Walking'


class MeetingLocation(models.TextChoices):
    MY = 'my', 'My Place'
    YOUR = 'your', 'Your Place'
    FIRST = 'first', 'First place'

class Place(models.Model):
    id = models.AutoField(primary_key=True)
    lat = models.FloatField()
    lng = models.FloatField()
    name = models.CharField(max_length=100)


class Tour(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    duration = models.IntegerField()
    min_people = models.IntegerField()
    max_people = models.IntegerField()
    transportation = models.CharField(choices=Transportation.choices,max_length=20)
    meeting_location = models.CharField(choices=MeetingLocation.choices,max_length=20)
    price = models.IntegerField()
    thumbnail = models.ImageField(upload_to='tour_thumbnails/',null=True,blank=True)
    places = models.ManyToManyField(Place,related_name='tours',blank=True)


class TourImage(models.Model):
    id = models.AutoField(primary_key=True)
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name='tour_images')
    image = models.ImageField(upload_to='tour_images/', null=True, blank=True)

