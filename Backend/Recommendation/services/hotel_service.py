"""
Hotel Integration Service - Fetches hotel suggestions from external APIs.
Supports multiple providers: RapidAPI (Booking.com), Agoda, etc.
"""

import os
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from django.conf import settings

# Load .env file in case it wasn't loaded yet
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)


class HotelService:
    """
    Service for fetching hotel suggestions from external APIs.
    
    Primary: RapidAPI Booking.com API (most data available)
    Fallback: Google Places API or mock data for development
    """
    
    # RapidAPI Booking.com endpoints
    RAPIDAPI_HOST = "booking-com.p.rapidapi.com"
    RAPIDAPI_BASE_URL = f"https://{RAPIDAPI_HOST}"
    
    # Agoda affiliate base URL
    AGODA_AFFILIATE_BASE = "https://www.agoda.com/partners/partnersearch.aspx"
    
    # Booking.com affiliate base URL
    BOOKING_AFFILIATE_BASE = "https://www.booking.com/searchresults.html"
    
    def __init__(self):
        self.rapidapi_key = os.getenv('RAPIDAPI_KEY', '')
        if not self.rapidapi_key:
            print("WARNING: RAPIDAPI_KEY not found. Hotel search will not work.")
        
    async def search_hotels(
        self,
        city_name: str,
        checkin_date: str,
        checkout_date: str,
        adults: int = 2,
        rooms: int = 1,
        price_min: Optional[int] = None,
        price_max: Optional[int] = None,
        currency: str = 'VND',
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Search for hotels in a city using Booking.com API.
        
        Args:
            city_name: City/Province name to search
            checkin_date: Check-in date (YYYY-MM-DD)
            checkout_date: Check-out date (YYYY-MM-DD)
            adults: Number of adults
            rooms: Number of rooms
            price_min: Minimum price per night
            price_max: Maximum price per night
            currency: Currency code
            limit: Max results to return
            
        Returns:
            List of hotel dictionaries
        """
        if not self.rapidapi_key:
            print("No API key configured")
            return []
        
        try:
            return await self._search_rapidapi(
                city_name, checkin_date, checkout_date,
                adults, rooms, price_min, price_max, currency, limit
            )
        except Exception as e:
            print(f"RapidAPI error: {e}")
            return []
    
    async def _search_rapidapi(
        self,
        city_name: str,
        checkin_date: str,
        checkout_date: str,
        adults: int,
        rooms: int,
        price_min: Optional[int],
        price_max: Optional[int],
        currency: str,
        limit: int,
    ) -> List[Dict[str, Any]]:
        """Search hotels using RapidAPI Booking.com API."""
        headers = {
            "X-RapidAPI-Key": self.rapidapi_key,
            "X-RapidAPI-Host": self.RAPIDAPI_HOST,
        }
        
        async with httpx.AsyncClient() as client:
            # First, search for location by city name
            location_resp = await client.get(
                f"{self.RAPIDAPI_BASE_URL}/v1/hotels/locations",
                headers=headers,
                params={"name": city_name, "locale": "en-gb"},
                timeout=10.0,
            )
            
            if location_resp.status_code != 200:
                print(f"Location search failed: {location_resp.status_code}")
                return []
            
            locations = location_resp.json()
            if not locations:
                print(f"No location found for: {city_name}")
                return []
            
            # Get dest_id from first result
            dest_id = locations[0].get('dest_id')
            dest_type = locations[0].get('dest_type', 'city')
            
            print(f"Found location: {locations[0].get('city_name', city_name)}, dest_id: {dest_id}")
            
            # Search hotels
            hotel_params = {
                "dest_id": dest_id,
                "dest_type": dest_type,
                "checkin_date": checkin_date,
                "checkout_date": checkout_date,
                "adults_number": adults,
                "room_number": rooms,
                "order_by": "popularity",
                "locale": "en-gb",
                "currency": currency,
                "units": "metric",
                "filter_by_currency": currency,
                "page_number": 0,
            }
            
            if price_min:
                hotel_params["price_min"] = price_min
            if price_max:
                hotel_params["price_max"] = price_max
            
            hotels_resp = await client.get(
                f"{self.RAPIDAPI_BASE_URL}/v1/hotels/search",
                headers=headers,
                params=hotel_params,
                timeout=15.0,
            )
            
            if hotels_resp.status_code != 200:
                print(f"Hotel search failed: {hotels_resp.status_code}")
                return []
            
            data = hotels_resp.json()
            hotels_raw = data.get('result', [])[:limit]
            
            print(f"Found {len(hotels_raw)} hotels")
            
            # Transform to our format
            hotels = []
            for hotel in hotels_raw:
                hotels.append(self._transform_rapidapi_hotel(hotel, checkin_date, checkout_date))
            
            return hotels
    
    async def search_hotels_by_coordinates(
        self,
        latitude: float,
        longitude: float,
        checkin_date: str,
        checkout_date: str,
        adults: int = 2,
        rooms: int = 1,
        radius_km: float = 5.0,
        price_max: Optional[int] = None,
        currency: str = 'VND',
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Search for hotels near a specific coordinate (centroid of tour places).
        
        Args:
            latitude: Center latitude
            longitude: Center longitude  
            checkin_date: Check-in date (YYYY-MM-DD)
            checkout_date: Check-out date (YYYY-MM-DD)
            adults: Number of adults
            rooms: Number of rooms
            radius_km: Search radius in kilometers
            price_max: Maximum price per night
            currency: Currency code
            limit: Max results to return
            
        Returns:
            List of hotel dictionaries sorted by distance to center
        """
        if not self.rapidapi_key:
            print("No API key configured")
            return []
        
        headers = {
            "X-RapidAPI-Key": self.rapidapi_key,
            "X-RapidAPI-Host": self.RAPIDAPI_HOST,
        }
        
        try:
            async with httpx.AsyncClient() as client:
                # Search hotels by coordinates
                params = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "checkin_date": checkin_date,
                    "checkout_date": checkout_date,
                    "adults_number": adults,
                    "room_number": rooms,
                    "order_by": "distance",  # Sort by distance to center
                    "locale": "en-gb",
                    "currency": currency,
                    "units": "metric",
                    "filter_by_currency": currency,
                    "page_number": 0,
                }
                
                if price_max:
                    params["price_max"] = price_max
                
                print(f"Searching hotels near ({latitude}, {longitude})")
                
                hotels_resp = await client.get(
                    f"{self.RAPIDAPI_BASE_URL}/v1/hotels/search-by-coordinates",
                    headers=headers,
                    params=params,
                    timeout=15.0,
                )
                
                if hotels_resp.status_code != 200:
                    print(f"Coordinate search failed: {hotels_resp.status_code} - {hotels_resp.text[:200]}")
                    return []
                
                data = hotels_resp.json()
                hotels_raw = data.get('result', [])[:limit]
                
                print(f"Found {len(hotels_raw)} hotels near tour locations")
                
                # Transform and calculate distance to centroid
                hotels = []
                for hotel in hotels_raw:
                    hotel_data = self._transform_rapidapi_hotel(hotel, checkin_date, checkout_date)
                    
                    # Calculate actual distance to centroid
                    if hotel_data.get('latitude') and hotel_data.get('longitude'):
                        hotel_data['distance_to_tours'] = self._haversine_distance(
                            latitude, longitude,
                            hotel_data['latitude'], hotel_data['longitude']
                        )
                    else:
                        hotel_data['distance_to_tours'] = hotel_data.get('distance_to_center', 0)
                    
                    hotels.append(hotel_data)
                
                # Sort by distance to tour centroid
                hotels.sort(key=lambda h: h.get('distance_to_tours', 999))
                
                return hotels
                
        except Exception as e:
            print(f"Coordinate search error: {e}")
            return []
    
    def _haversine_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
    ) -> float:
        """Calculate distance between two points in kilometers using Haversine formula."""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Earth radius in kilometers
        r = 6371
        
        return round(c * r, 2)
    
    def _transform_rapidapi_hotel(
        self,
        hotel: Dict[str, Any],
        checkin: str,
        checkout: str,
    ) -> Dict[str, Any]:
        """Transform RapidAPI hotel response to our format."""
        # Use the URL from API and add checkin/checkout params
        base_url = hotel.get('url', '')
        if base_url:
            booking_url = f"{base_url}?checkin={checkin}&checkout={checkout}"
        else:
            booking_url = self._generate_booking_url(hotel.get('hotel_id'), checkin, checkout)
        
        return {
            'external_id': str(hotel.get('hotel_id', '')),
            'name': hotel.get('hotel_name', ''),
            'address': hotel.get('address', ''),
            'latitude': hotel.get('latitude'),
            'longitude': hotel.get('longitude'),
            'price_per_night': int(hotel.get('min_total_price', 0)),
            'currency': hotel.get('currency_code', 'VND'),
            'rating': hotel.get('review_score', 0) / 2 if hotel.get('review_score') else 0,  # Convert 10-scale to 5-scale
            'review_count': hotel.get('review_nr', 0),
            'thumbnail_url': hotel.get('main_photo_url', '').replace('square60', 'square200'),
            'booking_url': booking_url,
            'source': 'booking.com',
            'star_rating': hotel.get('class', 0),
            'district': hotel.get('district', ''),
            'distance_to_center': self._parse_distance(hotel.get('distance_to_cc', 0)),
        }
    
    def _parse_distance(self, distance) -> float:
        """Parse distance value which might be string like '1.5 km' or number."""
        if isinstance(distance, (int, float)):
            return float(distance)
        if isinstance(distance, str):
            # Remove 'km', 'm' and other units
            import re
            match = re.search(r'[\d.]+', distance)
            if match:
                return float(match.group())
        return 0.0
    
    def _generate_booking_url(
        self,
        hotel_id: str,
        checkin: str,
        checkout: str,
    ) -> str:
        """Generate affiliate booking URL."""
        if not hotel_id:
            return ""
        
        # Basic booking.com URL (can be enhanced with affiliate ID)
        params = f"?checkin={checkin}&checkout={checkout}"
        return f"https://www.booking.com/hotel/vn/{hotel_id}.html{params}"
    
    def get_hotels_for_trip(
        self,
        trip_plan: Dict[str, Any],
        accommodation_budget_ratio: float = 0.35,
    ) -> List[Dict[str, Any]]:
        """
        Get hotel suggestions for a trip plan.
        
        Args:
            trip_plan: Trip plan dict with days and tours
            accommodation_budget_ratio: Portion of budget for hotels (default 35%)
            
        Returns:
            List of hotel suggestions
        """
        # Calculate center point from all tour places
        all_coords = []
        for day in trip_plan.get('days', []):
            for tour in day.get('tours', []):
                for place in tour.get('places', []):
                    if place.get('lat') and place.get('lon'):
                        all_coords.append((place['lat'], place['lon']))
        
        if not all_coords:
            # Use default coordinates for the province
            center_lat, center_lon = self._get_province_center(trip_plan.get('province', ''))
        else:
            # Calculate centroid
            center_lat = sum(c[0] for c in all_coords) / len(all_coords)
            center_lon = sum(c[1] for c in all_coords) / len(all_coords)
        
        # Calculate accommodation budget
        total_budget = trip_plan.get('budget', 0)
        num_days = trip_plan.get('num_days', 1)
        accommodation_budget = total_budget * accommodation_budget_ratio
        max_price_per_night = int(accommodation_budget / max(num_days - 1, 1))  # n-1 nights
        
        # Generate dates (7 days from now)
        checkin = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        checkout = (datetime.now() + timedelta(days=7 + num_days)).strftime('%Y-%m-%d')
        
        print(f"Tour centroid: ({center_lat}, {center_lon})")
        
        try:
            # Run async function synchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Search hotels by coordinates (centroid of all tour places)
            hotels = loop.run_until_complete(
                self.search_hotels_by_coordinates(
                    latitude=center_lat,
                    longitude=center_lon,
                    checkin_date=checkin,
                    checkout_date=checkout,
                    adults=trip_plan.get('num_people', 2),
                    price_max=max_price_per_night,
                    limit=15,  # Get more to filter later
                )
            )
            
            # Fallback to city name search if coordinate search fails
            if not hotels:
                province = trip_plan.get('province', 'Ho Chi Minh City')
                print(f"Coordinate search returned no results, trying city: {province}")
                hotels = loop.run_until_complete(
                    self.search_hotels(
                        city_name=province,
                        checkin_date=checkin,
                        checkout_date=checkout,
                        adults=trip_plan.get('num_people', 2),
                        price_max=max_price_per_night,
                        limit=10,
                    )
                )
            
            loop.close()
        except Exception as e:
            print(f"Hotel search error: {e}")
            hotels = []
        
        # Calculate match scores
        for hotel in hotels:
            hotel['match_score'] = self._calculate_match_score(
                hotel,
                center_lat,
                center_lon,
                max_price_per_night,
            )
        
        # Sort by match score
        hotels.sort(key=lambda h: h['match_score'], reverse=True)
        
        return hotels
    
    def _calculate_match_score(
        self,
        hotel: Dict[str, Any],
        center_lat: float,
        center_lon: float,
        budget_per_night: int,
    ) -> float:
        """Calculate how well a hotel matches the trip requirements."""
        score = 0.0
        
        # Rating score (0-40 points)
        rating = hotel.get('rating') or 0
        score += (rating / 5.0) * 40
        
        # Price fit score (0-30 points)
        price = hotel.get('price_per_night') or 0
        if price > 0 and budget_per_night > 0:
            price_ratio = price / budget_per_night
            if price_ratio <= 0.7:
                score += 30  # Under budget
            elif price_ratio <= 1.0:
                score += 25  # Within budget
            elif price_ratio <= 1.2:
                score += 15  # Slightly over
            else:
                score += 5  # Over budget
        
        # Distance to tour places score (0-20 points)
        # Prioritize distance_to_tours (calculated from centroid of all tour places)
        distance = hotel.get('distance_to_tours')
        if distance is None:
            distance = self._parse_distance(hotel.get('distance_to_center') or 0)
        
        if distance <= 1:
            score += 20  # Within 1km of tour centroid
        elif distance <= 2:
            score += 17
        elif distance <= 3:
            score += 14
        elif distance <= 5:
            score += 10
        elif distance <= 10:
            score += 5
        else:
            score += 2
        
        # Review count score (0-10 points)
        reviews = hotel.get('review_count') or 0
        if reviews >= 1000:
            score += 10
        elif reviews >= 500:
            score += 8
        elif reviews >= 100:
            score += 5
        else:
            score += 2
        
        return round(score, 2)
    
    def _get_province_center(self, province: str) -> tuple:
        """Get approximate center coordinates for a province."""
        # Major Vietnam cities/provinces
        province_coords = {
            'ho chi minh': (10.8231, 106.6297),
            'hcm': (10.8231, 106.6297),
            'saigon': (10.8231, 106.6297),
            'ha noi': (21.0285, 105.8542),
            'hanoi': (21.0285, 105.8542),
            'da nang': (16.0544, 108.2022),
            'danang': (16.0544, 108.2022),
            'hoi an': (15.8801, 108.3380),
            'hue': (16.4637, 107.5909),
            'nha trang': (12.2388, 109.1967),
            'phu quoc': (10.2899, 103.9840),
            'da lat': (11.9404, 108.4583),
            'dalat': (11.9404, 108.4583),
            'can tho': (10.0452, 105.7469),
            'vung tau': (10.3460, 107.0843),
            'ha long': (20.9101, 107.1839),
            'sapa': (22.3364, 103.8438),
            'sa pa': (22.3364, 103.8438),
        }
        
        province_lower = province.lower()
        for key, coords in province_coords.items():
            if key in province_lower or province_lower in key:
                return coords
        
        # Default to Ho Chi Minh City
        return (10.8231, 106.6297)
    
    def generate_affiliate_links(
        self,
        hotel: Dict[str, Any],
        checkin: str,
        checkout: str,
        affiliate_id: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Generate affiliate booking links for multiple platforms.
        
        Args:
            hotel: Hotel dict
            checkin: Check-in date
            checkout: Check-out date
            affiliate_id: Optional affiliate ID
            
        Returns:
            Dict with platform names and URLs
        """
        import urllib.parse
        
        links = {}
        hotel_name = hotel.get('name', '')
        hotel_address = hotel.get('address', '')
        
        # Create search query
        search_query = f"{hotel_name} {hotel_address}".strip()
        encoded_query = urllib.parse.quote(search_query)
        encoded_name = urllib.parse.quote(hotel_name)
        
        # Booking.com
        links['booking'] = (
            f"{self.BOOKING_AFFILIATE_BASE}"
            f"?ss={encoded_query}"
            f"&checkin={checkin}"
            f"&checkout={checkout}"
            f"&dest_type=hotel"
        )
        
        # Agoda
        links['agoda'] = (
            f"{self.AGODA_AFFILIATE_BASE}"
            f"?pcs=1"
            f"&city=0"
            f"&checkin={checkin}"
            f"&checkout={checkout}"
            f"&textToSearch={encoded_query}"
        )
        
        # TripAdvisor search
        links['tripadvisor'] = (
            f"https://www.tripadvisor.com/Search"
            f"?q={encoded_name}"
        )
        
        return links

