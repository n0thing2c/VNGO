from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Message 


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope.get("url_route", {}).get("kwargs", {}).get("room_name")
        if not self.room_name:
            await self.close()
            return

        user = self.scope.get("user", None)
        if user is None or getattr(user, "is_anonymous", True):
            await self.close()
            return

        self.group_name = f"chat_{self.room_name}"

        # join group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        if msg_type == "chat.message":
            text = (content.get("message") or "").strip()
            if not text:
                return

            user = self.scope["user"]

            message_id = None
            created_at = None
            
            msg_obj = await database_sync_to_async(Message.objects.create)(
                room=self.room_name, sender=user, content=text
            )
            message_id = msg_obj.id
            created_at = msg_obj.created_at.isoformat()

            payload = {
                "type": "chat.message",
                "message": text,
                "sender": {"id": getattr(user, "id", None), "username": getattr(user, "username", "")},
                "message_id": message_id,
                "created_at": created_at,
            }

            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.message", "payload": payload},
            )

        elif msg_type == "typing":
            user = self.scope["user"]
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.typing", "payload": {"user_id": getattr(user, "id", None)}},
            )

    # handlers for group_send events (type "chat.message" -> method chat_message)
    async def chat_message(self, event):
        await self.send_json(event["payload"])

    async def chat_typing(self, event):
        await self.send_json({"type": "typing", **event["payload"]})