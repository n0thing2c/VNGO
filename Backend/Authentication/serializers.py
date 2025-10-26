# authentication/serializers.py
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse
from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmailVerificationToken

User = get_user_model()


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    class Meta:
        model = User
        fields = ("username", "email", "password", "role")

    def validate_email(self, value):

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email has been used")
        return value


    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if not user.id:
            raise ValueError("User was not saved correctly.")

        # tạo token xác thực email (TTL mặc định 10 phút)
        ttl_minutes = getattr(settings, "EMAIL_VERIFICATION_EXPIRY", 10)
        token = EmailVerificationToken.create_for_user(user, ttl_minutes=ttl_minutes)

        # chuẩn bị link xác thực: frontend sẽ nhận token và gọi backend confirm
        frontend_base = getattr(settings, "FRONTEND_BASE_URL", "")
        # route frontend sẽ đọc token từ query param và gọi POST /auth/email/confirm/
        verify_path = f"/verify-email?token={token.token}"
        verification_url = f"{frontend_base}{verify_path}"

        # gửi mail (production nên dùng task queue)
        subject = "Email Verification"
        message = (
            f"Hi {user.username},\n\n"
            f"To Verify your Email, open this link:\n\n{verification_url}\n\n"
            f"Link will expire after {ttl_minutes} minutes.\n\n"
            "If you have no request, please ignore this email."
        )
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
        try:
            if from_email:
                send_mail(
                    subject, message, from_email, [user.email], fail_silently=False
                )
            else:
                # nếu không cấu hình DEFAULT_FROM_EMAIL thì không ném lỗi ở dev
                send_mail(subject, message, None, [user.email], fail_silently=True)
        except Exception:
            # không block user creation nếu gửi mail thất bại; log ở production
            pass

        return user


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "email", "role", "email_verified")
        read_only_fields = fields


class RequestEmailVerificationSerializer(serializers.Serializer):
    """
    Dùng khi user đã đăng nhập muốn gửi lại email xác thực.
    Endpoint nên require IsAuthenticated.
    """

    # không cần trường nào, nhưng giữ serializer để validate future options
    pass


class ConfirmEmailSerializer(serializers.Serializer):
    """
    Xác thực email bằng token UUID.
    Client gửi POST { "token": "<uuid>" } tới endpoint xác thực.
    """

    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            token_obj = EmailVerificationToken.objects.select_related("user").get(
                token=value, purpose=EmailVerificationToken.PURPOSE_VERIFY_EMAIL
            )
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token")
        if token_obj.used:
            raise serializers.ValidationError("Token has been used")
        if token_obj.is_expired():
            raise serializers.ValidationError("Token has expired")
        # attach token_obj vào serializer để view dùng tiếp
        self.context["token_obj"] = token_obj
        return value

    def save(self, **kwargs):
        token_obj = self.context.get("token_obj")
        if not token_obj:
            raise RuntimeError("token_obj missing in serializer context")
        user = token_obj.user
        # mark email verified
        user.email_verified = True
        user.save(update_fields=["email_verified"])
        token_obj.mark_used()
        return user
