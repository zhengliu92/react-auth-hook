import React, { useState } from 'react';
import { AuthProvider, useAuth, httpClient, configureHttpClientDefaults } from '../../src';
// Import the shared mock interceptors
import './mockInterceptors';
import { setupMockInterceptorsForInstance } from './mockInterceptors';

// Setup mock interceptors for the httpClient instance
setupMockInterceptorsForInstance(httpClient);

// Component to demo httpClient usage with authentication
function HttpClientDemo() {
  const { login, logout, isAuthenticated, isLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${emoji} ${message}`]);
  };

  // Login helper
  const handleLogin = async () => {
    try {
      await login({ email: 'test@example.com', password: 'password' });
      addResult('Login successful', 'success');
    } catch (error: any) {
      addResult(`Login failed: ${error.message}`, 'error');
    }
  };

  // GET request example - fetch user profile
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // httpClient automatically handles:
      // - Adding Bearer token to headers
      // - Token refresh on 401 errors
      // - Retrying failed requests after refresh
      const response = await httpClient.get('/api/protected/user');
      setUser(response.data);
      addResult(`User profile fetched: ${response.data.name}`, 'success');
    } catch (error: any) {
      addResult(`Failed to fetch user profile: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // PUT request example - update user profile
  const updateUserProfile = async () => {
    if (!user) {
      addResult('No user data to update', 'error');
      return;
    }

    try {
      const updatedData = { ...(user as any), name: 'Updated Name', lastModified: new Date().toISOString() };
      const response = await httpClient.put('/api/protected/user', updatedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setUser(response.data);
      addResult(`User profile updated: ${response.data.name}`, 'success');
    } catch (error: any) {
      addResult(`Failed to update user profile: ${error.message}`, 'error');
    }
  };

  // POST request example - create a new post
  const createPost = async () => {
    try {
      const postData = {
        title: `New Post ${Date.now()}`,
        content: 'This is a test post created via httpClient',
        timestamp: new Date().toISOString()
      };
      const response = await httpClient.post('/api/protected/posts', postData);
      setPosts(prev => [response.data, ...prev]);
      addResult(`Post created: "${response.data.title}"`, 'success');
    } catch (error: any) {
      addResult(`Failed to create post: ${error.message}`, 'error');
    }
  };

  // GET request example - fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await httpClient.get('/api/protected/posts');
      setPosts(response.data);
      addResult(`Fetched ${response.data.length} posts`, 'success');
    } catch (error: any) {
      addResult(`Failed to fetch posts: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // DELETE request example
  const deletePost = async (postId: string) => {
    try {
      await httpClient.delete(`/api/protected/posts/${postId}`);
      setPosts(prev => prev.filter(post => post.id !== postId));
      addResult(`Post ${postId} deleted`, 'success');
    } catch (error: any) {
      addResult(`Failed to delete post: ${error.message}`, 'error');
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '400px' }}>
        <h3>httpClient Demo - Login Required</h3>
        <p>Please login to test the httpClient features. The httpClient automatically handles:</p>
        <ul style={{ textAlign: 'left', marginBottom: '20px' }}>
          <li>Adding Bearer tokens to requests</li>
          <li>Automatic token refresh on expiration</li>
          <li>Retrying failed requests after refresh</li>
          <li>Standard HTTP methods (GET, POST, PUT, DELETE)</li>
          <li>Custom defaults (use configureHttpClientDefaults for baseURL, headers, etc.)</li>
        </ul>
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? 'Logging in...' : 'Login to Continue'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px' }}>
      <h2>httpClient Usage Demo</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>Authenticated API Operations</h4>
        <button 
          onClick={logout}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* User Profile Section */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h4>User Profile (GET/PUT)</h4>
          <div style={{ marginBottom: '10px' }}>
            <button 
              onClick={fetchUserProfile} 
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                marginRight: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Fetch Profile (GET)'}
            </button>
            <button 
              onClick={updateUserProfile} 
              disabled={!user || loading}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Update Profile (PUT)
            </button>
          </div>
          {user && (
            <div style={{ 
              fontSize: '12px', 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              <strong>Current User:</strong>
              <pre style={{ margin: '5px 0' }}>{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Posts Section */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h4>Posts (GET/POST/DELETE)</h4>
          <div style={{ marginBottom: '10px' }}>
            <button 
              onClick={fetchPosts} 
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                marginRight: '5px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Fetch Posts (GET)
            </button>
            <button 
              onClick={createPost} 
              disabled={loading}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Post (POST)
            </button>
          </div>
          {posts.length > 0 && (
            <div style={{ 
              maxHeight: '200px', 
              overflow: 'auto', 
              fontSize: '12px',
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px'
            }}>
              <strong>Posts ({posts.length}):</strong>
              {posts.map((post, index) => (
                <div key={post.id || index} style={{ 
                  margin: '5px 0', 
                  padding: '5px',
                  border: '1px solid #dee2e6',
                  borderRadius: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span><strong>{post.title}</strong></span>
                  <button
                    onClick={() => deletePost(post.id)}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Log */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4>Request Results Log</h4>
          <button 
            onClick={clearResults}
            style={{ 
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Log
          </button>
        </div>
        <div style={{ 
          height: '200px', 
          overflow: 'auto', 
          border: '1px solid #ccc', 
          padding: '10px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {results.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No operations performed yet. Use the buttons above to test httpClient features.
            </p>
          ) : (
            results.map((result, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
        <h4>httpClient Features Demonstrated:</h4>
        <ul style={{ margin: 0, textAlign: 'left' }}>
          <li><strong>Automatic Authorization:</strong> Bearer tokens added to all requests</li>
          <li><strong>Token Refresh:</strong> Automatically refreshes expired tokens and retries requests</li>
          <li><strong>HTTP Methods:</strong> GET, POST, PUT, DELETE operations</li>
          <li><strong>Error Handling:</strong> Proper error propagation and logging</li>
          <li><strong>Request Queuing:</strong> Handles multiple concurrent requests during token refresh</li>
          <li><strong>Custom Headers:</strong> Support for additional headers and configurations per request</li>
          <li><strong>Default Configuration:</strong> Use configureHttpClientDefaults() for baseURL, timeout, global headers</li>
        </ul>
      </div>
    </div>
  );
}

// Story wrapper component
function HttpClientStoryWrapper() {
  const config = {
    login_url: '/api/auth/login',
    refresh_url: '/api/auth/refresh',
    access_expiration_code: 401,
  };

  return (
    <AuthProvider config={config}>
      <HttpClientDemo />
    </AuthProvider>
  );
}

// Export for Storybook
export default {
  title: 'Auth/httpClient',
  component: HttpClientStoryWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive demonstration of the httpClient showing automatic token management, HTTP operations, and error handling.',
      },
    },
  },
};

export const InteractiveDemo = {
  render: () => <HttpClientStoryWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Complete demonstration of httpClient features including GET, POST, PUT, DELETE requests with automatic token handling and refresh.',
      },
    },
  },
};

export const APIOperations = {
  render: () => <HttpClientStoryWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Test various API operations like user profile management and post CRUD operations using the authenticated httpClient.',
      },
    },
  },
}; 