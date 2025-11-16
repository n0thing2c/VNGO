"""
ASGI config for VNGO project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from Authentication.middleware import TokenAuthMiddlewareStack as WSAuthMiddlewareStack
from Chat.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VNGO.settings')

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": WSAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        ),
    }
)
