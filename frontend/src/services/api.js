import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for sending/receiving cookies (refresh token)
});

// Request interceptor to attach access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the session was invalidated by another device login, logout instantly
        if (error.response?.status === 401 && error.response?.data?.message === 'Session invalidated, logged in from another device') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login?reason=session_invalidated';
            return Promise.reject(error);
        }

        // If error is 401 and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to get a new access token using the refresh token (in httpOnly cookie)
                const res = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data.token;
                localStorage.setItem('token', newAccessToken);

                // Update the authorization header and retry the original request
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails (e.g. token expired), user must login again
                console.error('Refresh token expired or invalid', refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
