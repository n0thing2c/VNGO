from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from .models import Message
from .serializers import MessageSerializer

# Create your views here.

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
        # return oldest->newest so UI can append; convert to list if sliced
        qs_list = list(qs)
        qs_list.reverse()
        return qs_list


class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        room = self.kwargs.get("room_name") or self.request.data.get("room")
        if not room:
            raise ValidationError({"room": "Room name is required"})
        
        serializer.save(sender=self.request.user, room=room)