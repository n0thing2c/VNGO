from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid
from datetime import timedelta
from django.conf import settings


class User(AbstractUser):
    ROLE_TOURIST = "tourist"
    ROLE_GUIDE = "guide"
    ROLE_CHOICES = [(ROLE_TOURIST, "Tourist"), (ROLE_GUIDE, "Guide")]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)

    def mark_email_verified(self):
        self.email_verified = True
        self.save(update_fields=["email_verified"])

    def __str__(self):
        return self.username


class PendingSignup(models.Model):
    """Model to store signup information before email verification"""

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Hashed password
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Pending signup for {self.email}"


class EmailVerificationToken(models.Model):
    PURPOSE_VERIFY_EMAIL = "verify_email"

    pending_signup = models.ForeignKey(
        PendingSignup,
        on_delete=models.CASCADE,
        related_name="verification_tokens",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
        null=True,
        blank=True,
    )
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False, db_index=True)
    purpose = models.CharField(max_length=32, default=PURPOSE_VERIFY_EMAIL)

    class Meta:
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["pending_signup", "used"]),
            models.Index(fields=["user", "used"]),
            models.Index(fields=["expires_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        if self.pending_signup:
            return f"{self.purpose} token for pending signup {self.pending_signup_id}"
        return f"{self.purpose} token for {self.user_id}"

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def mark_used(self):
        if not self.used:
            self.used = True
            self.save(update_fields=["used"])

    @classmethod
    def create_for_pending_signup(
        cls, pending_signup, ttl_minutes=60, purpose=PURPOSE_VERIFY_EMAIL
    ):
        expires_at = timezone.now() + timedelta(minutes=ttl_minutes)
        return cls.objects.create(
            pending_signup=pending_signup, expires_at=expires_at, purpose=purpose
        )

    @classmethod
    def create_for_user(cls, user, ttl_minutes=60, purpose=PURPOSE_VERIFY_EMAIL):
        expires_at = timezone.now() + timedelta(minutes=ttl_minutes)
        return cls.objects.create(user=user, expires_at=expires_at, purpose=purpose)
