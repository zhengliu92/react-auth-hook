import React, { useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { AuthContext, initialAuthState } from './context';
import { AuthConfig, AuthState, LoginResponse, AuthContextType, LoginCredentials, DefaultLoginResponse } from './types';
import { getStoredTokens, setTokens, clearTokens } from './utils/tokenStorage';
import { configureHttpClient, clearHttpClientAuth } from './utils/httpClient';

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
      isAuthenticated: !!accessToken,
      accessToken,
      refreshToken,
      loginResponse: null, // Login response is not persisted, will be null on refresh
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
        isAuthenticated: true,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        loginResponse: loginData, // Store the full login response
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
    clearHttpClientAuth();
    setAuthState(initialAuthState);
    refreshPromiseRef.current = null;
  }, []);

  // Get login response function
  const getLoginResponse = useCallback((): T | null => {
    return authState.loginResponse;
  }, [authState.loginResponse]);

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
        // Refresh endpoint typically only returns { access_token }
        const response = await axios.post<{ access_token: string; refresh_token?: string }>(authConfig.refresh_url!, {
          refresh_token: currentRefreshToken,
        });
        
        const refreshData = response.data;
        const access_token = refreshData.access_token;
        
        if (!access_token) {
          throw new Error('Refresh response does not contain access_token');
        }
        
        // Use new refresh token if provided, otherwise keep the current one
        const new_refresh_token = refreshData.refresh_token || currentRefreshToken;
        
        // Update stored tokens
        setTokens(access_token, new_refresh_token);
        
        setAuthState(prev => ({
          ...prev,
          accessToken: access_token,
          refreshToken: new_refresh_token,
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

  // Configure HTTP client with auth settings
  useEffect(() => {
    configureHttpClient(
      {
        refresh_url: authConfig.refresh_url,
        access_expiration_code: authConfig.access_expiration_code,
      },
      authConfig.refresh_url ? refreshToken : null
    );

    // Cleanup on unmount
    return () => {
      clearHttpClientAuth();
    };
  }, [authConfig.refresh_url, authConfig.access_expiration_code, refreshToken]);



  const contextValue: AuthContextType<T> = {
    ...authState,
    login,
    logout,
    getLoginResponse,
    config: authConfig,
  };

  return (
    <AuthContext.Provider value={contextValue as any}>
      {children}
    </AuthContext.Provider>
  );
}; 