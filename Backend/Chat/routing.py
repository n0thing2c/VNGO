from django.urls import re_path
from . import consumers
from . import webrtc_consumer

websocket_urlpatterns = [
    # Chat WebSocket routes
    re_path(r"ws/chat/(?P<room_name>[^/]+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"ws/notify/$", consumers.NotificationConsumer.as_asgi()),
    
    # WebRTC Call routes
    re_path(r"ws/call/(?P<call_id>[^/]+)/$", webrtc_consumer.WebRTCConsumer.as_asgi()),
    re_path(r"ws/call-notify/$", webrtc_consumer.CallNotificationConsumer.as_asgi()),
]