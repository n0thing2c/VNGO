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
    GET_TOUR_ACHIEVEMENTS: (id)=>`${API_BASE_URL}/tour/achievements/${id}/`,
    GET_TOUR_RATINGS: (id)=>`${API_BASE_URL}/tour/ratings/${id}/`,
};