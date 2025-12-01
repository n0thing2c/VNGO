from django.db import models
from django.conf import settings
import uuid

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


class RoomLastSeen(models.Model):
    """
    Track when a user last saw messages in a room.
    Stored in database to persist across server restarts.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='room_last_seen'
    )
    room = models.CharField(max_length=255, db_index=True)
    seen_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'room']
        indexes = [
            models.Index(fields=['user', 'room']),
        ]
    
    def __str__(self):
        return f"{self.user} saw {self.room} at {self.seen_at}"


class Call(models.Model):
    """Model to store call history and manage active calls"""
    
    CALL_TYPE_CHOICES = [
        ('audio', 'Audio Call'),
        ('video', 'Video Call'),
    ]
    
    CALL_STATUS_CHOICES = [
        ('pending', 'Pending'),      # Call initiated, waiting for answer
        ('ringing', 'Ringing'),      # Callee notified
        ('accepted', 'Accepted'),    # Call in progress
        ('rejected', 'Rejected'),    # Callee rejected
        ('missed', 'Missed'),        # Callee didn't answer (timeout)
        ('ended', 'Ended'),          # Call ended normally
        ('failed', 'Failed'),        # Technical failure
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    caller = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='outgoing_calls', 
        on_delete=models.CASCADE
    )
    callee = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='incoming_calls', 
        on_delete=models.CASCADE
    )
    call_type = models.CharField(max_length=10, choices=CALL_TYPE_CHOICES, default='audio')
    status = models.CharField(max_length=20, choices=CALL_STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    # Call duration in seconds (calculated when call ends)
    duration = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['caller', 'created_at']),
            models.Index(fields=['callee', 'created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.call_type} call: {self.caller} -> {self.callee} ({self.status})"
    
    @property
    def room_name(self):
        """Generate unique room name for WebRTC signaling"""
        return f"call_{self.id}"
    
    def calculate_duration(self):
        """Calculate call duration when ended"""
        if self.answered_at and self.ended_at:
            delta = self.ended_at - self.answered_at
            self.duration = int(delta.total_seconds())
            return self.duration
        return None