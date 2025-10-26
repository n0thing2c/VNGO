from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EmailVerificationToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "email_verified",
        "is_superuser",
    )
    list_filter = ("role", "email_verified")
    search_fields = ("username", "email")
    ordering = ("username",)


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "purpose", "used", "created_at", "expires_at")
    list_filter = ("purpose", "used")
    search_fields = ("user__username", "token")
    ordering = ("-created_at",)
