import api from './api';

/**
 * Get all posts for the logged in user
 * @returns {Promise} - Promise with the posts
 */
export const getPosts = () => {
  return api.get('/posts');
};

/**
 * Get a specific post
 * @param {number} postId - ID of the post to get
 * @returns {Promise} - Promise with the post
 */
export const getPost = (postId) => {
  return api.get(`/posts/${postId}`);
};

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @param {string} postData.image_path - Path to the image
 * @param {string} postData.image_description - Description of the image
 * @param {string} postData.caption - Caption for the post
 * @param {string} postData.post_type - Type of post ('post' or 'story')
 * @param {string} postData.scheduled_at - ISO date string for scheduling
 * @param {Object} postData.instagram_credentials - Instagram credentials
 * @returns {Promise} - Promise with the created post
 */
export const createPost = (postData) => {
  // Get the token from localStorage
  const token = localStorage.getItem('token');

  // Create headers with the token
  const headers = {};
  if (token) {
    headers['Authorization'] = token;
  }

  // Use the proxy instead of direct URL, with explicit headers
  return api.post('/posts', postData, { headers });
};

/**
 * Update a post
 * @param {number} postId - ID of the post to update
 * @param {Object} postData - Post data to update
 * @returns {Promise} - Promise with the updated post
 */
export const updatePost = (postId, postData) => {
  return api.put(`/posts/${postId}`, postData);
};

/**
 * Delete a post
 * @param {number} postId - ID of the post to delete
 * @returns {Promise} - Promise with the response
 */
export const deletePost = (postId) => {
  return api.delete(`/posts/${postId}`);
};

/**
 * Post to Instagram
 * @param {number} postId - ID of the post to post to Instagram
 * @param {Object} instagramCredentials - Instagram credentials
 * @returns {Promise} - Promise with the response
 */
export const postToInstagram = (postId, instagramCredentials) => {
  return api.post(`/posts/${postId}/post-to-instagram`, { instagram_credentials: instagramCredentials });
};