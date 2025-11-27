from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.MyProfileView.as_view(), name="my-profile"),
    path(
        "upload-avatar/", views.ProfileImageUploadView.as_view(), name="upload-avatar"
    ),
    path("guide/rate/<int:guide_id>/", views.GuideRateView.as_view(), name="guide-rate"),
    path("guide/ratings/<int:guide_id>/", views.GuideRatingsView.as_view(), name="guide-ratings"),
    path("guide/public/<int:guide_id>/", views.GuidePublicProfileView.as_view(), name="guide-public-profile"),
    path("guide/<int:guide_id>/tour-reviews/", views.GuideTourReviewsView.as_view(), name="guide-tour-reviews"),

]
