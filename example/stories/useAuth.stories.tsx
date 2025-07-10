// Stories for demonstrating useAuth hook functionality
// Note: Install Storybook dependencies with: npm install to run these stories

import React, { useState } from 'react';
import { AuthProvider, useAuth, httpClient } from '../../src';
// Import the shared mock interceptors
import './mockInterceptors';
import { setupMockInterceptorsForInstance } from './mockInterceptors';

// Setup mock interceptors for the httpClient instance
setupMockInterceptorsForInstance(httpClient);

// Component to demo useAuth hook features
function UseAuthDemo() {
  const { login, logout, isAuthenticated, isLoading, error, getLoginResponse } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLogin = async () => {
    try {
      await login({ email: 'test@example.com', password: 'password' });
      addResult('✅ Login successful');
    } catch (error: any) {
      addResult(`❌ Login failed: ${error.message}`);
    }
  };

  const testAPICall = async () => {
    try {
      const response = await httpClient.get('/api/protected/user');
      addResult(`✅ API call successful: ${response.data.name}`);
    } catch (error: any) {
      addResult(`❌ API call failed: ${error.message}`);
    }
  };

  const testGetLoginResponse = () => {
    const loginResponse = getLoginResponse();
    if (loginResponse) {
      addResult(`✅ Login response retrieved: ${JSON.stringify(loginResponse)}`);
    } else {
      addResult('❌ No login response available (user not logged in or data cleared)');
    }
  };

  const testLogout = () => {
    logout();
    addResult('📤 Logged out');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px' }}>
      <h2>useAuth Hook Demo</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h4>Current State:</h4>
        <ul>
          <li><strong>isAuthenticated:</strong> {isAuthenticated ? '✅ true' : '❌ false'}</li>
          <li><strong>isLoading:</strong> {isLoading ? '⏳ true' : '✅ false'}</li>
          <li><strong>error:</strong> {error || '✅ null'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Available Actions:</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testLogin} 
            disabled={isLoading || isAuthenticated}
            style={{ padding: '8px 16px', borderRadius: '4px' }}
          >
            Test Login
          </button>
          <button 
            onClick={testAPICall} 
            disabled={isLoading || !isAuthenticated}
            style={{ padding: '8px 16px', borderRadius: '4px' }}
          >
            Test API Request
          </button>
          <button 
            onClick={testGetLoginResponse} 
            disabled={isLoading}
            style={{ padding: '8px 16px', borderRadius: '4px' }}
          >
            Get Login Response
          </button>
          <button 
            onClick={testLogout} 
            disabled={isLoading || !isAuthenticated}
            style={{ padding: '8px 16px', borderRadius: '4px' }}
          >
            Test Logout
          </button>
          <button 
            onClick={clearResults}
            style={{ padding: '8px 16px', borderRadius: '4px' }}
          >
            Clear Results
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Test Results:</h4>
        <div style={{ 
          height: '200px', 
          overflow: 'auto', 
          border: '1px solid #ccc', 
          padding: '10px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          {testResults.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No tests run yet. Click the buttons above to test different hook features.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h4>Hook Features Demonstrated:</h4>
        <ul style={{ margin: 0 }}>
          <li><strong>login(credentials):</strong> Authenticate with credentials</li>
          <li><strong>logout():</strong> Clear authentication state</li>
          <li><strong>httpClient:</strong> Make authenticated API calls (imported separately)</li>
          <li><strong>getLoginResponse():</strong> Retrieve the full login response data</li>
          <li><strong>isAuthenticated:</strong> Current authentication status</li>
          <li><strong>isLoading:</strong> Loading state during operations</li>
          <li><strong>error:</strong> Error messages from failed operations</li>
        </ul>
      </div>
    </div>
  );
}

// Story wrapper component
function UseAuthStoryWrapper() {
  const config = {
    login_url: '/api/auth/login',
    refresh_url: '/api/auth/refresh',
    access_expiration_code: 401,
  };

  return (
    <AuthProvider config={config}>
      <UseAuthDemo />
    </AuthProvider>
  );
}

// Export for Storybook (when dependencies are installed)
export default {
  title: 'Auth/useAuth Hook',
  component: UseAuthStoryWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive demonstration of the useAuth hook showing all available functions and state values.',
      },
    },
  },
};

export const InteractiveDemo = {
  render: () => <UseAuthStoryWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Complete interactive demo showing all useAuth hook features including login, logout, API requests, and state management.',
      },
    },
  },
}; 