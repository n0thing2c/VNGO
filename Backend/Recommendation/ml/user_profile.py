"""
User profile builder for personalized recommendations.
Builds user preference vectors from their interaction history.
"""

import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from django.utils import timezone
import json


class UserProfileBuilder:
    """
    Builds user preference profiles from their history.
    
    Aggregates user's viewed, booked, and rated tours to create
    a preference vector for personalized recommendations.
    """
    
    # Weights for different interaction types
    INTERACTION_WEIGHTS = {
        'view': 1.0,
        'click': 1.5,
        'bookmark': 3.0,
        'share': 2.5,
        'book': 5.0,
        'complete': 6.0,
        'rate': 4.0,
    }
    
    # Time decay factor (more recent interactions have higher weight)
    TIME_DECAY_HALF_LIFE_DAYS = 30
    
    def __init__(self, feature_extractor=None):
        """
        Initialize the profile builder.
        
        Args:
            feature_extractor: TourFeatureExtractor instance (optional)
        """
        self.feature_extractor = feature_extractor
        
    def build_profile_from_history(
        self,
        viewed_tours: List[Dict[str, Any]],
        booked_tours: List[Dict[str, Any]] = None,
        rated_tours: List[Dict[str, Any]] = None,
        interactions: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Build user preference profile from their tour history.
        
        Args:
            viewed_tours: List of tours user has viewed with timestamps
            booked_tours: List of tours user has booked
            rated_tours: List of tours user has rated (with ratings)
            interactions: List of all interactions with metadata
            
        Returns:
            Dict containing preference profile
        """
        booked_tours = booked_tours or []
        rated_tours = rated_tours or []
        interactions = interactions or []
        
        # Initialize preference accumulators
        tag_weights = {}
        province_weights = {}
        transportation_weights = {}
        total_price = 0
        price_count = 0
        total_duration = 0
        duration_count = 0
        
        # Process viewed tours
        for view in viewed_tours:
            tour = view.get('tour', view)
            weight = self._get_interaction_weight('view', view)
            self._accumulate_preferences(
                tour, weight,
                tag_weights, province_weights, transportation_weights
            )
            
            if tour.get('price'):
                total_price += tour['price'] * weight
                price_count += weight
            if tour.get('duration'):
                total_duration += tour['duration'] * weight
                duration_count += weight
        
        # Process booked tours (higher weight)
        for booking in booked_tours:
            tour = booking.get('tour', booking)
            weight = self._get_interaction_weight('book', booking)
            self._accumulate_preferences(
                tour, weight,
                tag_weights, province_weights, transportation_weights
            )
            
            if tour.get('price'):
                total_price += tour['price'] * weight
                price_count += weight
            if tour.get('duration'):
                total_duration += tour['duration'] * weight
                duration_count += weight
        
        # Process rated tours (weight based on rating)
        for rating_data in rated_tours:
            tour = rating_data.get('tour', rating_data)
            rating = rating_data.get('rating', 3)
            # Higher ratings = stronger preference signal
            base_weight = self._get_interaction_weight('rate', rating_data)
            weight = base_weight * (rating / 3.0)  # Normalize around 3
            
            self._accumulate_preferences(
                tour, weight,
                tag_weights, province_weights, transportation_weights
            )
        
        # Process other interactions
        for interaction in interactions:
            tour = interaction.get('tour', {})
            interaction_type = interaction.get('interaction_type', 'view')
            weight = self._get_interaction_weight(interaction_type, interaction)
            
            self._accumulate_preferences(
                tour, weight,
                tag_weights, province_weights, transportation_weights
            )
        
        # Normalize weights
        total_tag_weight = sum(tag_weights.values()) or 1
        total_province_weight = sum(province_weights.values()) or 1
        total_transport_weight = sum(transportation_weights.values()) or 1
        
        normalized_tags = [
            {'tag': tag, 'weight': w / total_tag_weight}
            for tag, w in sorted(tag_weights.items(), key=lambda x: -x[1])
        ]
        
        normalized_provinces = [
            {'province': prov, 'weight': w / total_province_weight}
            for prov, w in sorted(province_weights.items(), key=lambda x: -x[1])
        ]
        
        normalized_transport = [
            {'type': t, 'weight': w / total_transport_weight}
            for t, w in sorted(transportation_weights.items(), key=lambda x: -x[1])
        ]
        
        # Calculate average preferences
        avg_price = int(total_price / price_count) if price_count > 0 else None
        avg_duration = int(total_duration / duration_count) if duration_count > 0 else None
        
        # Build price range (±30% of average)
        price_range = None
        if avg_price:
            price_range = {
                'min': int(avg_price * 0.7),
                'max': int(avg_price * 1.3),
            }
        
        # Build duration range (±2 hours of average)
        duration_range = None
        if avg_duration:
            duration_range = {
                'min': max(1, avg_duration - 2),
                'max': avg_duration + 2,
            }
        
        return {
            'preferred_tags': normalized_tags[:10],  # Top 10 tags
            'preferred_provinces': normalized_provinces[:5],  # Top 5 provinces
            'preferred_transportation': normalized_transport,
            'price_range': price_range,
            'duration_range': duration_range,
            'interaction_count': len(viewed_tours) + len(booked_tours) + len(rated_tours),
        }
    
    def _accumulate_preferences(
        self,
        tour: Dict[str, Any],
        weight: float,
        tag_weights: Dict[str, float],
        province_weights: Dict[str, float],
        transportation_weights: Dict[str, float],
    ):
        """Accumulate weighted preferences from a tour."""
        # Tags
        tags = tour.get('tags', [])
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except:
                tags = []
        
        for tag in tags:
            tag_weights[tag] = tag_weights.get(tag, 0) + weight
        
        # Provinces from places
        places = tour.get('places', [])
        for place in places:
            if isinstance(place, dict):
                province = place.get('province_en') or place.get('province', '')
                if province:
                    province_weights[province] = province_weights.get(province, 0) + weight
        
        # Transportation
        transport = tour.get('transportation', '')
        if transport:
            transportation_weights[transport] = transportation_weights.get(transport, 0) + weight
    
    def _get_interaction_weight(
        self,
        interaction_type: str,
        interaction_data: Dict[str, Any]
    ) -> float:
        """
        Calculate weight for an interaction considering type and recency.
        """
        base_weight = self.INTERACTION_WEIGHTS.get(interaction_type, 1.0)
        
        # Apply time decay
        timestamp = interaction_data.get('last_viewed_at') or \
                   interaction_data.get('created_at') or \
                   interaction_data.get('timestamp')
        
        if timestamp:
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                except:
                    timestamp = None
            
            if timestamp:
                # Make timestamp timezone-aware if it isn't
                if timestamp.tzinfo is None:
                    timestamp = timezone.make_aware(timestamp)
                
                now = timezone.now()
                days_ago = (now - timestamp).days
                decay = 0.5 ** (days_ago / self.TIME_DECAY_HALF_LIFE_DAYS)
                base_weight *= decay
        
        # Apply view count multiplier if available
        view_count = interaction_data.get('view_count', 1)
        if view_count > 1:
            # Diminishing returns for multiple views
            base_weight *= (1 + np.log(view_count))
        
        return base_weight
    
    def build_feature_vector(
        self,
        user_profile: Dict[str, Any],
        all_tours: List[Dict[str, Any]],
    ) -> np.ndarray:
        """
        Build a feature vector for the user based on their profile.
        
        This creates a "pseudo-tour" that represents user preferences,
        which can be used for similarity matching with actual tours.
        
        Args:
            user_profile: User preference profile from build_profile_from_history
            all_tours: All available tours (for feature extractor fitting)
            
        Returns:
            numpy array representing user preferences in tour feature space
        """
        if self.feature_extractor is None:
            from .feature_extractor import TourFeatureExtractor
            self.feature_extractor = TourFeatureExtractor()
        
        # Ensure feature extractor is fitted
        if not self.feature_extractor.is_fitted:
            self.feature_extractor.fit(all_tours)
        
        # Create a pseudo-tour representing user preferences
        preferred_tags = [
            item['tag'] for item in user_profile.get('preferred_tags', [])
            if item.get('weight', 0) > 0.1  # Only include significant preferences
        ]
        
        # Get most preferred province
        provinces = user_profile.get('preferred_provinces', [])
        preferred_province = provinces[0]['province'] if provinces else ''
        
        # Get most preferred transportation
        transport_prefs = user_profile.get('preferred_transportation', [])
        preferred_transport = transport_prefs[0]['type'] if transport_prefs else 'public'
        
        # Price and duration from profile
        price_range = user_profile.get('price_range', {})
        avg_price = (price_range.get('min', 0) + price_range.get('max', 0)) / 2 if price_range else 0
        
        duration_range = user_profile.get('duration_range', {})
        avg_duration = (duration_range.get('min', 0) + duration_range.get('max', 0)) / 2 if duration_range else 0
        
        # Create pseudo-tour
        pseudo_tour = {
            'id': -1,
            'tags': preferred_tags,
            'transportation': preferred_transport,
            'meeting_location': 'yours',  # neutral choice
            'price': int(avg_price) if avg_price else 500000,  # default
            'duration': int(avg_duration) if avg_duration else 4,  # default
            'rating_total': 0,
            'rating_count': 0,
            'min_people': 1,
            'max_people': 10,
            'description': ' '.join(preferred_tags),  # Use tags as description
            'places': [{'province_en': preferred_province}] if preferred_province else [],
        }
        
        # Extract features
        feature_vector = self.feature_extractor.transform([pseudo_tour])
        
        return feature_vector[0] if len(feature_vector) > 0 else np.array([])
    
    def update_user_preferences_model(
        self,
        user,
        viewed_tours: List[Dict[str, Any]],
        booked_tours: List[Dict[str, Any]] = None,
        rated_tours: List[Dict[str, Any]] = None,
    ):
        """
        Update UserPreference model in database.
        
        Args:
            user: User model instance
            viewed_tours: User's viewed tours
            booked_tours: User's booked tours
            rated_tours: User's rated tours
        """
        from Recommendation.models import UserPreference
        
        # Build profile
        profile = self.build_profile_from_history(
            viewed_tours,
            booked_tours or [],
            rated_tours or [],
        )
        
        # Update or create preference record
        preference, created = UserPreference.objects.update_or_create(
            user=user,
            defaults={
                'preferred_tags': profile.get('preferred_tags', []),
                'preferred_price_min': profile.get('price_range', {}).get('min'),
                'preferred_price_max': profile.get('price_range', {}).get('max'),
                'preferred_duration_min': profile.get('duration_range', {}).get('min'),
                'preferred_duration_max': profile.get('duration_range', {}).get('max'),
                'preferred_provinces': profile.get('preferred_provinces', []),
                'preferred_transportation': profile.get('preferred_transportation', []),
            }
        )
        
        return preference


def get_user_interaction_history(user_id: int) -> Dict[str, List[Dict[str, Any]]]:
    """
    Fetch user's interaction history from database.
    
    Args:
        user_id: User ID
        
    Returns:
        Dict with 'viewed', 'booked', 'rated' tour lists
    """
    from Recommendation.models import TourViewHistory, TourInteraction
    from Management.models import Booking, BookingStatus, PastTour
    from Tour.models import TourRating
    
    # Get viewed tours
    views = TourViewHistory.objects.filter(
        user_id=user_id
    ).select_related('tour').order_by('-last_viewed_at')[:100]
    
    viewed_tours = []
    for view in views:
        tour_data = _tour_to_dict(view.tour)
        tour_data['view_count'] = view.view_count
        tour_data['last_viewed_at'] = view.last_viewed_at.isoformat()
        viewed_tours.append({'tour': tour_data, **tour_data})
    
    # Get booked tours (completed)
    past_tours = PastTour.objects.filter(
        tourist__user_id=user_id
    ).select_related('tour').order_by('-tour_date')[:50]
    
    booked_tours = []
    for pt in past_tours:
        if pt.tour:
            tour_data = _tour_to_dict(pt.tour)
            tour_data['created_at'] = pt.completed_at.isoformat()
            booked_tours.append({'tour': tour_data, **tour_data})
    
    # Get rated tours
    ratings = TourRating.objects.filter(
        tourist__user_id=user_id
    ).select_related('tour').order_by('-created_at')[:50]
    
    rated_tours = []
    for rating in ratings:
        tour_data = _tour_to_dict(rating.tour)
        tour_data['rating'] = rating.rating
        tour_data['created_at'] = rating.created_at.isoformat()
        rated_tours.append({'tour': tour_data, 'rating': rating.rating, **tour_data})
    
    return {
        'viewed': viewed_tours,
        'booked': booked_tours,
        'rated': rated_tours,
    }


def _tour_to_dict(tour) -> Dict[str, Any]:
    """Convert Tour model to dictionary."""
    places = []
    for tp in tour.tour_places.select_related('place').all():
        place = tp.place
        places.append({
            'id': place.id,
            'name': place.name,
            'name_en': place.name_en,
            'province': place.province,
            'province_en': place.province_en,
            'city': place.city,
            'lat': place.lat,
            'lon': place.lon,
        })
    
    return {
        'id': tour.id,
        'name': tour.name,
        'duration': tour.duration,
        'price': tour.price,
        'min_people': tour.min_people,
        'max_people': tour.max_people,
        'transportation': tour.transportation,
        'meeting_location': tour.meeting_location,
        'tags': tour.tags if isinstance(tour.tags, list) else [],
        'description': tour.description,
        'rating_total': tour.rating_total,
        'rating_count': tour.rating_count,
        'places': places,
    }

