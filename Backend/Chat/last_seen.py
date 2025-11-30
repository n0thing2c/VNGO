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
        """
        now = timezone.now().isoformat()
        cache.set(f"room_seen:{user_id}:{room_name}", now, timeout=None)

    @staticmethod
    def get_room_last_seen(user_id, room_name):
        """
        Get user's last seen time for a room (to calculate unread)

        Returns:
            datetime object or None (timezone-aware)
        """
        last_seen_str = cache.get(f"room_seen:{user_id}:{room_name}")
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
