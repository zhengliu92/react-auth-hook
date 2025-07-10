import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Mock adapter function that handles our mock endpoints
const mockAdapter = (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  return new Promise((resolve, reject) => {
    // Mock login endpoint
    if (config.url === '/api/auth/login') {
      const requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      
      setTimeout(() => {
        if (requestData?.email === 'fail@example.com') {
          const error = new Error('Request failed with status code 401') as any;
          error.response = {
            status: 401,
            statusText: 'Unauthorized',
            data: { message: 'Invalid credentials' },
            headers: {},
            config
          };
          reject(error);
        } else {
          resolve({
            data: {
              access_token: 'mock_access_token_' + Date.now(),
              refresh_token: 'mock_refresh_token_' + Date.now(),
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          } as AxiosResponse);
        }
      }, 1000);
      return;
    }
    
    // Mock refresh endpoint
    if (config.url === '/api/auth/refresh') {
      setTimeout(() => {
        resolve({
          data: {
            access_token: 'refreshed_access_token_' + Date.now(),
            refresh_token: 'refreshed_refresh_token_' + Date.now(),
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        } as AxiosResponse);
      }, 500);
      return;
    }
    
    // Mock protected API endpoint
    if (config.url === '/api/protected/user') {
      setTimeout(() => {
        const authHeader = config.headers?.Authorization;
        if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
          const error = new Error('Request failed with status code 401') as any;
          error.response = {
            status: 401,
            statusText: 'Unauthorized',
            data: { message: 'No valid authorization token' },
            headers: {},
            config
          };
          reject(error);
        } else {
          resolve({
            data: {
              id: 1,
              name: 'John Doe',
              email: 'john.doe@example.com',
              username: 'johndoe'
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          } as AxiosResponse);
        }
      }, 500);
      return;
    }
    
    // Mock JSONPlaceholder endpoint for backward compatibility
    if (config.url === 'https://jsonplaceholder.typicode.com/users/1') {
      setTimeout(() => {
        resolve({
          data: {
            id: 1,
            name: 'Leanne Graham',
            username: 'Bret',
            email: 'Sincere@april.biz'
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        } as AxiosResponse);
      }, 500);
      return;
    }
    
    // For any other endpoints, reject with a not found error
    const error = new Error('Request failed with status code 404') as any;
    error.response = {
      status: 404,
      statusText: 'Not Found',
      data: { message: 'Mock endpoint not found' },
      headers: {},
      config
    };
    reject(error);
  });
};

// Set up axios interceptors to mock authentication endpoints
export const setupMockInterceptors = () => {
  // Clear existing interceptors to avoid duplicates
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();
  
  // Set the mock adapter for axios
  axios.defaults.adapter = mockAdapter as any;
};

// Initialize mock interceptors immediately when imported
setupMockInterceptors(); 