# React Auth Hook

A lightweight React hook library for authentication with automatic token refresh and request management.

[![Demo](https://img.shields.io/badge/Demo-Live-blue?style=for-the-badge&logo=react)](https://zhengliu92.github.io/react-auth-hook/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/zhengliu92/react-auth-hook)
[![npm](https://img.shields.io/npm/v/@zhengliu92/react-auth-hook?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@zhengliu92/react-auth-hook)

## Features

- 🔐 Simple authentication state management
- 🔄 Automatic token refresh on expiration  
- 📡 Built-in authenticated requests with Bearer token
- 💾 Persistent state with localStorage
- 🎯 Full TypeScript support with generic response types
- ⚡ Lightweight and performant

## Installation

```bash
npm install @zhengliu92/react-auth-hook
```

## Quick Start

### 1. Setup AuthProvider

```tsx
import { AuthProvider } from '@zhengliu92/react-auth-hook';

const config = {
  login_url: 'https://api.example.com/auth/login',
  refresh_url: 'https://api.example.com/auth/refresh', // optional
  access_expiration_code: 401, // optional
};

function App() {
  return (
    <AuthProvider config={config}>
      <YourApp />
    </AuthProvider>
  );
}
```

### 2. Use the Hook

```tsx
import { useAuth } from '@zhengliu92/react-auth-hook';

function LoginComponent() {
  const { login, logout, isAuthenticated, request } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const fetchData = async () => {
    const response = await request({ method: 'GET', url: '/api/protected' });
    console.log(response.data);
  };

  return isAuthenticated ? (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={logout}>Logout</button>
    </div>
  ) : (
    <button onClick={handleLogin}>Login</button>
  );
}
```

## API Reference

### AuthConfig

```typescript
interface AuthConfig {
  login_url: string;
  refresh_url?: string;
  access_expiration_code?: number;
}
```

### useAuth Hook

```typescript
const {
  isAuthenticated,        // boolean - auth status
  login,             // (credentials) => Promise<LoginResponse>
  logout,            // () => void
  request,           // (config) => Promise<AxiosResponse> - auto Bearer token
  getLoginResponse,  // () => LoginResponse | null - retrieve login response data
  isLoading,         // boolean - request state
  error              // string | null - error message
} = useAuth<CustomResponseType>(); // Optional: specify custom response type
```

### Generic Login Response

Support for custom API response structures:

```typescript
// Default structure
interface DefaultLoginResponse {
  access_token: string;
  refresh_token?: string;
}

// Custom response type
interface CustomLoginResponse {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string };
  permissions: string[];
}

// Usage with custom type
const { login, getLoginResponse } = useAuth<CustomLoginResponse>();
const response = await login(credentials);
// response.user and response.permissions are now available

// Later, retrieve the stored login response
const storedResponse = getLoginResponse();
if (storedResponse) {
  console.log('User:', storedResponse.user);
  console.log('Permissions:', storedResponse.permissions);
}
```

## Key Features

### Automatic Token Refresh
Configure `refresh_url` and `access_expiration_code` for automatic token renewal when requests fail with the specified status code.

### Authenticated Requests
The `request` function automatically adds Bearer tokens and handles token refresh:

```tsx
const { request } = useAuth();

// All requests automatically include Authorization header
await request({ method: 'GET', url: '/api/users' });
await request({ method: 'POST', url: '/api/users', data: userData });
```

### Persistent Authentication
Authentication state persists across browser sessions using localStorage.

### Login Response Access
Use `getLoginResponse()` to retrieve the full login response data:

```tsx
const { login, getLoginResponse } = useAuth<CustomLoginResponse>();

// After successful login
await login(credentials);

// Access the full login response data
const loginData = getLoginResponse();
if (loginData) {
  // Access any custom fields returned by your API
  console.log('User info:', loginData.user);
  console.log('Permissions:', loginData.permissions);
}
```

**Note:** Login response data is stored in memory only and will be `null` after browser refresh, while tokens are persisted in localStorage for maintaining authentication across sessions.

## Requirements

- React 16.8+
- Modern browser with localStorage support

## License

MIT