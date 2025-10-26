from django.db import models


# Create your models here.
class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    tour = models.ForeignKey('Tour.Tour' ,on_delete=models.CASCADE,related_name='comments')
    #commentator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()

class CommentImage(models.Model):
    id = models.AutoField(primary_key=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_photos')
    image = models.ImageField(upload_to='comments/', null=True, blank=True)