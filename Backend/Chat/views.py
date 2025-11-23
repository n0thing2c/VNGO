from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django.db.models import Max
from .models import Message
from .serializers import MessageSerializer


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room = self.kwargs.get("room_name") or self.request.query_params.get("room")
        if not room:
            raise ValidationError({"room": "Room name is required"})
        
        qs = Message.objects.filter(room=room).order_by("-created_at")
        limit = self.request.query_params.get("limit")
        if limit:
            try:
                n = int(limit)
                if n > 0:
                    qs = qs[:n]
            except ValueError:
                pass
        qs_list = list(qs)
        qs_list.reverse()
        return qs_list

class ConversationListView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all rooms that the user participates in
        # Room name format: username1__username2
        # Get all rooms containing the user's username (user sent or received messages)
        from django.db.models import Q
        
        user_username = user.username
        # Find all rooms containing the user's username in the room name
        all_user_rooms = Message.objects.filter(
            Q(room__contains=user_username)
        ).values("room").distinct()
        
        # Get last message time for each room and sort
        room_entries = (
            Message.objects.filter(
                room__in=[r["room"] for r in all_user_rooms]
            )
            .values("room")
            .annotate(last_message_at=Max("created_at"))
            .order_by("-last_message_at")
        )
        
        conversations = []
        for entry in room_entries:
            room_name = entry["room"]
            last_message = (
                Message.objects.filter(room=room_name)
                .order_by("-created_at")
                .select_related("sender")
                .first()
            )
            
            other_user_message = (
                Message.objects.filter(room=room_name)
                .exclude(sender=user)
                .order_by("-created_at")
                .select_related("sender")
                .first()
            )
            
            contact_name = f"Room: {room_name}"
            contact_id = room_name
            if other_user_message and other_user_message.sender:
                contact_name = other_user_message.sender.username or contact_name
                contact_id = str(other_user_message.sender.id)
            
            conversations.append(
                {
                    "room": room_name,
                    "contactName": contact_name,
                    "contactId": contact_id,
                    "lastMessage": last_message.content if last_message else "No message yet",
                    "lastMessageTime": last_message.created_at.isoformat() if last_message else None,
                    "responseTime": "30 minutes",
                    "rating": 3.5,
                    "reviewCount": 0,
                }
            )
        
        return Response(conversations)