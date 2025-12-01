from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, timedelta


class LastSeenService:
    """Service to manage user's last seen status"""

    @staticmethod
    def update_last_seen(user_id, room_name=None):
        """
        Update user's last activity time

        Args:
            user_id: User's ID
            room_name: Room name (optional, to track which room user is in)
        """
        now = timezone.now().isoformat()

        # Save general last seen
        cache.set(f"last_seen:{user_id}", now, timeout=None)

        # If room_name provided, save last seen for that room
        if room_name:
            cache.set(f"last_seen:{user_id}:{room_name}", now, timeout=86400)  # 24h

    @staticmethod
    def get_last_seen(user_id):
        """
        Get user's last activity time

        Returns:
            datetime object or None (timezone-aware)
        """
        last_seen_str = cache.get(f"last_seen:{user_id}")
        if last_seen_str:
            try:
                dt = datetime.fromisoformat(last_seen_str)
                # Ensure timezone-aware
                if dt.tzinfo is None:
                    dt = timezone.make_aware(dt)
                return dt
            except:
                return None
        return None

    @staticmethod
    def get_last_seen_in_room(user_id, room_name):
        """
        Get user's last seen time in a specific room

        Returns:
            datetime object or None (timezone-aware)
        """
        last_seen_str = cache.get(f"last_seen:{user_id}:{room_name}")
        if last_seen_str:
            try:
                dt = datetime.fromisoformat(last_seen_str)
                # Ensure timezone-aware
                if dt.tzinfo is None:
                    dt = timezone.make_aware(dt)
                return dt
            except:
                return None
        return None

    @staticmethod
    def is_online(user_id, threshold_seconds=300):
        """
        Check if user is currently online

        Args:
            threshold_seconds: Seconds threshold to consider online (default 5 minutes)

        Returns:
            True if online, False if offline
        """
        last_seen = LastSeenService.get_last_seen(user_id)
        if not last_seen:
            return False

        time_diff = timezone.now() - last_seen
        return time_diff.total_seconds() < threshold_seconds

    @staticmethod
    def get_status_text(user_id):
        """
        Get status display text

        Returns:
            "Online" or "Active 5 minutes ago" or "Active 2 hours ago"
        """
        last_seen = LastSeenService.get_last_seen(user_id)
        if not last_seen:
            return "Offline"

        time_diff = timezone.now() - last_seen
        seconds = int(time_diff.total_seconds())

        # Online if active within 5 minutes
        if seconds < 300:
            return "Online"

        # Under 1 hour: show minutes
        if seconds < 3600:
            minutes = seconds // 60
            return f"Active {minutes} minute{'s' if minutes > 1 else ''} ago"

        # Under 24 hours: show hours
        if seconds < 86400:
            hours = seconds // 3600
            return f"Active {hours} hour{'s' if hours > 1 else ''} ago"

        # Over 24 hours: show days
        days = seconds // 86400
        return f"Active {days} day{'s' if days > 1 else ''} ago"

    @staticmethod
    def mark_room_as_seen(user_id, room_name):
        """
        Mark that user has seen the room (to calculate unread messages)
        Saves to both database (persistent) and cache (fast access)
        """
        from .models import RoomLastSeen
        
        now = timezone.now()
        
        # Save to database (persistent)
        RoomLastSeen.objects.update_or_create(
            user_id=user_id,
            room=room_name,
            defaults={'seen_at': now}
        )
        
        # Also cache for fast access
        cache.set(f"room_seen:{user_id}:{room_name}", now.isoformat(), timeout=86400)

    @staticmethod
    def get_room_last_seen(user_id, room_name):
        """
        Get user's last seen time for a room (to calculate unread)
        Checks cache first, falls back to database

        Returns:
            datetime object or None (timezone-aware)
        """
        # Try cache first (fast)
        cache_key = f"room_seen:{user_id}:{room_name}"
        last_seen_str = cache.get(cache_key)
        
        if last_seen_str:
            try:
                dt = datetime.fromisoformat(last_seen_str)
                if dt.tzinfo is None:
                    dt = timezone.make_aware(dt)
                return dt
            except:
                pass
        
        # Fallback to database
        from .models import RoomLastSeen
        try:
            record = RoomLastSeen.objects.get(user_id=user_id, room=room_name)
            # Re-cache for next time
            cache.set(cache_key, record.seen_at.isoformat(), timeout=86400)
            return record.seen_at
        except RoomLastSeen.DoesNotExist:
            return None
