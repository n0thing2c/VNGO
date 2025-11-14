"""
Utility functions for Authentication app
"""

from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import PendingSignup, EmailVerificationToken


def cleanup_expired_pending_signups():
    """
    Cleanup expired pending signups and their tokens.

    Deletes:
    1. Pending signups with expired tokens (older than EMAIL_VERIFICATION_EXPIRY)
    2. Pending signups with all tokens used or expired
    3. Expired unused tokens linked to pending signups

    Returns:
        dict: Statistics about cleanup operation
    """
    ttl_minutes = getattr(settings, "EMAIL_VERIFICATION_EXPIRY", 10)
    expiration_threshold = timezone.now() - timedelta(minutes=ttl_minutes)

    # Count tokens to delete
    expired_tokens = EmailVerificationToken.objects.filter(
        pending_signup__isnull=False,
        expires_at__lt=timezone.now(),
        used=False,
    )
    token_count = expired_tokens.count()

    # Get pending signup IDs that have expired unused tokens
    expired_pending_ids = list(
        expired_tokens.values_list("pending_signup_id", flat=True).distinct()
    )

    # Delete expired tokens first
    deleted_tokens = expired_tokens.delete()[0]

    # Find pending signups that:
    # 1. Have expired tokens (already collected)
    # 2. Are older than expiration threshold and have no active tokens
    now = timezone.now()

    # Pending signups with all tokens expired or used
    pending_with_no_active_tokens = (
        PendingSignup.objects.filter(verification_tokens__isnull=False)
        .exclude(
            verification_tokens__used=False, verification_tokens__expires_at__gt=now
        )
        .distinct()
    )

    # Old pending signups (older than expiration threshold) with no tokens
    old_pending_with_no_tokens = PendingSignup.objects.filter(
        created_at__lt=expiration_threshold, verification_tokens__isnull=True
    )

    # Combine all pending signups to delete
    pending_to_delete_ids = set(expired_pending_ids)
    pending_to_delete_ids.update(
        pending_with_no_active_tokens.values_list("id", flat=True)
    )
    pending_to_delete_ids.update(
        old_pending_with_no_tokens.values_list("id", flat=True)
    )

    # Delete pending signups
    pending_count = 0
    if pending_to_delete_ids:
        deleted_pending = PendingSignup.objects.filter(
            id__in=pending_to_delete_ids
        ).delete()[0]
        pending_count = deleted_pending

    return {
        "pending_signups_deleted": pending_count,
        "expired_tokens_deleted": deleted_tokens,
        "threshold_minutes": ttl_minutes,
    }
