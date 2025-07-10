import type { Meta, StoryObj } from '@storybook/react';
import { AuthProvider, useAuth, type AuthConfig } from '../../src';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import React, { useState } from 'react';
// Import the shared mock interceptors
import './mockInterceptors';

// Demo Login Component
function LoginDemo() {
  const { login, logout, isLoggedIn, isLoading, error, request } = useAuth();
  const [credentials, setCredentials] = useState({
    email: 'user@example.com',
    password: 'password123'
  });
  const [apiResult, setApiResult] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleAPICall = async () => {
    try {
      // Simulate an API call
      const response = await request({
        method: 'GET',
        url: '/api/protected/user',
      });
      setApiResult(`API Success: ${JSON.stringify(response.data.name)}`);
    } catch (error: any) {
      setApiResult(`API Error: ${error.message}`);
    }
  };

  if (isLoggedIn) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h3>✅ Authenticated!</h3>
        <p>You are now logged in and can make authenticated API calls.</p>
        {apiResult && (
          <div style={{ 
            margin: '10px 0', 
            padding: '10px', 
            backgroundColor: '#f0f8ff', 
            border: '1px solid #007bff',
            borderRadius: '4px'
          }}>
            {apiResult}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleAPICall} style={{ padding: '8px 16px' }}>
            Test API Call
          </button>
          <button onClick={logout} style={{ padding: '8px 16px' }}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '400px' }}>
      <h3>Login Demo</h3>
      <form onSubmit={handleLogin}>
        {error && (
          <div style={{ 
            color: '#d32f2f', 
            backgroundColor: '#ffebee', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '10px' 
          }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ccc' 
            }}
            disabled={isLoading}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ccc' 
            }}
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: isLoading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <p><strong>Try these credentials:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>user@example.com (success)</li>
          <li>fail@example.com (failure demo)</li>
        </ul>
      </div>
    </div>
  );
}

// Wrapper component for stories
function AuthStoryWrapper({ config }: { config: AuthConfig }) {
  return (
    <AuthProvider config={config}>
      <LoginDemo />
    </AuthProvider>
  );
}

const meta: Meta<typeof AuthStoryWrapper> = {
  title: 'Auth/AuthProvider',
  component: AuthStoryWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'The AuthProvider component manages authentication state and provides auth functions to child components via React Context.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicConfiguration: Story = {
  args: {
    config: {
      login_url: '/api/auth/login', // Mock endpoint
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic configuration with only login URL. This is the minimal setup required.',
      },
    },
  },
};

export const WithRefreshToken: Story = {
  args: {
    config: {
      login_url: '/api/auth/login',
      refresh_url: '/api/auth/refresh',
      access_expiration_code: 401,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration with refresh token support and automatic refresh when receiving 401 status codes.',
      },
    },
  },
};

export const CustomExpirationCode: Story = {
  args: {
    config: {
      login_url: '/api/auth/login',
      refresh_url: '/api/auth/refresh',
      access_expiration_code: 403,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom expiration status code (403 instead of default 401) for token refresh triggers.',
      },
    },
  },
};

// Interactive test for login flow
export const LoginFlow: Story = {
  args: {
    config: {
      login_url: '/api/auth/login',
      refresh_url: '/api/auth/refresh',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for the form to load
    const emailInput = await canvas.findByLabelText(/email/i);
    const passwordInput = await canvas.findByLabelText(/password/i);
    const loginButton = await canvas.findByRole('button', { name: /login/i });
    
    // Verify initial state
    expect(emailInput).toHaveValue('user@example.com');
    expect(passwordInput).toHaveValue('password123');
    
    // Test login interaction
    await userEvent.click(loginButton);
    
    // Should show loading state
    expect(loginButton).toHaveTextContent('Logging in...');
    expect(loginButton).toBeDisabled();
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing the complete login flow with automated testing.',
      },
    },
  },
}; 