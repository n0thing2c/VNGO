from django.urls import path
from . import views

urlpatterns = [
    # Tour CRUD
    path("tour/post/", views.tour_post, name="make_new_tour"),
    path("tour/get/<int:tour_id>/", views.tour_get, name="get_tour_info"),
    path("tour/put/<int:tour_id>/", views.tour_put, name="put_tour_info"),
    path("tour/get/all/", views.get_all_tours, name='api-get-all-tours'),
    path("tour/my-tours/", views.get_my_tours, name="get_my_tours"),  # NEW: For Guide Management
    
    # Tour Details
    path("tour/achievements/<int:tour_id>/", views.tour_achievements, name="get_tour_achievements"),
    path('tour/rate/<int:tour_id>/', views.tour_rate, name='api-post-rate'),
    path('tour/ratings/<int:tour_id>/', views.tour_get_ratings, name='api-get-ratings'),
    
    # Places & Locations
    path('places/all/', views.get_all_places, name='api-get-locations'),
    path('places/popular/', views.get_popular_destinations, name='api-get-popular-destinations'),
    path('provinces/all/', views.get_all_provinces, name='api-get-all-provinces'),
    
    # Filters
    path('filter-options/', views.get_filter_options, name='api-get-filter-options'),
]
