from django.urls import path
from . import views

urlpatterns = [
    path("tour/post/", views.tour_post, name="make_new_tour"),
    path("tour/get/<int:tour_id>/", views.tour_get, name="get_tour_info"),
    path("tour/put/<int:tour_id>/", views.tour_put, name="put_tour_info"),
    path('places/all/', views.get_all_places, name='api-get-locations'),
    path('tour/get/all/', views.get_all_tours, name='api-get-all-tours'),
    path('filter-options/', views.get_filter_options, name='api-get-filter-options'),
    path('places/popular/', views.get_popular_destinations, name='api-get-popular-destinations'),
]
