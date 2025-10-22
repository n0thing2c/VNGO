from django.db import models

from Tour.models import TourImage


# Create your models here.
class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    #commentator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    photo = models.ImageField(upload_to='comments/', null=True, blank=True)