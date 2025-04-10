import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Instagram as InstagramIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { getPost, postToInstagram, deletePost } from '../services/postService';

/**
 * Post detail page component
 * @param {Object} props - Component props
 * @param {Object} props.user - User object
 * @returns {JSX.Element} - Post detail page component
 */
const PostDetail = ({ user }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instagramCredentials, setInstagramCredentials] = useState({
    username: '',
    password: '',
  });
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch post on component mount
  useEffect(() => {
    fetchPost();
  }, [postId]);

  // Fetch post from the API
  const fetchPost = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getPost(postId);
      setPost(response.data);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(
        err.response?.data?.message || 'An error occurred while fetching the post'
      );
    } finally {
      setLoading(false);
    }
  };

  // Open post dialog
  const handleOpenPostDialog = () => {
    setPostDialogOpen(true);
    setPostError('');
  };

  // Close post dialog
  const handleClosePostDialog = () => {
    setPostDialogOpen(false);
    setInstagramCredentials({
      username: '',
      password: '',
    });
  };

  // Open delete dialog
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
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
    setPostLoading(true);
    setPostError('');

    try {
      await postToInstagram(post.id, instagramCredentials);
      
      // Update the post in the local state
      setPost({ ...post, is_posted: true });
      
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

  // Handle delete post
  const handleDeletePost = async () => {
    setDeleteLoading(true);

    try {
      await deletePost(post.id);
      
      // Navigate back to post history
      navigate('/history');
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(
        err.response?.data?.message || 'An error occurred while deleting the post'
      );
      setDeleteLoading(false);
      handleCloseDeleteDialog();
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to="/history"
          >
            Back to Post History
          </Button>
        </Box>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Post not found
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to="/history"
          >
            Back to Post History
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to="/history"
          sx={{ mb: 2 }}
        >
          Back to Post History
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Post Details
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={4}>
          {post.image_path && (
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={`/api/uploads/${post.image_path.split('/').pop()}`}
                alt={post.image_description || 'Post image'}
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 2,
                  boxShadow: 2,
                }}
              />
            </Grid>
          )}
          <Grid item xs={12} md={post.image_path ? 6 : 12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Instagram Post
              </Typography>
              <Chip
                icon={post.is_posted ? <CheckCircleIcon /> : <ScheduleIcon />}
                label={post.is_posted ? 'Posted' : 'Not Posted'}
                color={post.is_posted ? 'success' : 'default'}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {post.image_description && (
              <>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Image Description:
                </Typography>
                <Typography variant="body1" paragraph>
                  {post.image_description}
                </Typography>
              </>
            )}

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Caption:
            </Typography>
            <Typography variant="body1" paragraph>
              {post.caption}
            </Typography>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Details:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Created: {format(new Date(post.created_at), 'MMM d, yyyy, h:mm a')}
            </Typography>
            {post.updated_at && (
              <Typography variant="body2" color="textSecondary">
                Last Updated: {format(new Date(post.updated_at), 'MMM d, yyyy, h:mm a')}
              </Typography>
            )}
            {post.scheduled_at && (
              <Typography variant="body2" color="textSecondary">
                Scheduled: {format(new Date(post.scheduled_at), 'MMM d, yyyy, h:mm a')}
              </Typography>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              {!post.is_posted && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<InstagramIcon />}
                  onClick={handleOpenPostDialog}
                >
                  Post to Instagram
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleOpenDeleteDialog}
              >
                Delete Post
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Post to Instagram Dialog */}
      <Dialog open={postDialogOpen} onClose={handleClosePostDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Post to Instagram</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Caption:
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {post.caption}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeletePost}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PostDetail;