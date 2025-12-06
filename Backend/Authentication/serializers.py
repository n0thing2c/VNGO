# authentication/serializers.py
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse
from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmailVerificationToken, PendingSignup
from Profiles.models import Tourist, Guide

User = get_user_model()


class SignupSerializer(serializers.Serializer):
    """Serializer for signup - creates PendingSignup instead of User"""

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    def validate_email(self, value):
        # Check if email already exists in User
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email has been used")

        # Check if email exists in PendingSignup
        existing_pending = PendingSignup.objects.filter(email__iexact=value).first()
        if existing_pending:
            # Check if pending signup has any active tokens
            now = timezone.now()
            has_active_tokens = EmailVerificationToken.objects.filter(
                pending_signup=existing_pending,
                used=False,
                expires_at__gt=now,
            ).exists()

            # If no active tokens, allow signup again by deleting old pending signup
            if not has_active_tokens:
                # Cleanup expired pending signup
                existing_pending.delete()
            else:
                # Still has active tokens, reject signup
                raise serializers.ValidationError(
                    "Email is already pending verification. Please check your email for the verification link."
                )
        return value

    def validate_username(self, value):
        # Check if username already exists in User
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username has been used")

        # Check if username exists in PendingSignup
        existing_pending = PendingSignup.objects.filter(username=value).first()
        if existing_pending:
            # Check if pending signup has any active tokens
            now = timezone.now()
            has_active_tokens = EmailVerificationToken.objects.filter(
                pending_signup=existing_pending,
                used=False,
                expires_at__gt=now,
            ).exists()

            # If no active tokens, allow signup again by deleting old pending signup
            if not has_active_tokens:
                # Cleanup expired pending signup
                existing_pending.delete()
            else:
                # Still has active tokens, reject signup
                raise serializers.ValidationError(
                    "Username is already pending verification. Please check your email for the verification link."
                )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        # Hash password before storing
        from django.contrib.auth.hashers import make_password

        hashed_password = make_password(password)

        # Create pending signup (user not created yet)
        pending_signup = PendingSignup.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            role=validated_data["role"],
            password=hashed_password,
        )

        # Create verification token
        ttl_minutes = getattr(settings, "EMAIL_VERIFICATION_EXPIRY", 10)
        token = EmailVerificationToken.create_for_pending_signup(
            pending_signup, ttl_minutes=ttl_minutes
        )

        # Prepare verification link
        frontend_base = getattr(settings, "FRONTEND_BASE_URL", "")
        verify_path = f"/verify-email?token={token.token}"
        verification_url = f"{frontend_base}{verify_path}"

        # Send email
        subject = "Email Verification"
        message = (
            f"Hi {pending_signup.username},\n\n"
            f"To Verify your Email, open this link:\n\n{verification_url}\n\n"
            f"Link will expire after {ttl_minutes} minutes.\n\n"
            "If you have no request, please ignore this email."
        )
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
        try:
            if from_email:
                send_mail(
                    subject,
                    message,
                    from_email,
                    [pending_signup.email],
                    fail_silently=False,
                )
            else:
                send_mail(
                    subject, message, None, [pending_signup.email], fail_silently=True
                )
        except Exception:
            pass

        return pending_signup


class MeSerializer(serializers.ModelSerializer):
    profile_completed = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "email_verified",
            "profile_completed",
            "avatar_url",
        )
        read_only_fields = fields

    def get_profile_completed(self, obj):
        try:
            if obj.role == User.ROLE_TOURIST:
                return obj.tourist_profile.is_completed
            if obj.role == User.ROLE_GUIDE:
                return obj.guide_profile.is_completed
        except (Tourist.DoesNotExist, Guide.DoesNotExist):
            return False
        return False

    def get_avatar_url(self, obj):
        try:
            if obj.role == User.ROLE_TOURIST:
                return obj.tourist_profile.face_image
            if obj.role == User.ROLE_GUIDE:
                return obj.guide_profile.face_image
        except (Tourist.DoesNotExist, Guide.DoesNotExist):
            return None
        return None


class ResendEmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for resending verification email to pending signups.
    Public endpoint - used when token expires and user wants to resend without re-signup.
    """

    email = serializers.EmailField(required=True, allow_blank=False)


class ConfirmEmailSerializer(serializers.Serializer):
    """
    Xác thực email bằng token UUID.
    Nếu có pending_signup, tạo User mới. Nếu có user, chỉ mark verified.
    """

    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            token_obj = EmailVerificationToken.objects.select_related(
                "pending_signup", "user"
            ).get(token=value, purpose=EmailVerificationToken.PURPOSE_VERIFY_EMAIL)
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token")
        if token_obj.used:
            raise serializers.ValidationError("Token has been used")
        if token_obj.is_expired():
            # Auto-cleanup expired token and its pending signup
            if token_obj.pending_signup:
                # Check if pending signup has other active tokens
                from django.utils import timezone

                has_active_tokens = (
                    EmailVerificationToken.objects.filter(
                        pending_signup=token_obj.pending_signup,
                        used=False,
                        expires_at__gt=timezone.now(),
                    )
                    .exclude(id=token_obj.id)
                    .exists()
                )

                # Delete pending signup if no active tokens left
                if not has_active_tokens:
                    token_obj.pending_signup.delete()
                else:
                    # Just delete this expired token
                    token_obj.delete()
            raise serializers.ValidationError("Token has expired")
        # attach token_obj vào serializer để view dùng tiếp
        self.context["token_obj"] = token_obj
        return value

    def save(self, **kwargs):
        token_obj = self.context.get("token_obj")
        if not token_obj:
            raise RuntimeError("token_obj missing in serializer context")

        # Get email info before any operations (in case token gets deleted)
        token_value = self.validated_data.get("token")
        email_to_check = None
        if token_obj.pending_signup:
            email_to_check = token_obj.pending_signup.email
        elif token_obj.user:
            email_to_check = token_obj.user.email

        # Re-fetch token to ensure it still exists and get latest state
        # This prevents issues if token was deleted in a concurrent request
        try:
            token_obj = EmailVerificationToken.objects.select_related(
                "pending_signup", "user"
            ).get(token=token_value, used=False)
        except EmailVerificationToken.DoesNotExist:
            # Token was used/deleted, check if user was created
            if email_to_check:
                existing_user = User.objects.filter(email=email_to_check).first()
                if existing_user and existing_user.email_verified:
                    raise serializers.ValidationError(
                        "Email has already been verified. Please try logging in."
                    )
            raise serializers.ValidationError(
                "Token has already been used. If you've already verified your email, please try logging in."
            )

        # If has pending_signup, create User
        if token_obj.pending_signup:
            pending = token_obj.pending_signup

            # Check if user already exists (may have been created from another token)
            existing_user = User.objects.filter(email=pending.email).first()
            if existing_user:
                # User already exists, just mark token as used and cleanup pending signup
                try:
                    token_obj.used = True
                    token_obj.save(update_fields=["used"])
                except Exception:
                    # Token might have been deleted, that's okay if user exists
                    pass
                # Cleanup pending if it still exists
                if PendingSignup.objects.filter(id=pending.id).exists():
                    pending.delete()
                return existing_user

            # Cleanup other expired tokens for this pending signup before creating user
            from django.utils import timezone

            EmailVerificationToken.objects.filter(
                pending_signup=pending,
                expires_at__lt=timezone.now(),
                used=False,
            ).exclude(id=token_obj.id).delete()

            # Mark token as used BEFORE deleting pending signup
            try:
                token_obj.used = True
                token_obj.save(update_fields=["used"])
            except Exception as e:
                # If token was deleted concurrently, check if user was created
                existing_user = User.objects.filter(email=pending.email).first()
                if existing_user:
                    return existing_user
                raise

            # Create user from pending signup
            # Handle race condition: if another request already created the user
            try:
                user = User(
                    username=pending.username,
                    email=pending.email,
                    password=pending.password,  # Already hashed
                    role=pending.role,
                    email_verified=True,  # Mark as verified since we're creating from verification
                    is_active=True,
                )
                user.save()
            except Exception as e:
                # User might have been created by another concurrent request
                # Check if user exists now
                existing_user = User.objects.filter(email=pending.email).first()
                if existing_user:
                    # User was created by another request, mark token as used and cleanup
                    try:
                        token_obj.used = True
                        token_obj.save(update_fields=["used"])
                    except Exception:
                        pass  # Token might have been deleted already
                    if PendingSignup.objects.filter(id=pending.id).exists():
                        pending.delete()
                    return existing_user
                # If user doesn't exist and we got an error, it's a different issue
                raise

            # Delete pending signup (CASCADE will delete remaining tokens)
            pending.delete()
            return user
        # Note: token_obj.user should not exist in normal flow
        # because users are only created AFTER verification.
        # This case is kept as a safety fallback for edge cases.
        elif token_obj.user:
            user = token_obj.user
            # User already exists, just mark verified (shouldn't happen normally)
            user.email_verified = True
            user.is_active = True
            user.save(update_fields=["email_verified", "is_active"])
            token_obj.mark_used()
            return user
        else:
            raise RuntimeError("Token has neither pending_signup nor user")


class ForgetPasswordSerializer(serializers.Serializer):
    """
    Serializer for requesting password reset.
    Sends email with reset token if user exists.
    """

    email = serializers.EmailField(required=True, allow_blank=False)

    def validate_email(self, value):
        # Check if user exists with this email
        user = User.objects.filter(email__iexact=value, email_verified=True).first()
        if not user:
            # Don't reveal if email exists or not (security)
            # Return success anyway to prevent email enumeration
            return value
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer for resetting password with token.
    Validates token and updates user password.
    """

    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_token(self, value):
        try:
            token_obj = EmailVerificationToken.objects.select_related("user").get(
                token=value, purpose=EmailVerificationToken.PURPOSE_RESET_PASSWORD
            )
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired reset token")
        
        if token_obj.used:
            raise serializers.ValidationError("Reset token has already been used")
        
        if token_obj.is_expired():
            # Cleanup expired token
            token_obj.delete()
            raise serializers.ValidationError("Reset token has expired")
        
        if not token_obj.user:
            raise serializers.ValidationError("Invalid reset token")
        
        # Attach token_obj to context for save method
        self.context["token_obj"] = token_obj
        return value

    def save(self, **kwargs):
        token_obj = self.context.get("token_obj")
        if not token_obj:
            raise RuntimeError("token_obj missing in serializer context")
        
        user = token_obj.user
        new_password = self.validated_data["new_password"]
        
        # Hash and set new password
        from django.contrib.auth.hashers import make_password
        user.set_password(new_password)
        user.save(update_fields=["password"])
        
        # Mark token as used
        token_obj.mark_used()
        
        # Delete other active reset tokens for this user
        from django.utils import timezone
        EmailVerificationToken.objects.filter(
            user=user,
            purpose=EmailVerificationToken.PURPOSE_RESET_PASSWORD,
            used=False,
            expires_at__gt=timezone.now(),
        ).exclude(id=token_obj.id).delete()
        
        return user