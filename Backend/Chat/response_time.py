"""
Utility module to calculate guide's average first response time.
Calculates the average time a guide takes to respond to the FIRST message 
from a tourist in each conversation room.
"""
from django.core.cache import cache
from django.db.models import Min
from .models import Message


# Cache timeout: 1 hour (response time doesn't change frequently)
RESPONSE_TIME_CACHE_TIMEOUT = 3600


def get_guide_first_response_time(guide_id: int) -> str | None:
    """
    Get the cached or calculated average first response time for a guide.
    
    Args:
        guide_id: The ID of the guide user
        
    Returns:
        Formatted response time string or None if no data available
    """
    cache_key = f"guide_response_time:{guide_id}"
    cached = cache.get(cache_key)
    
    if cached is not None:
        return cached if cached != "" else None
    
    # Calculate and cache
    response_time = _calculate_guide_first_response_time(guide_id)
    
    # Cache empty string for None to distinguish from cache miss
    cache.set(cache_key, response_time or "", timeout=RESPONSE_TIME_CACHE_TIMEOUT)
    
    return response_time


def _calculate_guide_first_response_time(guide_id: int) -> str | None:
    """
    Calculate the average time a guide takes to respond to the first message
    from tourists across all conversation rooms.
    
    Algorithm:
    1. Find all rooms where guide has sent messages
    2. For each room, find the first message from a tourist
    3. Find the guide's first reply after that tourist message
    4. Calculate the response time for each room
    5. Return the average
    
    Args:
        guide_id: The ID of the guide user
        
    Returns:
        Formatted response time string or None if no data available
    """
    # Get all unique rooms where the guide has sent messages
    guide_rooms = (
        Message.objects
        .filter(sender_id=guide_id)
        .values_list('room', flat=True)
        .distinct()
    )
    
    if not guide_rooms:
        return None
    
    response_times_seconds = []
    
    for room in guide_rooms:
        response_time = _calculate_room_first_response(room, guide_id)
        if response_time is not None:
            response_times_seconds.append(response_time)
    
    if not response_times_seconds:
        return None
    
    # Calculate average
    avg_seconds = sum(response_times_seconds) / len(response_times_seconds)
    
    return _format_response_time(avg_seconds)


def _calculate_room_first_response(room: str, guide_id: int) -> float | None:
    """
    Calculate the guide's first response time for a specific room.
    
    Args:
        room: Room name
        guide_id: The ID of the guide user
        
    Returns:
        Response time in seconds, or None if cannot be calculated
    """
    # Skip chatbot rooms
    if 'chatbot' in room.lower():
        return None
    
    # Get the first message in this room that is NOT from the guide (tourist's message)
    first_tourist_msg = (
        Message.objects
        .filter(room=room)
        .exclude(sender_id=guide_id)
        .order_by('created_at')
        .values('created_at')
        .first()
    )
    
    if not first_tourist_msg:
        return None
    
    tourist_msg_time = first_tourist_msg['created_at']
    
    # Get the first message from guide AFTER the tourist's first message
    first_guide_reply = (
        Message.objects
        .filter(
            room=room,
            sender_id=guide_id,
            created_at__gt=tourist_msg_time
        )
        .order_by('created_at')
        .values('created_at')
        .first()
    )
    
    if not first_guide_reply:
        return None
    
    guide_reply_time = first_guide_reply['created_at']
    
    # Calculate response time in seconds
    delta = (guide_reply_time - tourist_msg_time).total_seconds()
    
    # Sanity check: ignore negative or extremely long response times (> 7 days)
    if delta < 0 or delta > 604800:  # 7 days in seconds
        return None
    
    return delta


def _format_response_time(seconds: float) -> str:
    """
    Format response time in seconds to a human-readable string.
    
    Args:
        seconds: Response time in seconds
        
    Returns:
        Formatted string like "5 minutes", "2 hours", etc.
    """
    if seconds < 60:
        return "Less than a minute"
    
    minutes = seconds / 60
    
    if minutes < 60:
        mins = round(minutes)
        if mins == 1:
            return "1 minute"
        elif mins < 5:
            return f"{mins} minutes"
        elif mins < 15:
            return "~10 minutes"
        elif mins < 45:
            return "~30 minutes"
        else:
            return "~1 hour"
    
    hours = minutes / 60
    
    if hours < 24:
        hrs = round(hours)
        if hrs == 1:
            return "~1 hour"
        elif hrs < 3:
            return "~2 hours"
        elif hrs < 6:
            return "A few hours"
        elif hrs < 12:
            return "Several hours"
        else:
            return "Within a day"
    
    days = hours / 24
    
    if days < 2:
        return "~1 day"
    elif days < 7:
        return f"~{round(days)} days"
    else:
        return "More than a week"


def invalidate_guide_response_time_cache(guide_id: int) -> None:
    """
    Invalidate the cached response time for a guide.
    Call this when a guide sends a new message.
    
    Args:
        guide_id: The ID of the guide user
    """
    cache_key = f"guide_response_time:{guide_id}"
    cache.delete(cache_key)
