

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
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  loginResponse: any | null; // Store the full login response
}

export interface AuthContextType<T = DefaultLoginResponse> extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResponse<T>>;
  logout: () => void;
  getLoginResponse: () => T | null; // Method to get the stored login response
  config: AuthConfig;
}

export interface UseAuthResult<T = DefaultLoginResponse> {
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse<T>>;
  logout: () => void;
  getLoginResponse: () => T | null; // Method to get the stored login response
  isLoading: boolean;
  error: string | null;
} 