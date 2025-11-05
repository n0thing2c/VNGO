import axios from "axios";
import { useAuthStore } from "../../stores/useAuthStore";

const api = axios.create({
    baseURL: import.meta.env.MODE == 'development' ? "http://localhost:8000" : "",
    // Always send cookies for refresh via cookie
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

export default api

// Attach Authorization header if access token exists
api.interceptors.request.use((config) => {
    try {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
    } catch { }
    return config;
});

let isRefreshing = false;
let pendingRequests = [];

function onRefreshed(newAccess) {
    pendingRequests.forEach((cb) => cb(newAccess));
    pendingRequests = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }
        // Do NOT attempt refresh on auth endpoints like login/signup/verify
        const url = (originalRequest && originalRequest.url) || "";
        const isAuthPath = ["/auth/login/", "/auth/signup/", "/auth/email/confirm/", "/auth/email/resend/"].some((p) => url.includes(p));
        if (error.response && error.response.status === 401 && !isAuthPath) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    pendingRequests.push((newAccess) => {
                        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
                        resolve(api(originalRequest));
                    });
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try {
                const refreshResp = await api.post("/auth/token/refresh/", {});
                const newAccess = refreshResp.data?.access;
                if (newAccess) {
                    useAuthStore.setState({ accessToken: newAccess });
                    onRefreshed(newAccess);
                    originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
                    return api(originalRequest);
                }
            } catch (e) {
                useAuthStore.setState({ accessToken: null, user: null });
                // Propagate the original 401 to the caller
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);