import { createContext } from 'react';
import { AuthContextType, AuthState, DefaultLoginResponse } from './types';

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  loginResponse: null,
};

export const AuthContext = createContext<AuthContextType<DefaultLoginResponse> | undefined>(undefined); 