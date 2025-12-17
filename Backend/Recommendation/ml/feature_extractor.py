"""
Feature extraction module for tour recommendation system.
Extracts and transforms tour features for ML-based recommendations.
"""

import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import json


class TourFeatureExtractor:
    """
    Extract and transform features from tours for content-based filtering.
    
    Features extracted:
    - Categorical: tags, transportation, meeting_location, province
    - Numerical: price, duration, rating, min_people, max_people
    - Text: description (TF-IDF)
    """
    
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.numerical_scaler = StandardScaler()
        self.is_fitted = False
        
        # Store all unique values for categorical encoding
        self.all_tags = set()
        self.transportation_types = ['public', 'private', 'walk']
        self.meeting_locations = ['mine', 'yours', 'first']
        self.all_provinces = set()
        
    def fit(self, tours: List[Dict[str, Any]]) -> 'TourFeatureExtractor':
        """
        Fit the feature extractor on a list of tours.
        
        Args:
            tours: List of tour dictionaries with keys:
                - tags: List[str]
                - transportation: str
                - meeting_location: str
                - price: int
                - duration: int
                - rating_total: int
                - rating_count: int
                - min_people: int
                - max_people: int
                - description: str
                - places: List with province info
        """
        if not tours:
            return self
            
        # Collect all unique tags and provinces
        for tour in tours:
            tags = tour.get('tags', [])
            if isinstance(tags, str):
                try:
                    tags = json.loads(tags)
                except:
                    tags = []
            self.all_tags.update(tags)
            
            # Get provinces from places
            places = tour.get('places', [])
            for place in places:
                if isinstance(place, dict):
                    province = place.get('province_en') or place.get('province', '')
                    if province:
                        self.all_provinces.add(province)
        
        # Fit TF-IDF on descriptions
        descriptions = [tour.get('description', '') or '' for tour in tours]
        if any(descriptions):
            self.tfidf_vectorizer.fit(descriptions)
        
        # Fit numerical scaler
        numerical_features = self._extract_numerical_features(tours)
        if len(numerical_features) > 0:
            self.numerical_scaler.fit(numerical_features)
        
        self.is_fitted = True
        return self
    
    def _extract_numerical_features(self, tours: List[Dict[str, Any]]) -> np.ndarray:
        """Extract numerical features from tours."""
        features = []
        for tour in tours:
            rating_count = tour.get('rating_count', 0)
            rating_total = tour.get('rating_total', 0)
            avg_rating = rating_total / rating_count if rating_count > 0 else 0
            
            feature_row = [
                float(tour.get('price', 0)),
                float(tour.get('duration', 0)),
                float(avg_rating),
                float(tour.get('min_people', 1)),
                float(tour.get('max_people', 10)),
                float(rating_count),
            ]
            features.append(feature_row)
        
        return np.array(features) if features else np.array([])
    
    def _extract_tag_features(self, tour: Dict[str, Any]) -> np.ndarray:
        """Extract binary tag features (multi-hot encoding)."""
        tags = tour.get('tags', [])
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except:
                tags = []
        
        all_tags_list = sorted(list(self.all_tags))
        tag_vector = np.zeros(len(all_tags_list))
        
        for i, tag in enumerate(all_tags_list):
            if tag in tags:
                tag_vector[i] = 1.0
        
        return tag_vector
    
    def _extract_transportation_features(self, tour: Dict[str, Any]) -> np.ndarray:
        """One-hot encode transportation type."""
        transportation = tour.get('transportation', '')
        vector = np.zeros(len(self.transportation_types))
        
        if transportation in self.transportation_types:
            idx = self.transportation_types.index(transportation)
            vector[idx] = 1.0
        
        return vector
    
    def _extract_meeting_location_features(self, tour: Dict[str, Any]) -> np.ndarray:
        """One-hot encode meeting location."""
        meeting = tour.get('meeting_location', '')
        vector = np.zeros(len(self.meeting_locations))
        
        if meeting in self.meeting_locations:
            idx = self.meeting_locations.index(meeting)
            vector[idx] = 1.0
        
        return vector
    
    def _extract_province_features(self, tour: Dict[str, Any]) -> np.ndarray:
        """Extract province features (multi-hot for tours with multiple places)."""
        all_provinces_list = sorted(list(self.all_provinces))
        province_vector = np.zeros(len(all_provinces_list))
        
        places = tour.get('places', [])
        for place in places:
            if isinstance(place, dict):
                province = place.get('province_en') or place.get('province', '')
                if province in all_provinces_list:
                    idx = all_provinces_list.index(province)
                    province_vector[idx] = 1.0
        
        return province_vector
    
    def transform(self, tours: List[Dict[str, Any]]) -> np.ndarray:
        """
        Transform tours into feature vectors.
        
        Args:
            tours: List of tour dictionaries
            
        Returns:
            numpy array of shape (n_tours, n_features)
        """
        if not self.is_fitted:
            raise ValueError("Feature extractor must be fitted before transform")
        
        if not tours:
            return np.array([])
        
        all_features = []
        
        for tour in tours:
            # Numerical features (scaled)
            numerical = self._extract_numerical_features([tour])
            if len(numerical) > 0:
                numerical_scaled = self.numerical_scaler.transform(numerical)[0]
            else:
                numerical_scaled = np.zeros(6)
            
            # Tag features
            tag_features = self._extract_tag_features(tour)
            
            # Transportation features
            transport_features = self._extract_transportation_features(tour)
            
            # Meeting location features
            meeting_features = self._extract_meeting_location_features(tour)
            
            # Province features
            province_features = self._extract_province_features(tour)
            
            # TF-IDF features for description
            description = tour.get('description', '') or ''
            if description:
                tfidf_features = self.tfidf_vectorizer.transform([description]).toarray()[0]
            else:
                tfidf_features = np.zeros(self.tfidf_vectorizer.max_features or 100)
            
            # Concatenate all features
            feature_vector = np.concatenate([
                numerical_scaled,
                tag_features,
                transport_features,
                meeting_features,
                province_features,
                tfidf_features
            ])
            
            all_features.append(feature_vector)
        
        return np.array(all_features)
    
    def fit_transform(self, tours: List[Dict[str, Any]]) -> np.ndarray:
        """Fit and transform in one step."""
        self.fit(tours)
        return self.transform(tours)
    
    def get_feature_names(self) -> List[str]:
        """Get names of all features for interpretability."""
        names = []
        
        # Numerical feature names
        names.extend([
            'price', 'duration', 'avg_rating', 
            'min_people', 'max_people', 'rating_count'
        ])
        
        # Tag feature names
        names.extend([f'tag_{tag}' for tag in sorted(self.all_tags)])
        
        # Transportation feature names
        names.extend([f'transport_{t}' for t in self.transportation_types])
        
        # Meeting location feature names
        names.extend([f'meeting_{m}' for m in self.meeting_locations])
        
        # Province feature names
        names.extend([f'province_{p}' for p in sorted(self.all_provinces)])
        
        # TF-IDF feature names
        if hasattr(self.tfidf_vectorizer, 'get_feature_names_out'):
            tfidf_names = self.tfidf_vectorizer.get_feature_names_out()
            names.extend([f'tfidf_{name}' for name in tfidf_names])
        
        return names
    
    def extract_tour_summary(self, tour: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract a human-readable summary of tour features.
        Useful for explaining recommendations.
        """
        tags = tour.get('tags', [])
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except:
                tags = []
        
        rating_count = tour.get('rating_count', 0)
        rating_total = tour.get('rating_total', 0)
        avg_rating = rating_total / rating_count if rating_count > 0 else 0
        
        provinces = set()
        places = tour.get('places', [])
        for place in places:
            if isinstance(place, dict):
                province = place.get('province_en') or place.get('province', '')
                if province:
                    provinces.add(province)
        
        return {
            'id': tour.get('id'),
            'name': tour.get('name', ''),
            'price': tour.get('price', 0),
            'duration': tour.get('duration', 0),
            'avg_rating': round(avg_rating, 2),
            'rating_count': rating_count,
            'tags': tags,
            'transportation': tour.get('transportation', ''),
            'provinces': list(provinces),
            'num_places': len(places),
        }


def serialize_feature_extractor(extractor: TourFeatureExtractor) -> Dict[str, Any]:
    """Serialize feature extractor state for storage."""
    return {
        'all_tags': list(extractor.all_tags),
        'all_provinces': list(extractor.all_provinces),
        'transportation_types': extractor.transportation_types,
        'meeting_locations': extractor.meeting_locations,
        'is_fitted': extractor.is_fitted,
        # Note: TF-IDF and scaler states would need pickle for full serialization
    }


def deserialize_feature_extractor(data: Dict[str, Any]) -> TourFeatureExtractor:
    """Deserialize feature extractor from stored state."""
    extractor = TourFeatureExtractor()
    extractor.all_tags = set(data.get('all_tags', []))
    extractor.all_provinces = set(data.get('all_provinces', []))
    extractor.is_fitted = data.get('is_fitted', False)
    return extractor

