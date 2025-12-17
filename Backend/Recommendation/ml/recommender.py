"""
Content-based recommendation engine using scikit-learn.
Uses cosine similarity to find similar tours based on feature vectors.
"""

import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sklearn.metrics.pairwise import cosine_similarity
from .feature_extractor import TourFeatureExtractor
import json


class ContentBasedRecommender:
    """
    Content-based filtering recommender for tours.
    
    Uses tour features (tags, price, duration, description, etc.)
    to compute similarity scores and recommend tours.
    """
    
    def __init__(self):
        self.feature_extractor = TourFeatureExtractor()
        self.tour_features: Optional[np.ndarray] = None
        self.tour_ids: List[int] = []
        self.tour_data: List[Dict[str, Any]] = []
        self.is_fitted = False
        
    def fit(self, tours: List[Dict[str, Any]]) -> 'ContentBasedRecommender':
        """
        Fit the recommender on available tours.
        
        Args:
            tours: List of tour dictionaries from database
        """
        if not tours:
            return self
        
        self.tour_data = tours
        self.tour_ids = [tour.get('id') for tour in tours]
        
        # Extract and store features
        self.tour_features = self.feature_extractor.fit_transform(tours)
        self.is_fitted = True
        
        return self
    
    def get_similar_tours(
        self, 
        tour_id: int, 
        top_k: int = 10,
        exclude_ids: Optional[List[int]] = None
    ) -> List[Tuple[int, float, Dict[str, Any]]]:
        """
        Get tours similar to a given tour.
        
        Args:
            tour_id: ID of the reference tour
            top_k: Number of similar tours to return
            exclude_ids: Tour IDs to exclude from results
            
        Returns:
            List of tuples (tour_id, similarity_score, tour_data)
        """
        if not self.is_fitted:
            raise ValueError("Recommender must be fitted before getting recommendations")
        
        if tour_id not in self.tour_ids:
            return []
        
        exclude_ids = exclude_ids or []
        tour_idx = self.tour_ids.index(tour_id)
        
        # Compute similarities
        tour_vector = self.tour_features[tour_idx].reshape(1, -1)
        similarities = cosine_similarity(tour_vector, self.tour_features)[0]
        
        # Get top similar tours (excluding self and excluded IDs)
        results = []
        sorted_indices = np.argsort(similarities)[::-1]
        
        for idx in sorted_indices:
            if len(results) >= top_k:
                break
            
            tid = self.tour_ids[idx]
            if tid == tour_id or tid in exclude_ids:
                continue
                
            results.append((
                tid,
                float(similarities[idx]),
                self.tour_data[idx]
            ))
        
        return results
    
    def recommend_for_user_profile(
        self,
        user_profile_vector: np.ndarray,
        top_k: int = 10,
        exclude_ids: Optional[List[int]] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[int, float, Dict[str, Any]]]:
        """
        Recommend tours based on user's preference profile vector.
        
        Args:
            user_profile_vector: User preference vector (same dimensions as tour features)
            top_k: Number of recommendations
            exclude_ids: Tour IDs to exclude
            filters: Additional filters (province, price_range, etc.)
            
        Returns:
            List of tuples (tour_id, score, tour_data)
        """
        if not self.is_fitted:
            raise ValueError("Recommender must be fitted before getting recommendations")
        
        exclude_ids = exclude_ids or []
        
        # Compute similarity between user profile and all tours
        user_vector = user_profile_vector.reshape(1, -1)
        similarities = cosine_similarity(user_vector, self.tour_features)[0]
        
        # Apply filters and get results
        results = []
        sorted_indices = np.argsort(similarities)[::-1]
        
        for idx in sorted_indices:
            if len(results) >= top_k:
                break
            
            tour = self.tour_data[idx]
            tid = self.tour_ids[idx]
            
            if tid in exclude_ids:
                continue
            
            # Apply filters
            if filters:
                if not self._matches_filters(tour, filters):
                    continue
            
            results.append((
                tid,
                float(similarities[idx]),
                tour
            ))
        
        return results
    
    def recommend_by_criteria(
        self,
        province: Optional[str] = None,
        tags: Optional[List[str]] = None,
        price_min: Optional[int] = None,
        price_max: Optional[int] = None,
        duration_min: Optional[int] = None,
        duration_max: Optional[int] = None,
        min_rating: Optional[float] = None,
        top_k: int = 20,
        exclude_ids: Optional[List[int]] = None,
        user_profile_vector: Optional[np.ndarray] = None,
    ) -> List[Tuple[int, float, Dict[str, Any]]]:
        """
        Recommend tours based on search criteria with optional personalization.
        
        Args:
            province: Filter by province
            tags: Preferred tags
            price_min/max: Price range
            duration_min/max: Duration range
            min_rating: Minimum average rating
            top_k: Number of results
            exclude_ids: IDs to exclude
            user_profile_vector: Optional user profile for personalization
            
        Returns:
            List of tuples (tour_id, score, tour_data)
        """
        if not self.is_fitted:
            raise ValueError("Recommender must be fitted before getting recommendations")
        
        exclude_ids = exclude_ids or []
        
        # Build filters dict
        filters = {
            'province': province,
            'tags': tags,
            'price_min': price_min,
            'price_max': price_max,
            'duration_min': duration_min,
            'duration_max': duration_max,
            'min_rating': min_rating,
        }
        
        # Filter tours first
        filtered_tours = []
        filtered_indices = []
        
        for idx, tour in enumerate(self.tour_data):
            tid = self.tour_ids[idx]
            if tid in exclude_ids:
                continue
            
            if self._matches_filters(tour, filters):
                filtered_tours.append(tour)
                filtered_indices.append(idx)
        
        if not filtered_tours:
            return []
        
        # Score filtered tours
        scores = []
        for idx in filtered_indices:
            tour = self.tour_data[idx]
            score = self._calculate_tour_score(tour, tags, user_profile_vector, idx)
            scores.append(score)
        
        # Sort by score
        sorted_pairs = sorted(
            zip(filtered_indices, scores),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Return top_k results
        results = []
        for idx, score in sorted_pairs[:top_k]:
            results.append((
                self.tour_ids[idx],
                score,
                self.tour_data[idx]
            ))
        
        return results
    
    def _matches_filters(self, tour: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Check if a tour matches the given filters."""
        # Province filter
        province = filters.get('province')
        if province:
            tour_provinces = self._get_tour_provinces(tour)
            if province.lower() not in [p.lower() for p in tour_provinces]:
                return False
        
        # Tags filter (at least one tag matches)
        tags = filters.get('tags')
        if tags:
            tour_tags = tour.get('tags', [])
            if isinstance(tour_tags, str):
                try:
                    tour_tags = json.loads(tour_tags)
                except:
                    tour_tags = []
            
            if not any(tag.lower() in [t.lower() for t in tour_tags] for tag in tags):
                return False
        
        # Price range filter
        price = tour.get('price', 0)
        if filters.get('price_min') and price < filters['price_min']:
            return False
        if filters.get('price_max') and price > filters['price_max']:
            return False
        
        # Duration range filter
        duration = tour.get('duration', 0)
        if filters.get('duration_min') and duration < filters['duration_min']:
            return False
        if filters.get('duration_max') and duration > filters['duration_max']:
            return False
        
        # Rating filter
        if filters.get('min_rating'):
            rating_count = tour.get('rating_count', 0)
            rating_total = tour.get('rating_total', 0)
            avg_rating = rating_total / rating_count if rating_count > 0 else 0
            if avg_rating < filters['min_rating']:
                return False
        
        return True
    
    def _get_tour_provinces(self, tour: Dict[str, Any]) -> List[str]:
        """Extract provinces from tour's places."""
        provinces = []
        places = tour.get('places', [])
        for place in places:
            if isinstance(place, dict):
                province = place.get('province_en') or place.get('province', '')
                if province:
                    provinces.append(province)
        return provinces
    
    def _calculate_tour_score(
        self,
        tour: Dict[str, Any],
        preferred_tags: Optional[List[str]] = None,
        user_profile_vector: Optional[np.ndarray] = None,
        tour_idx: Optional[int] = None
    ) -> float:
        """
        Calculate composite score for a tour.
        
        Combines:
        - Rating score (normalized)
        - Tag match score
        - User profile similarity (if provided)
        - Popularity score (view/booking count)
        """
        score = 0.0
        
        # Rating score (0-1, weighted by count)
        rating_count = tour.get('rating_count', 0)
        rating_total = tour.get('rating_total', 0)
        if rating_count > 0:
            avg_rating = rating_total / rating_count
            # Bayesian average to account for low review counts
            # Use global average of 3.5 and minimum of 5 reviews
            global_avg = 3.5
            min_reviews = 5
            bayesian_rating = (
                (rating_count * avg_rating + min_reviews * global_avg) /
                (rating_count + min_reviews)
            )
            score += (bayesian_rating / 5.0) * 0.3  # 30% weight
        
        # Tag match score
        if preferred_tags:
            tour_tags = tour.get('tags', [])
            if isinstance(tour_tags, str):
                try:
                    tour_tags = json.loads(tour_tags)
                except:
                    tour_tags = []
            
            if tour_tags:
                matches = sum(
                    1 for tag in preferred_tags 
                    if tag.lower() in [t.lower() for t in tour_tags]
                )
                tag_score = matches / len(preferred_tags)
                score += tag_score * 0.25  # 25% weight
        
        # User profile similarity
        if user_profile_vector is not None and tour_idx is not None:
            tour_vector = self.tour_features[tour_idx].reshape(1, -1)
            user_vector = user_profile_vector.reshape(1, -1)
            similarity = cosine_similarity(user_vector, tour_vector)[0][0]
            score += similarity * 0.35  # 35% weight
        
        # Popularity score (could be enhanced with actual view/booking data)
        # For now, use rating_count as proxy
        popularity = min(rating_count / 100, 1.0)  # Cap at 100 reviews
        score += popularity * 0.1  # 10% weight
        
        return score
    
    def get_tour_features(self, tour_id: int) -> Optional[np.ndarray]:
        """Get the feature vector for a specific tour."""
        if tour_id in self.tour_ids:
            idx = self.tour_ids.index(tour_id)
            return self.tour_features[idx]
        return None
    
    def explain_similarity(
        self,
        tour_id_1: int,
        tour_id_2: int
    ) -> Dict[str, Any]:
        """
        Explain why two tours are similar.
        Useful for debugging and transparency.
        """
        if not self.is_fitted:
            return {}
        
        if tour_id_1 not in self.tour_ids or tour_id_2 not in self.tour_ids:
            return {}
        
        idx1 = self.tour_ids.index(tour_id_1)
        idx2 = self.tour_ids.index(tour_id_2)
        
        tour1 = self.tour_data[idx1]
        tour2 = self.tour_data[idx2]
        
        # Get feature vectors
        vec1 = self.tour_features[idx1]
        vec2 = self.tour_features[idx2]
        
        # Calculate similarity
        similarity = cosine_similarity([vec1], [vec2])[0][0]
        
        # Find common attributes
        tags1 = set(tour1.get('tags', []) if isinstance(tour1.get('tags'), list) else [])
        tags2 = set(tour2.get('tags', []) if isinstance(tour2.get('tags'), list) else [])
        common_tags = tags1 & tags2
        
        provinces1 = set(self._get_tour_provinces(tour1))
        provinces2 = set(self._get_tour_provinces(tour2))
        common_provinces = provinces1 & provinces2
        
        return {
            'similarity_score': float(similarity),
            'common_tags': list(common_tags),
            'common_provinces': list(common_provinces),
            'same_transportation': tour1.get('transportation') == tour2.get('transportation'),
            'price_difference': abs(tour1.get('price', 0) - tour2.get('price', 0)),
            'duration_difference': abs(tour1.get('duration', 0) - tour2.get('duration', 0)),
        }


class HybridRecommender:
    """
    Hybrid recommender combining content-based and collaborative filtering.
    Falls back to content-based when collaborative data is sparse.
    """
    
    def __init__(self):
        self.content_recommender = ContentBasedRecommender()
        self.collaborative_weight = 0.4  # Weight for collaborative signal
        self.content_weight = 0.6  # Weight for content-based signal
        
    def fit(self, tours: List[Dict[str, Any]], interactions: Optional[List[Dict]] = None):
        """
        Fit both content and collaborative components.
        
        Args:
            tours: List of tour data
            interactions: User-tour interaction data for collaborative filtering
        """
        self.content_recommender.fit(tours)
        
        # Collaborative filtering would be implemented here
        # For MVP, we primarily use content-based
        
        return self
    
    def recommend(
        self,
        user_id: Optional[int] = None,
        user_profile_vector: Optional[np.ndarray] = None,
        **kwargs
    ) -> List[Tuple[int, float, Dict[str, Any]]]:
        """
        Get hybrid recommendations.
        
        Uses collaborative filtering when user_id is provided and has history,
        otherwise falls back to content-based recommendations.
        """
        # For MVP, use content-based recommendations
        return self.content_recommender.recommend_by_criteria(
            user_profile_vector=user_profile_vector,
            **kwargs
        )

