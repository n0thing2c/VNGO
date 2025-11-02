from django.urls import path
from . import views

urlpatterns = [
    path("create_tour/", views.create_tour, name="create_tour"),
    path("tourpost/<int:tour_id>/", views.load_tour, name="load_tour"),
    path('locations/', views.get_all_places, name='api-get-locations'),
    path('tours/', views.get_all_tours, name='api-get-all-tours'),
    path('filter-options/', views.get_filter_options, name='api-get-filter-options'),
    path('popular-destinations/', views.get_popular_destinations, name='api-get-popular-destinations'),
]
