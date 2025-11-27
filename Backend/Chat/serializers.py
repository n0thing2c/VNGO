from rest_framework import serializers
from rest_framework import serializers
from .models import Message
from django.contrib.auth import get_user_model

User = get_user_model()

class SenderSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "avatar")

    def get_avatar(self, obj):
        if hasattr(obj, "tourist_profile") and obj.tourist_profile.face_image:
            return obj.tourist_profile.face_image
        if hasattr(obj, "guide_profile") and obj.guide_profile.face_image:
            return obj.guide_profile.face_image
        return None

class MessageSerializer(serializers.ModelSerializer):
    sender = SenderSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "room", "sender", "content", "created_at")