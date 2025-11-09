from django.db import models
from django.conf import settings

# Create your models here.
class Message(models.Model):
    room = models.CharField(max_length=255, db_index=True)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.room} | {self.sender} | {self.created_at}"