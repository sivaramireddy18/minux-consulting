import axios from 'axios';

// Base API instance matching backend port
const API_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial: Automatically attach HttpOnly secure cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache representing short-lived access token in-memory
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// -------------------------------------------------------------
// Request Interceptor: Automatically inject Bearer AccessToken
// -------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------------------------------------
// Response Interceptor: Silent Token Refresh on 401 Expirations
// -------------------------------------------------------------
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Block intercept loops on recursive 401s
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Intercept 401 Unauthorized errors (excluding login endpoints)
    if (error.response?.status === 401 && !originalRequest.url.includes('/auth/login')) {
      if (isRefreshing) {
        // Queue parallel requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Trigger silent refresh request
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = res.data;
        setAccessToken(accessToken);

        // Process queued pending requests with rotated access token
        processQueue(null, accessToken);
        isRefreshing = false;

        // Replay failed original request with updated access header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);
        
        // Custom event notifying components of complete session invalidation (redirects user to Login)
        window.dispatchEvent(new Event('auth-session-expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
