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
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)

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


def _set_refresh_cookie(response, refresh_token: str):
    """Attach refresh token as HttpOnly cookie."""
    same_site = "None"
    secure = not settings.DEBUG
    # Lax is sufficient for same-site frontend; adjust if needed
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=same_site,
        path="/auth/token/refresh/",
        max_age=int(
            getattr(settings, "SIMPLE_JWT", {})
            .get("REFRESH_TOKEN_LIFETIME")
            .total_seconds()
            if getattr(settings, "SIMPLE_JWT", {}).get("REFRESH_TOKEN_LIFETIME")
            else 24 * 60 * 60
        ),
    )


class LoginWithCookieView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        refresh = response.data.get("refresh")
        access = response.data.get("access")
        if refresh:
            _set_refresh_cookie(response, refresh)
            # Optionally hide refresh from response body
            response.data = {"access": access}
        return response


class RefreshWithCookieView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # If refresh not provided in body, read from cookie
        data = request.data.copy()
        if not data.get("refresh"):
            cookie_refresh = request.COOKIES.get("refresh_token")
            if cookie_refresh:
                data["refresh"] = cookie_refresh
        serializer = TokenRefreshSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        # Re-set (or rotate) refresh cookie if present in response data
        new_refresh = serializer.validated_data.get("refresh")
        if new_refresh:
            _set_refresh_cookie(response, new_refresh)
            # Hide refresh from body as we store it in cookie
            if "access" in serializer.validated_data:
                response.data = {"access": serializer.validated_data["access"]}
        return response
