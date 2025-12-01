from rest_framework import serializers
from .models import Message, Call
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


class CallUserSerializer(serializers.ModelSerializer):
    """Serializer for user info in call context"""
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "avatar")

    def get_avatar(self, obj):
        if hasattr(obj, "tourist_profile") and obj.tourist_profile and obj.tourist_profile.face_image:
            return obj.tourist_profile.face_image
        if hasattr(obj, "guide_profile") and obj.guide_profile and obj.guide_profile.face_image:
            return obj.guide_profile.face_image
        return None


class CallSerializer(serializers.ModelSerializer):
    """Serializer for Call model"""
    caller = CallUserSerializer(read_only=True)
    callee = CallUserSerializer(read_only=True)
    room_name = serializers.ReadOnlyField()
    duration_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Call
        fields = (
            "id",
            "caller",
            "callee",
            "call_type",
            "status",
            "room_name",
            "created_at",
            "answered_at",
            "ended_at",
            "duration",
            "duration_formatted",
        )
        read_only_fields = ("id", "created_at", "answered_at", "ended_at", "duration")

    def get_duration_formatted(self, obj):
        """Format duration as mm:ss"""
        if obj.duration:
            minutes = obj.duration // 60
            seconds = obj.duration % 60
            return f"{minutes:02d}:{seconds:02d}"
        return None


class CallInitiateSerializer(serializers.Serializer):
    """Serializer for initiating a call via REST API"""
    callee_id = serializers.IntegerField()
    call_type = serializers.ChoiceField(choices=["audio", "video"], default="audio")