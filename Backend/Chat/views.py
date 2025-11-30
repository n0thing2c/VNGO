from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django.db.models import Max, Prefetch
from django.core.cache import cache
from .models import Message
from .serializers import MessageSerializer


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room = self.kwargs.get("room_name") or self.request.query_params.get("room")
        if not room:
            raise ValidationError({"room": "Room name is required"})

        limit = self.request.query_params.get("limit")
        limit_num = 100  # default
        if limit:
            try:
                n = int(limit)
                if n > 0:
                    limit_num = n
            except ValueError:
                pass

        # Use select_related to avoid N+1 queries
        qs = (
            Message.objects.filter(room=room)
            .select_related('sender', 'sender__tourist_profile', 'sender__guide_profile')
            .order_by("-created_at")[:limit_num]
        )

        qs_list = list(qs)
        qs_list.reverse()
        return qs_list


class ConversationListView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        user_username = user.username

        # Try cache first
        cache_key = f"conversations:{user.id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # Get all rooms containing the user's username
        from django.db.models import Q

        all_user_rooms = (
            Message.objects.filter(Q(room__contains=user_username))
            .values("room")
            .distinct()
        )

        room_names = [r["room"] for r in all_user_rooms]

        # Get last message time for each room
        room_entries = (
            Message.objects.filter(room__in=room_names)
            .values("room")
            .annotate(last_message_at=Max("created_at"))
            .order_by("-last_message_at")
        )

        # Prefetch last messages efficiently
        last_messages = {}
        other_user_messages = {}

        for room_name in room_names:
            # Get last message
            last_msg = (
                Message.objects.filter(room=room_name)
                .select_related('sender', 'sender__tourist_profile', 'sender__guide_profile')
                .order_by("-created_at")
                .first()
            )
            if last_msg:
                last_messages[room_name] = last_msg

            # Get other user message
            other_msg = (
                Message.objects.filter(room=room_name)
                .exclude(sender=user)
                .select_related('sender', 'sender__tourist_profile', 'sender__guide_profile')
                .order_by("-created_at")
                .first()
            )
            if other_msg:
                other_user_messages[room_name] = other_msg

        conversations = []
        for entry in room_entries:
            room_name = entry["room"]
            last_message = last_messages.get(room_name)
            other_user_message = other_user_messages.get(room_name)

            contact_name = f"Room: {room_name}"
            contact_id = None
            contact_avatar = None

            if other_user_message and other_user_message.sender:
                sender_user = other_user_message.sender
                contact_name = sender_user.username or contact_name
                contact_id = str(sender_user.id)

                # Get avatar
                if hasattr(sender_user,
                           "tourist_profile") and sender_user.tourist_profile and sender_user.tourist_profile.face_image:
                    contact_avatar = sender_user.tourist_profile.face_image
                elif hasattr(sender_user,
                             "guide_profile") and sender_user.guide_profile and sender_user.guide_profile.face_image:
                    contact_avatar = sender_user.guide_profile.face_image

            conversations.append({
                "room": room_name,
                "contactName": contact_name,
                "contactId": contact_id,
                "contactAvatar": contact_avatar,
                "lastMessage": last_message.content if last_message else "No message yet",
                "lastMessageTime": last_message.created_at.isoformat() if last_message else None,
                "responseTime": "30 minutes",
                "rating": 3.5,
                "reviewCount": 0,
            })

        # Cache for 30 seconds
        cache.set(cache_key, conversations, timeout=30)

        return Response(conversations)