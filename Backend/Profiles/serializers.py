from rest_framework import serializers
from .models import Tourist, Guide


class TouristProfileSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Tourist
        fields = ["name", "age", "gender", "nationality", "face_image", "is_completed"]

    def get_is_completed(self, obj):
        return obj.is_completed


class GuideProfileSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Guide
        fields = [
            "name",
            "age",
            "gender",
            "rating",
            "languages",
            "location",
            "face_image",
            "is_completed",
        ]

    def get_is_completed(self, obj):
        return obj.is_completed
