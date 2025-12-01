from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
import json

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
        self.user_id = getattr(user, "id", None)
        self.username = getattr(user, "username", "")

        # Cache room participants in Redis
        await self.add_user_to_room(self.room_name, self.user_id)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Broadcast that user joined this room
        await self.broadcast_online_status(True)
        
        # Mark room as seen when user connects
        await self.mark_room_seen()
        await self.broadcast_seen_status()

    async def disconnect(self, close_code):
        try:
            # Broadcast that user left this room
            await self.broadcast_online_status(False)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    @database_sync_to_async
    def is_user_online(self, user_id):
        """Check if user is online"""
        if user_id:
            return bool(cache.get(f"user_online:{user_id}", False))
        return False

    async def broadcast_online_status(self, is_in_room):
        """Broadcast user online status to the room"""
        # Check actual online status from cache
        is_online = await self.is_user_online(self.user_id)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "user.status",
                "payload": {
                    "type": "user_status",
                    "user_id": self.user_id,
                    "username": self.username,
                    "is_online": is_online,
                },
            },
        )

    async def user_status(self, event):
        """Send user status update to client"""
        await self.send_json(event["payload"])

    @database_sync_to_async
    def add_user_to_room(self, room_name, user_id):
        """Cache room participants in Redis to avoid repeated DB queries"""
        cache_key = f"room_users:{room_name}"
        user_ids = cache.get(cache_key, set())
        user_ids.add(user_id)
        cache.set(cache_key, user_ids, timeout=86400)  # 24 hours
        return user_ids

    @database_sync_to_async
    def get_room_users(self, room_name):
        """Get cached room participants"""
        cache_key = f"room_users:{room_name}"
        user_ids = cache.get(cache_key)
        if user_ids is None:
            # Fallback to DB if cache miss (rare)
            from .models import Message
            user_ids = set(
                Message.objects.filter(room=room_name)
                .values_list("sender_id", flat=True)
                .distinct()
            )
            cache.set(cache_key, user_ids, timeout=86400)
        return list(user_ids)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        if msg_type == "chat.message":
            text = (content.get("message") or "").strip()
            if not text:
                return

            user = self.scope["user"]

            # Create message in DB (async)
            message_id, created_at = await self.create_message(
                self.room_name, user, text
            )

            # Prepare payload
            payload = {
                "type": "chat.message",
                "message": text,
                "sender": {
                    "id": getattr(user, "id", None),
                    "username": getattr(user, "username", "")
                },
                "message_id": message_id,
                "created_at": created_at,
                "room": self.room_name,
            }

            # Broadcast to room immediately
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.message", "payload": payload},
            )

            # Mark room as seen for sender (they just sent a message, so they've seen everything)
            await self.mark_room_seen()
            # Broadcast seen status so the other person sees the update
            await self.broadcast_seen_status()

            # Send notifications asynchronously (don't wait)
            await self.send_notifications(payload)

            # Handle chatbot
            if "chatbot" in self.room_name and getattr(user, "username", "") != "chatbot":
                await self.handle_bot_response(text)

        elif msg_type == "typing":
            user = self.scope["user"]
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.typing", "payload": {"user_id": getattr(user, "id", None)}},
            )
        
        elif msg_type == "mark_seen":
            # User scrolled/viewed messages - mark as seen
            await self.mark_room_seen()
            await self.broadcast_seen_status()

    @database_sync_to_async
    def create_message(self, room, sender, content):
        """Create message and return minimal data"""
        from .models import Message
        msg_obj = Message.objects.create(room=room, sender=sender, content=content)
        return msg_obj.id, msg_obj.created_at.isoformat()

    async def send_notifications(self, payload):
        """Send notifications to all room participants"""
        try:
            user_ids = await self.get_room_users(self.room_name)
            notify_payload = {
                "type": "chat.notification",
                "room": self.room_name,
                "message": payload["message"],
                "sender": payload["sender"],
                "created_at": payload["created_at"],
            }
            for uid in user_ids:
                await self.channel_layer.group_send(
                    f"notify_user_{uid}",
                    {"type": "chat.notification", "payload": notify_payload},
                )
        except Exception as e:
            print(f"Error sending notifications: {e}")

    async def chat_message(self, event):
        await self.send_json(event["payload"])

    async def chat_typing(self, event):
        await self.send_json({"type": "typing", **event["payload"]})

    @database_sync_to_async
    def mark_room_seen(self):
        """Mark that user has seen messages in this room"""
        from .last_seen import LastSeenService
        LastSeenService.mark_room_as_seen(self.user_id, self.room_name)
        # Invalidate conversations cache so hasUnread updates immediately
        cache.delete(f"conversations:{self.user_id}")

    @database_sync_to_async
    def get_room_seen_info(self):
        """Get seen info for the room"""
        from .last_seen import LastSeenService
        seen_at = LastSeenService.get_room_last_seen(self.user_id, self.room_name)
        return seen_at.isoformat() if seen_at else None

    async def broadcast_seen_status(self):
        """Broadcast that user has seen messages"""
        seen_at = await self.get_room_seen_info()
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "message.seen",
                "payload": {
                    "type": "message_seen",
                    "user_id": self.user_id,
                    "username": self.username,
                    "room": self.room_name,
                    "seen_at": seen_at,
                },
            },
        )

    async def message_seen(self, event):
        """Send seen status update to client"""
        await self.send_json(event["payload"])

    async def handle_bot_response(self, user_text):
        """Process the user's message, ask AI, and send response."""
        try:
            from .ai_service import get_relevant_tours, ask_gemini
            from asgiref.sync import sync_to_async
            from django.contrib.auth import get_user_model

            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.typing", "payload": {"user_id": "chatbot"}},
            )

            tours = await database_sync_to_async(get_relevant_tours)(user_text)
            ai_response_text = await sync_to_async(ask_gemini)(user_text, tours)

            User = get_user_model()
            bot_user = await database_sync_to_async(
                lambda: User.objects.get_or_create(username="chatbot")[0]
            )()

            message_id, created_at = await self.create_message(
                self.room_name, bot_user, ai_response_text
            )

            payload = {
                "type": "chat.message",
                "message": ai_response_text,
                "sender": {"id": bot_user.id, "username": bot_user.username},
                "message_id": message_id,
                "created_at": created_at,
                "room": self.room_name,
            }

            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.message", "payload": payload},
            )
        except Exception as e:
            print(f"Error in handle_bot_response: {e}")


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user", None)
        if user is None or getattr(user, "is_anonymous", True):
            await self.close()
            return
        
        self.user_id = getattr(user, "id", None)
        self.username = getattr(user, "username", "")
        self.group_name = f"notify_user_{self.user_id or 'anon'}"
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Set user as online when they connect to the app
        await self.set_user_online(True)

    async def disconnect(self, close_code):
        try:
            # Set user as offline when they disconnect from the app
            await self.set_user_online(False)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def receive_json(self, content, **kwargs):
        """Handle incoming messages from client"""
        msg_type = content.get("type")
        
        if msg_type == "heartbeat":
            # Refresh online status when receiving heartbeat
            await self.set_user_online(True)
            # Send acknowledgment back
            await self.send_json({"type": "heartbeat_ack"})

    @database_sync_to_async
    def set_user_online(self, is_online):
        """Set user online status in cache"""
        if self.user_id:
            cache_key = f"user_online:{self.user_id}"
            if is_online:
                cache.set(cache_key, True, timeout=300)  # 5 minutes timeout
            else:
                cache.delete(cache_key)

    async def chat_notification(self, event):
        await self.send_json(event["payload"])