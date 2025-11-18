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
    # This is the link to your User model.
    # primary_key=True makes this the PK, just like 'GuideID' in your diagram.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="guide_profile",  # Use this to access from the user
    )

    # Below fields are from your diagram
    name = models.CharField(max_length=255, blank=True)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=10, choices=Gender.choices, blank=True, null=True
    )
    rating = models.FloatField(default=0.0)

    # 'languages' is a list of strings in your diagram. JSONField is perfect for this.
    languages = models.JSONField(default=list, blank=True)

    location = models.CharField(max_length=255, blank=True, null=True)
    face_image = models.URLField(max_length=2055, blank=True, null=True)

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
