from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import (
    SignupSerializer,
    MeSerializer,
    ConfirmEmailSerializer,
    RequestEmailVerificationSerializer,
)
from .models import EmailVerificationToken

User = get_user_model()


class SignUpView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return simple success response
        return Response(
            {
                "detail": "User created successfully. Please check your email to verify your account.",
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED
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
    serializer_class = RequestEmailVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.email_verified:
            return Response(
                {"detail": "Email already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tạo token mới
        token = EmailVerificationToken.create_for_user(user, ttl_minutes=10)
        verification_url = f"{getattr(settings, 'FRONTEND_BASE_URL', '')}/verify-email?token={token.token}"

        # Gửi email
        from django.core.mail import send_mail

        subject = "Email Verification"
        message = f"Hi {user.username}, click here to verify: {verification_url}"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
        try:
            send_mail(subject, message, from_email, [user.email], fail_silently=True)
        except Exception:
            pass

        return Response({"detail": "Verification email sent."})
