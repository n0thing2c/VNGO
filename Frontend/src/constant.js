export const API_BASE_URL = 'http://127.0.0.1:8000/api';

// API endpoints
export const API_ENDPOINTS = {
    CREATE_TOUR: `${API_BASE_URL}/tour/post/`,
    GET_TOUR: (id) => `${API_BASE_URL}/tour/get/${id}/`,
    UPDATE_TOUR: (id) => `${API_BASE_URL}/tour/put/${id}/`,
    GET_ALL_PLACES: `${API_BASE_URL}/places/all/`,
    GET_ALL_TOURS: `${API_BASE_URL}/tour/get/all/`,
    GET_FILTER_OPTIONS: `${API_BASE_URL}/filter-options/`,
    GET_POPULAR_DESTINATIONS: `${API_BASE_URL}/places/popular/`,
    GET_ALL_PROVINCES: `${API_BASE_URL}/provinces/all/`,
    GET_TOUR_ACHIEVEMENTS: (id) => `${API_BASE_URL}/tour/achievements/${id}/`,
    GET_TOUR_RATINGS: (id) => `${API_BASE_URL}/tour/ratings/${id}/`,
    GET_HOMEPAGE_GUIDES: 'http://127.0.0.1:8000/profiles/guide/homepage/',
};

// App routes
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    VERIFY_EMAIL: '/verify-email',
    TOURS: '/tours',
    TOUR_POST: (id) => `/tour/post/${id}`,
    TOUR_CREATE: '/tour/create',
    TOUR_EDIT: (id) => `/tour/edit/${id}`,
    CHAT: '/chat',
    MANAGEMENT: '/management',
    TOURIST_PROFILE: '/tourist-profile',
    GUIDE_PROFILE: '/guide-profile',
    PUBLIC_PROFILE: (guideId = ":guideId") => `/public-profile/${guideId}`,
    TOURIST_PUBLIC_PROFILE: (touristId = ":touristId") => `/tourist-public-profile/${touristId}`,
};