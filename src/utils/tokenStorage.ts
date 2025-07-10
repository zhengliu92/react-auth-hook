/**
 * Token storage utilities for managing access and refresh tokens
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Retrieves stored tokens from localStorage
 */
export function getStoredTokens(): StoredTokens {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

/**
 * Stores access token in localStorage
 */
export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * Stores refresh token in localStorage
 */
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Stores both tokens in localStorage
 */
export function setTokens(accessToken: string, refreshToken?: string): void {
  setAccessToken(accessToken);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

/**
 * Clears all stored tokens from localStorage
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Checks if there are any stored tokens
 */
export function hasStoredTokens(): boolean {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
} 