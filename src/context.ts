import { createContext } from 'react';
import { AuthContextType, AuthState, DefaultLoginResponse } from './types';

export const initialAuthState: AuthState = {
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

export const AuthContext = createContext<AuthContextType<DefaultLoginResponse> | undefined>(undefined); 