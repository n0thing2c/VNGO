from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.MyProfileView.as_view(), name="my-profile"),
    path(
        "upload-avatar/", views.ProfileImageUploadView.as_view(), name="upload-avatar"
    ),
    path("guide/public/<int:guide_id>/", views.GuidePublicProfileView.as_view(), name="guide-public-profile"),
    path("guide/achievements/<int:guide_id>/",views.GuideAchievementView.as_view(), name="guide-achievements"),
<<<<<<< HEAD
    path("guide/homepage/", views.get_homepage_guides, name="guide-homepage"),
=======
    path("tourist/public/<int:tourist_id>/", views.TouristPublicProfileView.as_view(), name="tourist-public-profile"),
>>>>>>> e1bf39229904cf6d224c6ec125af770a3c6fcad4
]
