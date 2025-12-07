from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SignUpView,
    ConfirmEmailView,
    MeView,
    ResendEmailVerificationView,
    LoginWithCookieView,
    RefreshWithCookieView,
    LogoutView,
    RequestPasswordResetView,
    ConfirmPasswordResetView,
)

urlpatterns = [
    path("login/", LoginWithCookieView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", RefreshWithCookieView.as_view(), name="refresh"),
    path("signup/", SignUpView.as_view(), name="signup"),
    path("email/confirm/", ConfirmEmailView.as_view(), name="confirm_email"),
    path("email/resend/", ResendEmailVerificationView.as_view(), name="resend_email"),
    path("password/forget/", RequestPasswordResetView.as_view(), name="forget_password"),
    path("password/reset/", ConfirmPasswordResetView.as_view(), name="reset_password"),
    path("me/", MeView.as_view(), name="me"),
    path("api-auth/", include("rest_framework.urls")),
]
