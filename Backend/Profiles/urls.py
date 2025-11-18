from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.MyProfileView.as_view(), name="my-profile"),
    path(
        "upload-avatar/", views.ProfileImageUploadView.as_view(), name="upload-avatar"
    ),
]
