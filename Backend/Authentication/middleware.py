import urllib.parse
import logging

from asgiref.sync import sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)


class TokenAuthMiddleware:
    """
    ASGI middleware that looks for a JWT token (SimpleJWT) in the websocket
    connection and sets scope['user'] accordingly.

    It checks, in order:
      1. Authorization header (Bearer token) - most common
      2. Query string parameter "token" or "access_token"
      3. Sec-WebSocket-Protocol header
    """

    def __init__(self, inner):
        self.inner = inner
        self.jwt_auth = JWTAuthentication()

    async def __call__(self, scope, receive, send):
        # Only process websocket connections
        if scope["type"] != "websocket":
            return await self.inner(scope, receive, send)
        
        # Create instance for websocket
        instance = TokenAuthMiddlewareInstance(scope, self)
        return await instance(receive, send)


class TokenAuthMiddlewareInstance:
    def __init__(self, scope, middleware):
        # copy scope to avoid mutating original
        self.scope = dict(scope)
        self.inner = middleware.inner
        self.jwt_auth = middleware.jwt_auth

    def _extract_token_from_headers(self, headers):
        """Extract token from Authorization header (Bearer token)"""
        auth_header = headers.get("authorization") or headers.get("Authorization")
        if auth_header:
            # Format: "Bearer <token>" or "bearer <token>"
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]
        return None

    def _extract_token_from_protocol(self, headers):
        """Extract token from Sec-WebSocket-Protocol header"""
        proto = headers.get("sec-websocket-protocol") or headers.get("Sec-WebSocket-Protocol")
        if proto:
            parts = [p.strip() for p in proto.split(",")]
            # Look for JWT-like token (has 2 dots: header.payload.signature)
            for part in parts:
                if part.count(".") == 2:
                    return part
            # Fallback: return first part if no JWT pattern found
            if parts:
                return parts[0]
        return None

    async def __call__(self, receive, send):
        token = None

        # Parse headers once
        headers = {}
        for key, value in self.scope.get("headers", []):
            try:
                headers[key.decode().lower()] = value.decode()
            except (UnicodeDecodeError, AttributeError):
                continue

        # 1) Try Authorization header (Bearer token) - most common method
        token = self._extract_token_from_headers(headers)

        # 2) Try query string
        if not token:
            qs = self.scope.get("query_string", b"").decode()
            if qs:
                parsed = urllib.parse.parse_qs(qs)
                if parsed.get("token"):
                    token = parsed["token"][0]
                elif parsed.get("access_token"):
                    token = parsed["access_token"][0]

        # 3) Try Sec-WebSocket-Protocol header
        if not token:
            token = self._extract_token_from_protocol(headers)

        # 4) Validate token and attach user to scope
        if token:
            try:
                # Remove "Bearer " prefix if present (just in case)
                if token.startswith("Bearer "):
                    token = token[7:]
                
                validated_token = self.jwt_auth.get_validated_token(token)
                user = await sync_to_async(self.jwt_auth.get_user)(validated_token)
                self.scope["user"] = user
                logger.debug(f"WebSocket authenticated user: {user.username}")
            except (InvalidToken, TokenError) as e:
                logger.warning(f"Invalid JWT token in WebSocket connection: {str(e)}")
                self.scope["user"] = AnonymousUser()
            except Exception as e:
                logger.error(f"Error authenticating WebSocket connection: {str(e)}", exc_info=True)
                self.scope["user"] = AnonymousUser()
        else:
            logger.debug("No token found in WebSocket connection")
            self.scope["user"] = AnonymousUser()

        return await self.inner(self.scope, receive, send)


def TokenAuthMiddlewareStack(inner):
    """Return middleware wrapper to use in asgi.py"""
    return TokenAuthMiddleware(inner)