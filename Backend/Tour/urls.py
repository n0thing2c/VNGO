from django.urls import path
from . import views

urlpatterns = [
    path('nominatim/', views.nominatim_search, name='nominatim_search'),
]
