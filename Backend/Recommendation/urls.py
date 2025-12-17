from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TripPlannerView,
    TripPlanSaveView,
    TripPlanViewSet,
    SharedTripPlanView,
    TourRecommendationView,
    SimilarToursView,
    TourViewTrackingView,
    UserPreferenceView,
    RebuildUserProfileView,
)

# Router for viewsets
router = DefaultRouter()
router.register(r'trip-plans', TripPlanViewSet, basename='trip-plan')

urlpatterns = [
    # Trip Planner
    path('trip-plan/', TripPlannerView.as_view(), name='generate-trip-plan'),
    path('trip-plan/save/', TripPlanSaveView.as_view(), name='save-trip-plan'),
    path('trip-plan/shared/<str:share_token>/', SharedTripPlanView.as_view(), name='shared-trip-plan'),
    
    # Tour Recommendations
    path('tours/', TourRecommendationView.as_view(), name='tour-recommendations'),
    path('tours/<int:tour_id>/similar/', SimilarToursView.as_view(), name='similar-tours'),
    path('tours/<int:tour_id>/view/', TourViewTrackingView.as_view(), name='track-tour-view'),
    
    # User Preferences
    path('preferences/', UserPreferenceView.as_view(), name='user-preferences'),
    path('preferences/rebuild/', RebuildUserProfileView.as_view(), name='rebuild-preferences'),
    
    # ViewSet routes
    path('', include(router.urls)),
]

