from rest_framework import serializers
from .models import Tourist, Guide

class TouristProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tourist
        # List all fields from diagram
        fields = ['name', 'age', 'gender', 'nationality', 'face_image']

class GuideProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guide
        # List all fields from diagram
        fields = ['name', 'age', 'gender', 'rating', 'languages', 'location', 'face_image']