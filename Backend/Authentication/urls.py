from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SignUpView,
    ConfirmEmailView,
    MeView,
    ResendEmailVerificationView,
)

urlpatterns = [
    path("token/", TokenObtainPairView.as_view(), name="get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("signup/", SignUpView.as_view(), name="signup"),
    path("email/confirm/", ConfirmEmailView.as_view(), name="confirm_email"),
    path("email/resend/", ResendEmailVerificationView.as_view(), name="resend_email"),
    path("me/", MeView.as_view(), name="me"),
    path("api-auth/", include("rest_framework.urls")),
]
