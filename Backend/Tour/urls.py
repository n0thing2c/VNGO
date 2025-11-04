from django.urls import path
from . import views

urlpatterns = [
    path("post/", views.tour_post, name="make_new_tour"),
    path("get/<int:tour_id>/", views.tour_get, name="get_tour_info"),
    path("put/<int:tour_id>/", views.tour_put, name="put_tour_info"),
]
