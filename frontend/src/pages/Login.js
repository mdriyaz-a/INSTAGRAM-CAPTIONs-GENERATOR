import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { login, setAuthToken } from '../services/authService';

/**
 * Login page component
 * @param {Object} props - Component props
 * @param {Function} props.onLogin - Function to call when login is successful
 * @returns {JSX.Element} - Login page component
 */
const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);

      // Log the token for debugging
      console.log('Login successful, received token:', response.data.access_token.substring(0, 20) + '...');

      // Format the token properly
      const token = response.data.access_token.startsWith('Bearer ')
        ? response.data.access_token
        : `Bearer ${response.data.access_token}`;

      // Store the token in localStorage directly
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage:', token.substring(0, 20) + '...');

      // Call the onLogin handler
      onLogin(token, response.data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 'An error occurred during login'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: { xs: 4, md: 8 },
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: { md: '600px' },
          boxShadow: { md: '0px 8px 40px rgba(0, 0, 0, 0.12)' },
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Left side - Image/Gradient */}
        <Box
          sx={{
            flex: { md: '1 0 45%' },
            background: 'linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            p: 4,
            display: { xs: 'none', md: 'flex' },
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              fontSize: 36,
              fontWeight: 'bold',
            }}
          >
            IG
          </Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Instagram Caption Generator
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ opacity: 0.9, maxWidth: 400 }}>
            Create engaging, creative captions for your Instagram posts with the power of AI
          </Typography>
        </Box>

        {/* Right side - Login Form */}
        <Box
          sx={{
            flex: { md: '1 0 55%' },
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
                mx: 'auto',
              }}
            >
              IG
            </Box>
            <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
              Instagram Caption Generator
            </Typography>
          </Box>

          <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to your account to continue
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                width: '100%',
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{
                py: 1.5,
                mb: 3,
                fontSize: '1rem',
                boxShadow: '0px 8px 16px rgba(64, 93, 230, 0.3)',
                '&:hover': {
                  boxShadow: '0px 12px 20px rgba(64, 93, 230, 0.4)',
                }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;