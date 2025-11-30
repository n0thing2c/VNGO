from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
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

        from django.contrib.auth import get_user_model
        User = get_user_model()

        conversations = []
        for entry in room_entries:
            room_name = entry["room"]
            last_message = last_messages.get(room_name)
            other_user_message = other_user_messages.get(room_name)

            contact_name = f"Room: {room_name}"
            contact_id = None
            contact_avatar = None
            contact_user = None

            # Try to get contact info from other user's message first
            if other_user_message and other_user_message.sender:
                contact_user = other_user_message.sender
            else:
                # If no message from other user, parse room name to find them
                # Room name format: username1__username2
                if "__" in room_name:
                    parts = room_name.split("__")
                    other_username = None
                    for part in parts:
                        if part and part.lower() != user_username.lower():
                            other_username = part
                            break
                    
                    if other_username:
                        try:
                            contact_user = User.objects.select_related(
                                'tourist_profile', 'guide_profile'
                            ).get(username__iexact=other_username)
                        except User.DoesNotExist:
                            pass

            # Extract contact info from contact_user
            if contact_user:
                contact_name = contact_user.username or contact_name
                contact_id = str(contact_user.id)

                # Get avatar from tourist or guide profile
                if hasattr(contact_user, "tourist_profile") and contact_user.tourist_profile and contact_user.tourist_profile.face_image:
                    contact_avatar = contact_user.tourist_profile.face_image
                elif hasattr(contact_user, "guide_profile") and contact_user.guide_profile and contact_user.guide_profile.face_image:
                    contact_avatar = contact_user.guide_profile.face_image

            # Check if contact is online
            is_online = False
            if contact_id:
                is_online = bool(cache.get(f"user_online:{contact_id}", False))

            # Check if there are unread messages
            from .last_seen import LastSeenService
            has_unread = False
            if last_message:
                # Only check unread if last message is NOT from current user
                is_my_message = last_message.sender_id == user.id
                if not is_my_message:
                    my_last_seen = LastSeenService.get_room_last_seen(user.id, room_name)
                    if my_last_seen:
                        # Has unread if last message is after my last seen time
                        has_unread = last_message.created_at > my_last_seen
                    else:
                        # Never seen this room, so messages from others are unread
                        has_unread = True

            conversations.append({
                "room": room_name,
                "contactName": contact_name,
                "contactId": contact_id,
                "contactAvatar": contact_avatar,
                "isOnline": is_online,
                "hasUnread": has_unread,
                "lastMessage": last_message.content if last_message else "No message yet",
                "lastMessageTime": last_message.created_at.isoformat() if last_message else None,
                "responseTime": "30 minutes",
                "rating": 3.5,
                "reviewCount": 0,
            })

        # Cache for 5 seconds (match frontend polling interval)
        cache.set(cache_key, conversations, timeout=20)

        return Response(conversations)


class UserOnlineStatusView(APIView):
    """API endpoint to check if a user is online"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        cache_key = f"user_online:{user_id}"
        is_online = cache.get(cache_key, False)
        return Response({"user_id": user_id, "is_online": bool(is_online)})


class UserOnlineStatusByUsernameView(APIView):
    """API endpoint to check if a user is online by username"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(username__iexact=username)
            cache_key = f"user_online:{user.id}"
            is_online = cache.get(cache_key, False)
            return Response({
                "user_id": str(user.id),
                "username": user.username,
                "is_online": bool(is_online)
            })
        except User.DoesNotExist:
            return Response({
                "username": username,
                "is_online": False
            })


class RoomSeenStatusView(APIView):
    """API endpoint to get seen status for a room"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_name):
        from .last_seen import LastSeenService
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        current_user = request.user
        
        # Parse room name to find the other user
        # Room name format: username1__username2
        other_user = None
        if "__" in room_name:
            parts = room_name.split("__")
            for part in parts:
                if part and part.lower() != current_user.username.lower():
                    try:
                        other_user = User.objects.get(username__iexact=part)
                        break
                    except User.DoesNotExist:
                        pass
        
        result = {
            "room": room_name,
            "my_seen_at": None,
            "contact_seen_at": None,
            "contact_id": None,
            "contact_username": None,
        }
        
        # Get current user's seen status
        my_seen = LastSeenService.get_room_last_seen(current_user.id, room_name)
        if my_seen:
            result["my_seen_at"] = my_seen.isoformat()
        
        # Get other user's seen status
        if other_user:
            result["contact_id"] = str(other_user.id)
            result["contact_username"] = other_user.username
            contact_seen = LastSeenService.get_room_last_seen(other_user.id, room_name)
            if contact_seen:
                result["contact_seen_at"] = contact_seen.isoformat()
        
        return Response(result)