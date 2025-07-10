import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface AuthConfig {
  login_url: string;
  refresh_url?: string;
  access_expiration_code?: number;
}

export interface LoginCredentials {
  [key: string]: any;
}

export interface DefaultLoginResponse {
  access_token: string;
  refresh_token?: string;
}

export type LoginResponse<T = DefaultLoginResponse> = T & {
  access_token: string;
  refresh_token?: string;
};

export interface AuthState {
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType<T = DefaultLoginResponse> extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResponse<T>>;
  logout: () => void;
  request: <R = any>(config: AxiosRequestConfig) => Promise<AxiosResponse<R>>;
  config: AuthConfig;
}

export interface UseAuthResult<T = DefaultLoginResponse> {
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse<T>>;
  logout: () => void;
  request: <R = any>(config: AxiosRequestConfig) => Promise<AxiosResponse<R>>;
  isLoading: boolean;
  error: string | null;
} 