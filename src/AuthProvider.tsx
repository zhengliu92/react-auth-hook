import React, { useState, useCallback, useRef, ReactNode } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthContext, initialAuthState } from './context';
import { AuthConfig, AuthState, LoginResponse, AuthContextType, LoginCredentials, DefaultLoginResponse } from './types';
import { getStoredTokens, setTokens, clearTokens } from './utils/tokenStorage';

interface AuthProviderProps<T = DefaultLoginResponse> {
  children: ReactNode;
  config: AuthConfig;
}

/**
 * AuthProvider component that provides authentication context to the app
 * 
 * @param children - React children components
 * @param config - Authentication configuration object
 */
export const AuthProvider = <T = DefaultLoginResponse>({ children, config }: AuthProviderProps<T>) => {
  // Merge config with defaults
  const authConfig = {
    ...config,
    access_expiration_code: config.access_expiration_code ?? 401,
  };

  const [authState, setAuthState] = useState<AuthState>(() => {
    // Try to restore tokens from localStorage on initialization
    const { accessToken, refreshToken } = getStoredTokens();
    
    return {
      ...initialAuthState,
      isLoggedIn: !!accessToken,
      accessToken,
      refreshToken,
    };
  });

  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse<T>> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await axios.post<LoginResponse<T>>(authConfig.login_url, credentials);
      const loginData = response.data;
      
      // Extract tokens - support both generic response and default structure
      const {access_token, refresh_token} = loginData;
      
      if (!access_token) {
        throw new Error('Response does not contain access_token');
      }
      
      // Store tokens
      setTokens(access_token, refresh_token);
      
      setAuthState(prev => ({
        ...prev,
        isLoggedIn: true,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        isLoading: false,
        error: null,
      }));
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [authConfig.login_url]);

  // Logout function
  const logout = useCallback(() => {
    clearTokens();
    setAuthState(initialAuthState);
    refreshPromiseRef.current = null;
  }, []);

  // Token refresh function
  const refreshToken = useCallback(async (): Promise<string> => {
    const currentRefreshToken = authState.refreshToken;
    if (!authConfig.refresh_url || !currentRefreshToken) {
      throw new Error('Refresh not available');
    }

    // If refresh is already in progress, return the existing promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      try {
        const response = await axios.post<LoginResponse<T>>(authConfig.refresh_url!, {
          refresh_token: currentRefreshToken,
        });
        
        const refreshData = response.data;
        const access_token = (refreshData as any).access_token;
        const new_refresh_token = (refreshData as any).refresh_token;
        
        // Update stored tokens
        setTokens(access_token, new_refresh_token);
        
        setAuthState(prev => ({
          ...prev,
          accessToken: access_token,
          refreshToken: new_refresh_token || prev.refreshToken,
        }));
        
        return access_token;
      } catch (error) {
        // If refresh fails, logout the user
        logout();
        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [authConfig.refresh_url, authState.refreshToken, logout]);

  // Request function with automatic Bearer token and refresh logic
  const request = useCallback(async <R = any>(
    requestConfig: AxiosRequestConfig
  ): Promise<AxiosResponse<R>> => {
    let currentAccessToken = authState.accessToken;
    
    // Add Authorization header if access token is available
    const configWithAuth: AxiosRequestConfig = {
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
        ...(currentAccessToken && { Authorization: `Bearer ${currentAccessToken}` }),
      },
    };

    try {
      const response = await axios<R>(configWithAuth);
      return response;
    } catch (error: any) {
      // Check if error matches the access expiration code and refresh is available
      const shouldRefresh = 
        authConfig.access_expiration_code && 
        error.response?.status === authConfig.access_expiration_code &&
        authConfig.refresh_url &&
        authState.refreshToken;

      if (shouldRefresh) {
        try {
          // Attempt to refresh token
          const newAccessToken = await refreshToken();
          
          // Retry the original request with new token
          const retryConfig: AxiosRequestConfig = {
            ...requestConfig,
            headers: {
              ...requestConfig.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          };
          
          return await axios<R>(retryConfig);
        } catch (refreshError) {
          // If refresh fails, throw the original error
          throw error;
        }
      }
      
      throw error;
    }
  }, [authState.accessToken, authState.refreshToken, authConfig, refreshToken]);

  const contextValue: AuthContextType<T> = {
    ...authState,
    login,
    logout,
    request,
    config: authConfig,
  };

  return (
    <AuthContext.Provider value={contextValue as any}>
      {children}
    </AuthContext.Provider>
  );
}; 