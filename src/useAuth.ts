import { useContext } from 'react';
import { AuthContext } from './context';
import { UseAuthResult, DefaultLoginResponse } from './types';

/**
 * Custom hook for accessing authentication state and functions
 * Must be used within an AuthProvider component
 * 
 * @returns Authentication state and functions
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = <T = DefaultLoginResponse>(): UseAuthResult<T> => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    isAuthenticated: context.isAuthenticated,
    login: context.login as any,
    logout: context.logout,
    request: context.request,
    getLoginResponse: context.getLoginResponse as any,
    isLoading: context.isLoading,
    error: context.error,
  };
}; 