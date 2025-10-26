from django.urls import path
from . import views

urlpatterns = [
    path("create_tour/", views.create_tour, name="create_tour"),
]
