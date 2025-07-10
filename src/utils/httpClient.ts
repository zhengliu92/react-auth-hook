import axios, { AxiosInstance, AxiosResponse, CreateAxiosDefaults } from 'axios';
import { getStoredTokens, clearTokens } from './tokenStorage';

// Create axios instance with default config
export const httpClient: AxiosInstance = axios.create();

// Store auth configuration
let authConfig: {
  refresh_url?: string;
  access_expiration_code?: number;
} = {};

// Store refresh token logic
let refreshTokenFn: (() => Promise<string>) | null = null;

// Track if refresh is in progress to avoid multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
httpClient.interceptors.request.use(
  (config) => {
    const { accessToken } = getStoredTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error matches the access expiration code and refresh is available
    const shouldRefresh = 
      authConfig.access_expiration_code && 
      error.response?.status === authConfig.access_expiration_code &&
      authConfig.refresh_url &&
      refreshTokenFn &&
      !originalRequest._retry;

    if (shouldRefresh) {
      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return httpClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshTokenFn!();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens on refresh failure
        clearTokens();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to configure the HTTP client with auth settings
export const configureHttpClient = (
  config: { refresh_url?: string; access_expiration_code?: number },
  refreshFn: (() => Promise<string>) | null
) => {
  authConfig = config;
  refreshTokenFn = refreshFn;
};

// Function to configure HTTP client with custom axios settings
export const configureHttpClientDefaults = (config: CreateAxiosDefaults) => {
  // Apply the configuration to the existing instance
  Object.assign(httpClient.defaults, config);
};

// Function to clear the HTTP client configuration (useful for logout)
export const clearHttpClientAuth = () => {
  authConfig = {};
  refreshTokenFn = null;
  isRefreshing = false;
  failedQueue = [];
}; 