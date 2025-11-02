from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import (
    SignupSerializer,
    MeSerializer,
    ConfirmEmailSerializer,
    ResendEmailVerificationSerializer,
)
from .models import EmailVerificationToken, PendingSignup

User = get_user_model()


class SignUpView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pending_signup = serializer.save()

        # Return simple success response
        return Response(
            {
                "detail": "Please check your email to verify your account. Your account will be created after verification.",
                "username": pending_signup.username,
                "email": pending_signup.email,
            },
            status=status.HTTP_201_CREATED,
        )


class ConfirmEmailView(generics.GenericAPIView):
    serializer_class = ConfirmEmailSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"detail": "Email verified successfully."})


class MeView(generics.RetrieveAPIView):
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ResendEmailVerificationView(generics.GenericAPIView):
    """
    Resend verification email for pending signups.
    Public endpoint (no auth required) - used when token expires.
    User can signup again, but this provides a way to resend without re-signup.
    """

    serializer_class = ResendEmailVerificationSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Return validation errors in a clear format
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        email = serializer.validated_data["email"]

        # Find pending signup
        pending_signup = PendingSignup.objects.filter(email__iexact=email).first()
        if not pending_signup:
            # Don't reveal if email exists or not (security)
            return Response(
                {
                    "detail": "If this email is pending verification, a new email will be sent."
                },
                status=status.HTTP_200_OK,
            )

        # Check if user already exists (shouldn't happen, but safety check)
        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"detail": "Email has already been verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if there are active tokens - allow resend even if active tokens exist
        # (user might not have received the email, so we allow resend)
        from django.utils import timezone

        now = timezone.now()
        active_tokens = EmailVerificationToken.objects.filter(
            pending_signup=pending_signup,
            used=False,
            expires_at__gt=now,
        )

        # Delete old active tokens before creating new one (cleanup)
        if active_tokens.exists():
            active_tokens.delete()

        # Create new token
        ttl_minutes = getattr(settings, "EMAIL_VERIFICATION_EXPIRY", 10)
        token = EmailVerificationToken.create_for_pending_signup(
            pending_signup, ttl_minutes=ttl_minutes
        )
        verification_url = f"{getattr(settings, 'FRONTEND_BASE_URL', '')}/verify-email?token={token.token}"

        # Send email
        from django.core.mail import send_mail

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

        # Don't reveal if email was sent successfully (security)
        return Response(
            {
                "detail": "If this email is pending verification, a new email will be sent."
            },
            status=status.HTTP_200_OK,
        )
