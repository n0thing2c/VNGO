from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


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
        """
        Kỳ vọng payload JSON từ client, ví dụ:
          {"type": "chat.message", "message": "Hello"}
          {"type": "typing"}
        """
        msg_type = content.get("type")

        if msg_type == "chat.message":
            text = (content.get("message") or "").strip()
            if not text:
                return

            user = self.scope["user"]

            message_id = None
            created_at = None
            try:
                from .models import Message
                msg_obj = await database_sync_to_async(Message.objects.create)(
                    room=self.room_name, sender=user, content=text
                )
                message_id = msg_obj.id
                created_at = msg_obj.created_at.isoformat()
            except Exception:
                pass

            payload = {
                "type": "chat.message",
                "message": text,
                "sender": {"id": getattr(user, "id", None), "username": getattr(user, "username", "")},
                "message_id": message_id,
                "created_at": created_at,
                "room": self.room_name,
            }

            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.message", "payload": payload},
            )

            try:
                from .models import Message
                user_ids = await database_sync_to_async(lambda: list(
                    Message.objects.filter(room=self.room_name).values_list("sender_id", flat=True).distinct()
                ))()
                if getattr(user, "id", None) and user.id not in user_ids:
                    user_ids.append(user.id)
                notify_payload = {
                    "type": "chat.notification",
                    "room": self.room_name,
                    "message": text,
                    "sender": {"id": getattr(user, "id", None), "username": getattr(user, "username", "")},
                    "created_at": created_at,
                }
                for uid in user_ids:
                    await self.channel_layer.group_send(
                        f"notify_user_{uid}",
                        {"type": "chat.notification", "payload": notify_payload},
                    )
            except Exception:
                pass

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


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user", None)
        if user is None or getattr(user, "is_anonymous", True):
            await self.close()
            return
        self.group_name = f"notify_user_{getattr(user, 'id', 'anon')}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def chat_notification(self, event):
        await self.send_json(event["payload"])