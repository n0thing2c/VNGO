# profiles/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Tourist, Guide

# We need to import the User model from your 'authentication' app
# A bit of a workaround to avoid circular imports, but safe.
User = settings.AUTH_USER_MODEL

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    When a new User is created, create their corresponding profile.
    """
    if created:
        if instance.role == 'tourist':
            Tourist.objects.create(user=instance)
        elif instance.role == 'guide':
            Guide.objects.create(user=instance)