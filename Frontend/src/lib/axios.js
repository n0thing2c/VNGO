import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.MODE == 'development' ? "http://localhost:8000" : "",
    // Only use credentials in production when CORS_ALLOW_CREDENTIALS is True
    withCredentials: import.meta.env.MODE !== 'development',
    headers: {
        'Content-Type': 'application/json',
    },
})

export default api