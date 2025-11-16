from rest_framework import serializers
from .models import Message
from django.contrib.auth import get_user_model

User = get_user_model()

class SenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")

class MessageSerializer(serializers.ModelSerializer):
    sender = SenderSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "room", "sender", "content", "created_at")