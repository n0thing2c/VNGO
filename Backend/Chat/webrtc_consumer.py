"""
WebRTC Signaling Consumer for Video/Audio Calls

This consumer handles WebRTC signaling through Django Channels.
It does NOT handle the actual media streams - those go peer-to-peer.

Signaling flow:
1. Caller initiates call -> Server notifies callee
2. Callee accepts -> Exchange SDP offer/answer
3. Both parties exchange ICE candidates
4. P2P connection established -> Media flows directly between peers
"""

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.core.cache import cache
import json


class WebRTCConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for WebRTC signaling
    
    Message types from client:
    - call.initiate: Start a new call
    - call.accept: Accept incoming call
    - call.reject: Reject incoming call  
    - call.end: End current call
    - webrtc.offer: SDP offer from caller
    - webrtc.answer: SDP answer from callee
    - webrtc.ice_candidate: ICE candidate exchange
    """
    
    async def connect(self):
        self.call_id = self.scope.get("url_route", {}).get("kwargs", {}).get("call_id")
        
        print(f"WebRTCConsumer: Connection attempt for call_id: {self.call_id}")
        
        user = self.scope.get("user", None)
        if user is None or getattr(user, "is_anonymous", True):
            print(f"WebRTCConsumer: Rejecting anonymous user")
            await self.close()
            return
        
        self.user = user
        self.user_id = user.id
        self.username = user.username
        
        print(f"WebRTCConsumer: User {self.user_id} ({self.username}) connecting to call {self.call_id}")
        
        # Join the call room for signaling
        self.call_room = f"webrtc_call_{self.call_id}"
        await self.channel_layer.group_add(self.call_room, self.channel_name)
        
        # Also join personal notification channel for incoming calls
        self.personal_channel = f"webrtc_user_{self.user_id}"
        await self.channel_layer.group_add(self.personal_channel, self.channel_name)
        
        await self.accept()
        
        print(f"WebRTCConsumer: User {self.user_id} connected to {self.call_room} and {self.personal_channel}")
        
        # Notify others in the call room that user joined
        await self.channel_layer.group_send(
            self.call_room,
            {
                "type": "user.joined",
                "payload": {
                    "type": "user_joined",
                    "user_id": self.user_id,
                    "username": self.username,
                }
            }
        )
    
    async def disconnect(self, close_code):
        try:
            # Notify others that user left
            await self.channel_layer.group_send(
                self.call_room,
                {
                    "type": "user.left",
                    "payload": {
                        "type": "user_left",
                        "user_id": self.user_id,
                        "username": self.username,
                    }
                }
            )
            
            await self.channel_layer.group_discard(self.call_room, self.channel_name)
            await self.channel_layer.group_discard(self.personal_channel, self.channel_name)
        except Exception:
            pass
    
    async def receive_json(self, content, **kwargs):
        """Handle incoming WebSocket messages"""
        msg_type = content.get("type")
        
        print(f"WebRTCConsumer: Received message from user {self.user_id}: {msg_type}")
        
        handlers = {
            "call.initiate": self.handle_call_initiate,
            "call.accept": self.handle_call_accept,
            "call.reject": self.handle_call_reject,
            "call.end": self.handle_call_end,
            "webrtc.offer": self.handle_webrtc_offer,
            "webrtc.answer": self.handle_webrtc_answer,
            "webrtc.ice_candidate": self.handle_ice_candidate,
        }
        
        handler = handlers.get(msg_type)
        if handler:
            await handler(content)
        else:
            print(f"WebRTCConsumer: Unknown message type: {msg_type}")
            await self.send_json({
                "type": "error",
                "message": f"Unknown message type: {msg_type}"
            })
    
    # ==================== Call Management ====================
    
    async def handle_call_initiate(self, content):
        """
        Caller initiates a call
        Expected content: { type, callee_id, call_type: 'audio'|'video' }
        """
        callee_id = content.get("callee_id")
        call_type = content.get("call_type", "audio")
        
        print(f"WebRTCConsumer: handle_call_initiate from {self.user_id} to {callee_id}, type: {call_type}")
        
        if not callee_id:
            await self.send_json({
                "type": "error",
                "message": "callee_id is required"
            })
            return
        
        # Create call record in database
        call = await self.create_call(callee_id, call_type)
        print(f"WebRTCConsumer: Call created: {call}")
        
        if not call:
            await self.send_json({
                "type": "error", 
                "message": "Failed to create call"
            })
            return
        
        # Store call info in cache for quick access
        cache.set(f"active_call:{call['id']}", {
            "caller_id": self.user_id,
            "callee_id": callee_id,
            "call_type": call_type,
            "status": "pending"
        }, timeout=300)  # 5 min timeout for unanswered calls
        
        # Send confirmation to caller
        await self.send_json({
            "type": "call.initiated",
            "call_id": str(call["id"]),
            "callee_id": callee_id,
            "call_type": call_type,
        })
        
        print(f"WebRTCConsumer: Sending incoming call notification to webrtc_user_{callee_id}")
        
        # Notify callee about incoming call
        await self.channel_layer.group_send(
            f"webrtc_user_{callee_id}",
            {
                "type": "incoming.call",
                "payload": {
                    "type": "call.incoming",
                    "call_id": str(call["id"]),
                    "caller_id": self.user_id,
                    "caller_username": self.username,
                    "call_type": call_type,
                }
            }
        )
        
        print(f"WebRTCConsumer: Notification sent to callee {callee_id}")
    
    async def handle_call_accept(self, content):
        """
        Callee accepts the call
        Expected content: { type, call_id }
        """
        call_id = content.get("call_id")
        
        if not call_id:
            await self.send_json({
                "type": "error",
                "message": "call_id is required"
            })
            return
        
        # Update call status
        success = await self.update_call_status(call_id, "accepted")
        
        if not success:
            await self.send_json({
                "type": "error",
                "message": "Failed to accept call"
            })
            return
        
        # Update cache
        call_info = cache.get(f"active_call:{call_id}")
        if call_info:
            call_info["status"] = "accepted"
            cache.set(f"active_call:{call_id}", call_info, timeout=3600)  # 1 hour for active calls
        
        # Notify caller that call was accepted
        await self.channel_layer.group_send(
            f"webrtc_call_{call_id}",
            {
                "type": "call.accepted.event",
                "payload": {
                    "type": "call.accepted",
                    "call_id": call_id,
                    "accepted_by": self.user_id,
                    "username": self.username,
                }
            }
        )
    
    async def handle_call_reject(self, content):
        """
        Callee rejects the call
        Expected content: { type, call_id, reason? }
        """
        call_id = content.get("call_id")
        reason = content.get("reason", "rejected")
        
        if not call_id:
            await self.send_json({
                "type": "error",
                "message": "call_id is required"
            })
            return
        
        # Update call status
        await self.update_call_status(call_id, "rejected")
        
        # Remove from cache
        cache.delete(f"active_call:{call_id}")
        
        # Notify caller that call was rejected
        await self.channel_layer.group_send(
            f"webrtc_call_{call_id}",
            {
                "type": "call.rejected.event",
                "payload": {
                    "type": "call.rejected",
                    "call_id": call_id,
                    "rejected_by": self.user_id,
                    "reason": reason,
                }
            }
        )
    
    async def handle_call_end(self, content):
        """
        Either party ends the call
        Expected content: { type, call_id }
        """
        call_id = content.get("call_id")
        
        if not call_id:
            await self.send_json({
                "type": "error",
                "message": "call_id is required"
            })
            return
        
        # Update call status and calculate duration
        await self.end_call(call_id)
        
        # Remove from cache
        cache.delete(f"active_call:{call_id}")
        
        # Notify all participants
        await self.channel_layer.group_send(
            f"webrtc_call_{call_id}",
            {
                "type": "call.ended.event",
                "payload": {
                    "type": "call.ended",
                    "call_id": call_id,
                    "ended_by": self.user_id,
                }
            }
        )
    
    # ==================== WebRTC Signaling ====================
    
    async def handle_webrtc_offer(self, content):
        """
        Forward SDP offer from caller to callee
        Expected content: { type, call_id, sdp }
        """
        call_id = content.get("call_id")
        sdp = content.get("sdp")
        
        if not call_id or not sdp:
            await self.send_json({
                "type": "error",
                "message": "call_id and sdp are required"
            })
            return
        
        # Forward offer to the call room (excluding sender)
        await self.channel_layer.group_send(
            f"webrtc_call_{call_id}",
            {
                "type": "webrtc.offer.event",
                "payload": {
                    "type": "webrtc.offer",
                    "call_id": call_id,
                    "sdp": sdp,
                    "from_user": self.user_id,
                },
                "sender_channel": self.channel_name,
            }
        )
    
    async def handle_webrtc_answer(self, content):
        """
        Forward SDP answer from callee to caller
        Expected content: { type, call_id, sdp }
        """
        call_id = content.get("call_id")
        sdp = content.get("sdp")
        
        if not call_id or not sdp:
            await self.send_json({
                "type": "error",
                "message": "call_id and sdp are required"
            })
            return
        
        # Forward answer to the call room (excluding sender)
        await self.channel_layer.group_send(
            f"webrtc_call_{call_id}",
            {
                "type": "webrtc.answer.event",
                "payload": {
                    "type": "webrtc.answer",
                    "call_id": call_id,
                    "sdp": sdp,
                    "from_user": self.user_id,
                },
                "sender_channel": self.channel_name,
            }
        )
    
    async def handle_ice_candidate(self, content):
        """
        Forward ICE candidate to other peer
        Expected content: { type, call_id, candidate }
        """
        call_id = content.get("call_id")
        candidate = content.get("candidate")
        
        if not call_id:
            await self.send_json({
                "type": "error",
                "message": "call_id is required"
            })
            return
        
        # Forward ICE candidate to the call room (excluding sender)
        await self.channel_layer.group_send(
            f"webrtc_call_{call_id}",
            {
                "type": "webrtc.ice.event",
                "payload": {
                    "type": "webrtc.ice_candidate",
                    "call_id": call_id,
                    "candidate": candidate,
                    "from_user": self.user_id,
                },
                "sender_channel": self.channel_name,
            }
        )
    
    # ==================== Event Handlers (group_send targets) ====================
    
    async def user_joined(self, event):
        """Send user joined notification"""
        await self.send_json(event["payload"])
    
    async def user_left(self, event):
        """Send user left notification"""
        await self.send_json(event["payload"])
    
    async def incoming_call(self, event):
        """Send incoming call notification to callee"""
        await self.send_json(event["payload"])
    
    async def call_accepted_event(self, event):
        """Send call accepted notification"""
        await self.send_json(event["payload"])
    
    async def call_rejected_event(self, event):
        """Send call rejected notification"""
        await self.send_json(event["payload"])
    
    async def call_ended_event(self, event):
        """Send call ended notification"""
        await self.send_json(event["payload"])
    
    async def webrtc_offer_event(self, event):
        """Forward WebRTC offer (exclude sender)"""
        if event.get("sender_channel") != self.channel_name:
            await self.send_json(event["payload"])
    
    async def webrtc_answer_event(self, event):
        """Forward WebRTC answer (exclude sender)"""
        if event.get("sender_channel") != self.channel_name:
            await self.send_json(event["payload"])
    
    async def webrtc_ice_event(self, event):
        """Forward ICE candidate (exclude sender)"""
        if event.get("sender_channel") != self.channel_name:
            await self.send_json(event["payload"])
    
    # ==================== Database Operations ====================
    
    @database_sync_to_async
    def create_call(self, callee_id, call_type):
        """Create a new call record"""
        try:
            from .models import Call
            from django.contrib.auth import get_user_model
            
            User = get_user_model()
            callee = User.objects.get(id=callee_id)
            
            call = Call.objects.create(
                caller=self.user,
                callee=callee,
                call_type=call_type,
                status="pending"
            )
            
            return {
                "id": str(call.id),
                "caller_id": call.caller_id,
                "callee_id": call.callee_id,
                "call_type": call.call_type,
                "status": call.status,
            }
        except Exception as e:
            print(f"Error creating call: {e}")
            return None
    
    @database_sync_to_async
    def update_call_status(self, call_id, status):
        """Update call status"""
        try:
            from .models import Call
            
            call = Call.objects.get(id=call_id)
            call.status = status
            
            if status == "accepted":
                call.answered_at = timezone.now()
            
            call.save()
            return True
        except Exception as e:
            print(f"Error updating call status: {e}")
            return False
    
    @database_sync_to_async
    def end_call(self, call_id):
        """End call and calculate duration"""
        try:
            from .models import Call
            
            call = Call.objects.get(id=call_id)
            call.status = "ended"
            call.ended_at = timezone.now()
            call.calculate_duration()
            call.save()
            return True
        except Exception as e:
            print(f"Error ending call: {e}")
            return False


class CallNotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    Lightweight consumer for receiving call notifications
    Users connect to this to receive incoming call alerts even when not in a call
    """
    
    async def connect(self):
        user = self.scope.get("user", None)
        if user is None or getattr(user, "is_anonymous", True):
            print(f"CallNotificationConsumer: Rejecting anonymous user")
            await self.close()
            return
        
        self.user_id = user.id
        self.personal_channel = f"webrtc_user_{self.user_id}"
        
        print(f"CallNotificationConsumer: User {self.user_id} connecting to {self.personal_channel}")
        
        await self.channel_layer.group_add(self.personal_channel, self.channel_name)
        await self.accept()
        
        print(f"CallNotificationConsumer: User {self.user_id} connected successfully")
    
    async def disconnect(self, close_code):
        print(f"CallNotificationConsumer: User {getattr(self, 'user_id', 'unknown')} disconnecting")
        try:
            await self.channel_layer.group_discard(self.personal_channel, self.channel_name)
        except Exception:
            pass
    
    async def receive_json(self, content, **kwargs):
        """Handle client messages - mainly for responding to calls"""
        msg_type = content.get("type")
        print(f"CallNotificationConsumer: Received message type: {msg_type}")
        
        if msg_type == "call.respond":
            # User is responding to a call - they should connect to WebRTCConsumer
            call_id = content.get("call_id")
            action = content.get("action")  # 'accept' or 'reject'
            
            await self.send_json({
                "type": "call.response_received",
                "call_id": call_id,
                "action": action,
                "message": f"Please connect to /ws/call/{call_id}/ to {action} the call"
            })
    
    async def incoming_call(self, event):
        """Receive incoming call notification"""
        print(f"CallNotificationConsumer: Forwarding incoming call to user {self.user_id}: {event['payload']}")
        await self.send_json(event["payload"])
    
    async def call_cancelled(self, event):
        """Caller cancelled the call"""
        print(f"CallNotificationConsumer: Forwarding call cancelled to user {self.user_id}")
        await self.send_json(event["payload"])

