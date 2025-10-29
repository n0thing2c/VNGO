from django.urls import path
from . import views

urlpatterns = [
    path("create_tour/", views.create_tour, name="create_tour"),
    path("tourpost/<int:tour_id>/", views.load_tour, name="load_tour"),
]
