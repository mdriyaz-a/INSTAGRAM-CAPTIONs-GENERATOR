import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Instagram as InstagramIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { getPosts, postToInstagram } from '../services/postService';

/**
 * Post history page component
 * @param {Object} props - Component props
 * @param {Object} props.user - User object
 * @returns {JSX.Element} - Post history page component
 */
const PostHistory = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [instagramCredentials, setInstagramCredentials] = useState({
    username: '',
    password: '',
  });
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState('');

  // State for available images
  const [availableImages, setAvailableImages] = useState([]);

  // Fetch posts and available images on component mount
  useEffect(() => {
    fetchPosts();
    fetchAvailableImages();
  }, []);

  // Fetch available images from the API
  const fetchAvailableImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/uploads/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Available images:', data);
        setAvailableImages(data.files || []);
      } else {
        console.error('Failed to fetch available images');
      }
    } catch (err) {
      console.error('Error fetching available images:', err);
    }
  };

  // Fetch posts from the API
  const fetchPosts = async () => {
    setLoading(true);
    setError('');

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      console.log('Using token for fetching posts:', token ? token.substring(0, 20) + '...' : 'No token found');

      // Use direct fetch instead of Axios
      const response = await fetch('http://localhost:5000/api/posts/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      console.log('Posts fetched successfully:', data);
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'An error occurred while fetching posts');
    } finally {
      setLoading(false);
    }
  };

  // Open post dialog
  const handleOpenPostDialog = (post) => {
    setSelectedPost(post);
    setPostDialogOpen(true);
    setPostError('');
  };

  // Close post dialog
  const handleClosePostDialog = () => {
    setPostDialogOpen(false);
    setSelectedPost(null);
    setInstagramCredentials({
      username: '',
      password: '',
    });
  };

  // Handle Instagram credentials change
  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setInstagramCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle post to Instagram
  const handlePostToInstagram = async () => {
    if (!selectedPost) return;

    setPostLoading(true);
    setPostError('');

    try {
      await postToInstagram(selectedPost.id, instagramCredentials);
      
      // Update the post in the local state
      setPosts(
        posts.map((post) =>
          post.id === selectedPost.id ? { ...post, is_posted: true } : post
        )
      );
      
      // Close the dialog
      handleClosePostDialog();
    } catch (err) {
      console.error('Error posting to Instagram:', err);
      setPostError(
        err.response?.data?.message || 'An error occurred while posting to Instagram'
      );
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Post History
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          View and manage your Instagram posts
        </Typography>
      </Box>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      ) : posts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No posts yet
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Create your first post to see it here
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/dashboard"
          >
            Create a Post
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <Card className="post-history-item">
                {post.image_path && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={`http://localhost:5000/api/uploads/direct/uploads/${post.image_path}`}
                    alt={post.image_description || 'Post image'}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      console.error(`Error loading image: ${post.image_path}`);
                      // Try with just the basename
                      const basename = post.image_path.split(/[\/\\]/).pop();
                      console.log(`Trying with basename: ${basename}`);
                      e.target.src = `http://localhost:5000/api/uploads/direct/uploads/${basename}`;

                      // Add another error handler for the fallback
                      e.target.onerror = () => {
                        console.error(`Fallback also failed for: ${basename}`);
                        e.target.src = 'https://placehold.co/400x400?text=Image+Not+Found';
                        // Remove the error handler to prevent infinite loop
                        e.target.onerror = null;
                      };
                    }}
                  />
                )}
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      Post
                    </Typography>
                    <Chip
                      icon={post.is_posted ? <CheckCircleIcon /> : <ScheduleIcon />}
                      label={post.is_posted ? 'Posted' : 'Not Posted'}
                      color={post.is_posted ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.image_description}
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.caption}
                  </Typography>

                  <Typography variant="caption" color="textSecondary">
                    Created: {format(new Date(post.created_at), 'MMM d, yyyy, h:mm a')}
                  </Typography>

                  {post.scheduled_at && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      Scheduled: {format(new Date(post.scheduled_at), 'MMM d, yyyy, h:mm a')}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/posts/${post.id}`}
                  >
                    View Details
                  </Button>
                  {!post.is_posted && (
                    <Button
                      size="small"
                      color="primary"
                      startIcon={<InstagramIcon />}
                      onClick={() => handleOpenPostDialog(post)}
                    >
                      Post Now
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Post to Instagram Dialog */}
      <Dialog open={postDialogOpen} onClose={handleClosePostDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Post to Instagram</DialogTitle>
        <DialogContent>
          {selectedPost && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Caption:
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedPost.caption}
              </Typography>

              {postError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {postError}
                </Alert>
              )}

              <Typography variant="subtitle1" gutterBottom>
                Instagram Credentials
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Enter your Instagram credentials to post directly to Instagram
              </Typography>

              <TextField
                fullWidth
                label="Instagram Username"
                name="username"
                value={instagramCredentials.username}
                onChange={handleCredentialsChange}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Instagram Password"
                name="password"
                type="password"
                value={instagramCredentials.password}
                onChange={handleCredentialsChange}
                margin="normal"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClosePostDialog} disabled={postLoading}>
            Cancel
          </Button>
          <Button
            onClick={handlePostToInstagram}
            variant="contained"
            color="primary"
            disabled={
              postLoading ||
              !instagramCredentials.username ||
              !instagramCredentials.password
            }
            startIcon={postLoading ? <CircularProgress size={20} /> : <InstagramIcon />}
          >
            Post to Instagram
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PostHistory;