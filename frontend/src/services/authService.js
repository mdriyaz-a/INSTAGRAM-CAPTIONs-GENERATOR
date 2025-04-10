import api from './api';

/**
 * Set the authentication token in local storage
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    // Ensure token is properly formatted
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    localStorage.setItem('token', formattedToken);
    console.log('Token stored in localStorage:', formattedToken.substring(0, 20) + '...');

    // Also set it in the API headers directly
    import('./api').then(apiModule => {
      const api = apiModule.default;
      api.defaults.headers.common['Authorization'] = formattedToken;
      console.log('Token set in API headers');
    });
  } else {
    localStorage.removeItem('token');
    console.log('Token removed from localStorage');

    // Also remove it from the API headers
    import('./api').then(apiModule => {
      const api = apiModule.default;
      delete api.defaults.headers.common['Authorization'];
      console.log('Token removed from API headers');
    });
  }
};

/**
 * Get the authentication token from local storage
 * @returns {string|null} - JWT token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if the user is authenticated
 * @returns {boolean} - True if the user is authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Username
 * @param {string} userData.password - Password
 * @returns {Promise} - Promise with the registration response
 */
export const register = (userData) => {
  return api.post('/auth/register', userData);
};

/**
 * Login a user
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.username - Username
 * @param {string} credentials.password - Password
 * @returns {Promise} - Promise with the login response
 */
export const login = (credentials) => {
  return api.post('/auth/login', credentials);
};

/**
 * Get the profile of the logged in user
 * @returns {Promise} - Promise with the user profile
 */
export const getProfile = () => {
  return api.get('/auth/profile');
};

/**
 * Set Instagram credentials for the logged in user
 * @param {Object} credentials - Instagram credentials
 * @param {string} credentials.instagram_username - Instagram username
 * @param {string} credentials.instagram_password - Instagram password
 * @returns {Promise} - Promise with the response
 */
export const setInstagramCredentials = (credentials) => {
  return api.post('/auth/instagram-credentials', credentials);
};