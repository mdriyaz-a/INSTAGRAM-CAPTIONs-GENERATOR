import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  // Use proxy in development to avoid CORS issues
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout for large file uploads
  timeout: 60000, // 60 seconds
  // Increase max content length
  maxContentLength: 20 * 1024 * 1024, // 20MB
  maxBodyLength: 20 * 1024 * 1024, // 20MB
  // Enable credentials for CORS
  withCredentials: true
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (token) {
      // Ensure token is properly formatted
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      // Set the Authorization header
      // Use direct assignment to ensure it's set correctly
      config.headers = {
        ...config.headers,
        'Authorization': formattedToken
      };

      // Log token for debugging (remove in production)
      console.log('Using token:', formattedToken.substring(0, 20) + '...');
      console.log('Request headers:', JSON.stringify(config.headers));
    } else {
      console.warn('No authentication token found');
    }

    // Don't set Content-Type for FormData (multipart/form-data)
    // Let the browser set it automatically with the boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);

    // Handle authentication errors
    if (error.response && (error.response.status === 401 || error.response.status === 422)) {
      console.error('Authentication error:', error.response.data);

      // Check if the error is related to JWT
      const errorMsg = error.response.data.msg || error.response.data.message || '';
      if (errorMsg.includes('token') || errorMsg.includes('JWT') ||
          errorMsg.includes('Subject') || errorMsg.includes('signature')) {
        console.error('JWT token error detected, redirecting to login');
        localStorage.removeItem('token');

        // Show an alert to the user
        alert('Your session has expired. Please log in again.');

        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired'));
      }
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network error - server might be down or unreachable');

      // Check if this might be a CORS issue
      if (error.message && error.message.includes('CORS')) {
        console.error('CORS error detected. Check the CORS configuration in the backend.');
      } else {
        console.error('This could be due to CORS issues, server being down, or a proxy misconfiguration.');
      }

      // You could show a toast notification here
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out - operation took too long');
      // You could show a toast notification here
    }

    // Handle 422 errors (validation errors)
    if (error.response && error.response.status === 422) {
      console.error('Validation error:', error.response.data);
      // You could show specific validation error messages here
    }

    // Handle 500 errors (server errors)
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      // You could show a generic server error message here
    }

    // Handle CORS errors
    if (error.message && (
        error.message.includes('CORS') ||
        error.message.includes('cross-origin') ||
        error.message.includes('Redirect') && error.message.includes('preflight')
    )) {
      console.error('CORS error detected:', error.message);
      console.error('Server error data:', error.response?.data);
      console.error('This is likely a cross-origin issue. Check the CORS configuration in the backend.');
    }

    return Promise.reject(error);
  }
);

export default api;