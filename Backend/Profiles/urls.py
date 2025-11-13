from django.urls import path
from . import views

urlpatterns = [
    # This one path handles GET, PUT, and PATCH for the user's own profile
    path('me/', views.MyProfileView.as_view(), name='my-profile'),
]