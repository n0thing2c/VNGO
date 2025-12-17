"""
Trip Planner Service - Core algorithm for generating multi-day trip plans.
Combines recommendation system with scheduling optimization.
"""

import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import time, datetime, timedelta
from django.db.models import Q, Avg, Count
import json


class TripPlannerService:
    """
    Service for generating optimized trip plans.
    
    Features:
    - Location-based tour filtering
    - Budget-aware scheduling
    - Duration constraints per day
    - Variety optimization (different tags/experiences)
    - Personalized recommendations
    """
    
    # Default constraints
    DEFAULT_MAX_HOURS_PER_DAY = 10
    DEFAULT_MIN_HOURS_PER_DAY = 4
    DEFAULT_START_TIME = time(8, 0)  # 8 AM
    DEFAULT_END_TIME = time(20, 0)   # 8 PM
    DEFAULT_BREAK_DURATION = 1  # 1 hour break between tours
    
    def __init__(self, recommender=None):
        """
        Initialize trip planner.
        
        Args:
            recommender: ContentBasedRecommender instance (optional)
        """
        self.recommender = recommender
        
    def generate_trip_plan(
        self,
        province: str,
        num_days: int,
        budget: int,
        num_people: int = 1,
        place_ids: Optional[List[int]] = None,
        preferred_tags: Optional[List[str]] = None,
        user_id: Optional[int] = None,
        max_hours_per_day: int = None,
        start_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Generate an optimized trip plan.
        
        Args:
            province: Target province/city
            num_days: Number of days for the trip
            budget: Total budget in VND
            num_people: Number of travelers
            place_ids: Specific place IDs to include (optional)
            preferred_tags: Preferred tour tags (optional)
            user_id: User ID for personalization (optional)
            max_hours_per_day: Maximum tour hours per day
            start_date: Starting date of the trip
            
        Returns:
            Dict containing the trip plan with tours organized by day
        """
        max_hours_per_day = max_hours_per_day or self.DEFAULT_MAX_HOURS_PER_DAY
        
        # Fetch available tours
        tours = self._fetch_available_tours(province, place_ids)
        
        if not tours:
            return {
                'success': False,
                'error': 'No tours available in this location',
                'days': [],
                'total_cost': 0,
                'total_duration': 0,
            }
        
        # Get user profile for personalization
        user_profile_vector = None
        if user_id:
            user_profile_vector = self._get_user_profile_vector(user_id, tours)
        
        # Score and rank tours
        scored_tours = self._score_tours(
            tours,
            budget,
            num_days,
            num_people,
            preferred_tags,
            user_profile_vector,
        )
        
        # Generate daily schedules using greedy algorithm
        daily_plans = self._schedule_tours(
            scored_tours,
            num_days,
            budget,
            num_people,
            max_hours_per_day,
        )
        
        # Calculate totals
        total_cost = sum(
            tour['price'] * num_people
            for day in daily_plans
            for tour in day['tours']
        )
        total_duration = sum(
            tour['duration']
            for day in daily_plans
            for tour in day['tours']
        )
        
        # Add dates if start_date provided
        if start_date:
            for i, day in enumerate(daily_plans):
                day['date'] = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        
        return {
            'success': True,
            'province': province,
            'num_days': num_days,
            'budget': budget,
            'num_people': num_people,
            'days': daily_plans,
            'total_cost': total_cost,
            'total_duration': total_duration,
            'budget_remaining': budget - total_cost,
            'tours_included': sum(len(day['tours']) for day in daily_plans),
        }
    
    def _fetch_available_tours(
        self,
        province: str,
        place_ids: Optional[List[int]] = None
    ) -> List[Dict[str, Any]]:
        """Fetch tours from database that match location criteria."""
        from Tour.models import Tour, Place
        
        # Build query
        query = Q()
        
        # Filter by province
        if province:
            # Get places in the province
            province_places = Place.objects.filter(
                Q(province__icontains=province) |
                Q(province_en__icontains=province) |
                Q(city__icontains=province) |
                Q(city_en__icontains=province)
            ).values_list('id', flat=True)
            
            query &= Q(places__id__in=list(province_places))
        
        # Filter by specific places if provided
        if place_ids:
            query &= Q(places__id__in=place_ids)
        
        # Fetch tours with related data
        tours = Tour.objects.filter(query).distinct().prefetch_related(
            'tour_places__place',
            'guide',
            'tour_images',
        ).annotate(
            avg_rating=Avg('ratings__rating'),
            review_count=Count('ratings'),
        )
        
        # Convert to list of dicts
        tour_list = []
        for tour in tours:
            places = []
            for tp in tour.tour_places.all():
                place = tp.place
                places.append({
                    'id': place.id,
                    'name': place.name,
                    'name_en': place.name_en,
                    'province': place.province,
                    'province_en': place.province_en,
                    'city': place.city,
                    'city_en': place.city_en,
                    'lat': place.lat,
                    'lon': place.lon,
                })
            
            # Get thumbnail
            thumbnail = None
            for img in tour.tour_images.all():
                if img.isthumbnail and img.image:
                    thumbnail = img.image.url
                    break
            
            if not thumbnail:
                first_img = tour.tour_images.first()
                if first_img and first_img.image:
                    thumbnail = first_img.image.url
            
            tour_list.append({
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
                'avg_rating': float(tour.avg_rating or 0),
                'review_count': tour.review_count or 0,
                'places': places,
                'thumbnail': thumbnail,
                'guide_id': tour.guide_id,
                'guide_name': tour.guide.name if tour.guide else None,
            })
        
        return tour_list
    
    def _get_user_profile_vector(
        self,
        user_id: int,
        tours: List[Dict[str, Any]]
    ) -> Optional[np.ndarray]:
        """Get user's preference vector for personalization."""
        try:
            from Recommendation.ml.user_profile import UserProfileBuilder, get_user_interaction_history
            from Recommendation.ml.feature_extractor import TourFeatureExtractor
            
            # Get user history
            history = get_user_interaction_history(user_id)
            
            if not history['viewed'] and not history['booked']:
                return None
            
            # Build profile
            feature_extractor = TourFeatureExtractor()
            feature_extractor.fit(tours)
            
            profile_builder = UserProfileBuilder(feature_extractor)
            profile = profile_builder.build_profile_from_history(
                history['viewed'],
                history['booked'],
                history['rated'],
            )
            
            # Build feature vector
            return profile_builder.build_feature_vector(profile, tours)
            
        except Exception as e:
            print(f"Error building user profile: {e}")
            return None
    
    def _score_tours(
        self,
        tours: List[Dict[str, Any]],
        budget: int,
        num_days: int,
        num_people: int,
        preferred_tags: Optional[List[str]],
        user_profile_vector: Optional[np.ndarray],
    ) -> List[Dict[str, Any]]:
        """
        Score and rank tours based on multiple factors.
        """
        budget_per_day = budget / num_days
        budget_per_person_per_day = budget_per_day / num_people
        
        scored_tours = []
        
        for tour in tours:
            score = 0.0
            reasons = []
            
            # 1. Rating score (0-30 points)
            avg_rating = tour.get('avg_rating', 0)
            rating_count = tour.get('rating_count', 0)
            if rating_count > 0:
                # Bayesian average
                global_avg = 3.5
                min_reviews = 5
                bayesian = (rating_count * avg_rating + min_reviews * global_avg) / (rating_count + min_reviews)
                rating_score = (bayesian / 5.0) * 30
                score += rating_score
                if bayesian >= 4.0:
                    reasons.append(f"Highly rated ({bayesian:.1f}★)")
            
            # 2. Price fit score (0-25 points)
            price = tour.get('price', 0)
            if price > 0 and price <= budget_per_person_per_day:
                # Tours within budget get higher scores
                price_ratio = price / budget_per_person_per_day
                if price_ratio <= 0.5:
                    price_score = 25  # Great value
                    reasons.append("Great value for budget")
                elif price_ratio <= 0.8:
                    price_score = 20
                else:
                    price_score = 15
                score += price_score
            elif price > budget_per_person_per_day:
                # Penalize expensive tours but don't exclude
                price_score = max(0, 15 - (price / budget_per_person_per_day - 1) * 10)
                score += price_score
            
            # 3. Tag match score (0-20 points)
            if preferred_tags:
                tour_tags = tour.get('tags', [])
                matches = sum(1 for tag in preferred_tags if tag.lower() in [t.lower() for t in tour_tags])
                if matches > 0:
                    tag_score = (matches / len(preferred_tags)) * 20
                    score += tag_score
                    matched_tags = [tag for tag in preferred_tags if tag.lower() in [t.lower() for t in tour_tags]]
                    reasons.append(f"Matches: {', '.join(matched_tags[:2])}")
            
            # 4. Duration fit score (0-15 points)
            duration = tour.get('duration', 0)
            # Prefer tours between 2-4 hours (ideal for day trips)
            if 2 <= duration <= 4:
                duration_score = 15
            elif duration < 2:
                duration_score = 10
            elif duration <= 6:
                duration_score = 12
            else:
                duration_score = 8
            score += duration_score
            
            # 5. Personalization score (0-10 points)
            if user_profile_vector is not None:
                # This would use cosine similarity with user profile
                # For now, use a simplified approach
                personalization_score = 5  # Base score
                score += personalization_score
            
            # Store score and reasons
            tour_copy = tour.copy()
            tour_copy['recommendation_score'] = round(score, 2)
            tour_copy['recommendation_reasons'] = reasons
            scored_tours.append(tour_copy)
        
        # Sort by score descending
        scored_tours.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        return scored_tours
    
    def _schedule_tours(
        self,
        scored_tours: List[Dict[str, Any]],
        num_days: int,
        budget: int,
        num_people: int,
        max_hours_per_day: int,
    ) -> List[Dict[str, Any]]:
        """
        Schedule tours across days using a greedy algorithm.
        
        Optimizes for:
        - Total score maximization
        - Budget constraints
        - Duration constraints per day
        - Tag variety (different experiences each day)
        """
        daily_plans = []
        used_tour_ids = set()
        remaining_budget = budget
        
        for day_num in range(1, num_days + 1):
            day_plan = {
                'day_number': day_num,
                'tours': [],
                'total_duration': 0,
                'total_cost': 0,
            }
            
            day_hours = 0
            day_cost = 0
            day_tags = set()
            
            # Greedy selection for this day
            available_tours = [
                t for t in scored_tours
                if t['id'] not in used_tour_ids
            ]
            
            # Sort by score but also consider variety
            for tour in available_tours:
                tour_cost = tour['price'] * num_people
                tour_duration = tour['duration']
                tour_tags = set(tour.get('tags', []))
                
                # Check constraints
                if day_hours + tour_duration > max_hours_per_day:
                    continue
                if day_cost + tour_cost > remaining_budget / (num_days - day_num + 1) * 1.2:
                    # Allow 20% over daily budget if total budget allows
                    if day_cost + tour_cost > remaining_budget:
                        continue
                
                # Check group size compatibility
                if num_people < tour.get('min_people', 1):
                    continue
                if num_people > tour.get('max_people', float('inf')):
                    continue
                
                # Variety bonus - prefer tours with new tags
                new_tags = tour_tags - day_tags
                variety_bonus = len(new_tags) * 0.5
                effective_score = tour['recommendation_score'] + variety_bonus
                
                # Add to day plan
                start_time = self._calculate_start_time(day_hours)
                
                day_plan['tours'].append({
                    **tour,
                    'order': len(day_plan['tours']) + 1,
                    'suggested_start_time': start_time.strftime('%H:%M'),
                    'effective_score': round(effective_score, 2),
                })
                
                day_hours += tour_duration + self.DEFAULT_BREAK_DURATION
                day_cost += tour_cost
                day_tags.update(tour_tags)
                used_tour_ids.add(tour['id'])
                
                # Limit tours per day for reasonable schedules
                if len(day_plan['tours']) >= 4:
                    break
            
            day_plan['total_duration'] = day_hours - self.DEFAULT_BREAK_DURATION if day_plan['tours'] else 0
            day_plan['total_cost'] = day_cost
            remaining_budget -= day_cost
            
            daily_plans.append(day_plan)
        
        return daily_plans
    
    def _calculate_start_time(self, hours_elapsed: float) -> time:
        """Calculate suggested start time based on hours elapsed in the day."""
        start_hour = self.DEFAULT_START_TIME.hour
        start_minute = self.DEFAULT_START_TIME.minute
        
        total_minutes = start_hour * 60 + start_minute + int(hours_elapsed * 60)
        
        hour = (total_minutes // 60) % 24
        minute = total_minutes % 60
        
        return time(hour, minute)
    
    def swap_tour(
        self,
        trip_plan: Dict[str, Any],
        day_number: int,
        old_tour_id: int,
        new_tour_id: int,
    ) -> Dict[str, Any]:
        """
        Swap a tour in the plan with another tour.
        
        Args:
            trip_plan: Current trip plan
            day_number: Day number (1-indexed)
            old_tour_id: ID of tour to remove
            new_tour_id: ID of tour to add
            
        Returns:
            Updated trip plan
        """
        # Find the day
        day_idx = day_number - 1
        if day_idx < 0 or day_idx >= len(trip_plan['days']):
            return trip_plan
        
        day = trip_plan['days'][day_idx]
        
        # Find and remove old tour
        old_tour = None
        for i, tour in enumerate(day['tours']):
            if tour['id'] == old_tour_id:
                old_tour = day['tours'].pop(i)
                break
        
        if not old_tour:
            return trip_plan
        
        # Fetch new tour
        new_tours = self._fetch_available_tours(
            trip_plan['province'],
            [new_tour_id]
        )
        
        if new_tours:
            new_tour = new_tours[0]
            new_tour['order'] = old_tour['order']
            new_tour['suggested_start_time'] = old_tour.get('suggested_start_time')
            new_tour['is_user_added'] = True
            day['tours'].insert(old_tour['order'] - 1, new_tour)
        
        # Recalculate totals
        self._recalculate_totals(trip_plan)
        
        return trip_plan
    
    def add_tour(
        self,
        trip_plan: Dict[str, Any],
        day_number: int,
        tour_id: int,
    ) -> Dict[str, Any]:
        """Add a tour to a specific day."""
        day_idx = day_number - 1
        if day_idx < 0 or day_idx >= len(trip_plan['days']):
            return trip_plan
        
        day = trip_plan['days'][day_idx]
        
        # Check if tour already in plan
        all_tour_ids = [
            t['id'] for d in trip_plan['days'] for t in d['tours']
        ]
        if tour_id in all_tour_ids:
            return trip_plan
        
        # Fetch tour
        tours = self._fetch_available_tours(trip_plan['province'], [tour_id])
        if not tours:
            return trip_plan
        
        new_tour = tours[0]
        new_tour['order'] = len(day['tours']) + 1
        new_tour['is_user_added'] = True
        
        # Calculate start time
        current_hours = sum(t['duration'] + 1 for t in day['tours'])
        new_tour['suggested_start_time'] = self._calculate_start_time(current_hours).strftime('%H:%M')
        
        day['tours'].append(new_tour)
        
        self._recalculate_totals(trip_plan)
        
        return trip_plan
    
    def remove_tour(
        self,
        trip_plan: Dict[str, Any],
        day_number: int,
        tour_id: int,
    ) -> Dict[str, Any]:
        """Remove a tour from the plan."""
        day_idx = day_number - 1
        if day_idx < 0 or day_idx >= len(trip_plan['days']):
            return trip_plan
        
        day = trip_plan['days'][day_idx]
        day['tours'] = [t for t in day['tours'] if t['id'] != tour_id]
        
        # Reorder remaining tours
        for i, tour in enumerate(day['tours']):
            tour['order'] = i + 1
        
        self._recalculate_totals(trip_plan)
        
        return trip_plan
    
    def _recalculate_totals(self, trip_plan: Dict[str, Any]):
        """Recalculate all totals in the trip plan."""
        num_people = trip_plan.get('num_people', 1)
        
        total_cost = 0
        total_duration = 0
        
        for day in trip_plan['days']:
            day_cost = sum(t['price'] * num_people for t in day['tours'])
            day_duration = sum(t['duration'] for t in day['tours'])
            
            day['total_cost'] = day_cost
            day['total_duration'] = day_duration
            
            total_cost += day_cost
            total_duration += day_duration
        
        trip_plan['total_cost'] = total_cost
        trip_plan['total_duration'] = total_duration
        trip_plan['budget_remaining'] = trip_plan['budget'] - total_cost
        trip_plan['tours_included'] = sum(len(d['tours']) for d in trip_plan['days'])
    
    def get_alternative_tours(
        self,
        trip_plan: Dict[str, Any],
        day_number: int,
        exclude_ids: Optional[List[int]] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Get alternative tours for a specific day.
        
        Useful for swap suggestions.
        """
        exclude_ids = exclude_ids or []
        
        # Get all tours already in plan
        all_tour_ids = [
            t['id'] for d in trip_plan['days'] for t in d['tours']
        ]
        exclude_ids.extend(all_tour_ids)
        
        # Get day constraints
        day = trip_plan['days'][day_number - 1]
        current_duration = day['total_duration']
        
        # Fetch and score tours
        tours = self._fetch_available_tours(trip_plan['province'])
        
        # Filter out excluded and over-duration tours
        max_additional_hours = self.DEFAULT_MAX_HOURS_PER_DAY - current_duration
        
        alternatives = [
            t for t in tours
            if t['id'] not in exclude_ids and t['duration'] <= max_additional_hours + 2
        ]
        
        # Score remaining tours
        scored = self._score_tours(
            alternatives,
            trip_plan['budget_remaining'],
            1,  # For single day
            trip_plan['num_people'],
            trip_plan.get('preferred_tags'),
            None,
        )
        
        return scored[:limit]

