from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib import messages
from .models import User, EmailVerificationToken, PendingSignup
from .utils import cleanup_expired_pending_signups


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "role",
        "email_verified",
        "is_superuser",
    )
    list_filter = ("role", "email_verified")
    search_fields = ("username", "email")
    ordering = ("username",)


@admin.action(description="Cleanup expired pending signups")
def cleanup_expired_action(modeladmin, request, queryset):
    """Admin action to cleanup expired pending signups"""
    result = cleanup_expired_pending_signups()
    modeladmin.message_user(
        request,
        f"Cleanup completed: {result['pending_signups_deleted']} pending signups and "
        f"{result['expired_tokens_deleted']} tokens deleted.",
        messages.SUCCESS,
    )


@admin.register(PendingSignup)
class PendingSignupAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "created_at", "has_active_tokens")
    list_filter = ("role", "created_at")
    search_fields = ("username", "email")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
    actions = [cleanup_expired_action]

    def has_active_tokens(self, obj):
        """Check if pending signup has any active (unused and not expired) tokens"""
        from django.utils import timezone
        from .models import EmailVerificationToken

        has_active = EmailVerificationToken.objects.filter(
            pending_signup=obj,
            used=False,
            expires_at__gt=timezone.now(),
        ).exists()
        return "Yes" if has_active else "No"

    has_active_tokens.short_description = "Has Active Tokens"
    has_active_tokens.boolean = True


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("pending_signup", "user", "token", "purpose", "used", "created_at", "expires_at")
    list_filter = ("purpose", "used")
    search_fields = ("user__username", "pending_signup__username", "pending_signup__email", "token")
    ordering = ("-created_at",)
