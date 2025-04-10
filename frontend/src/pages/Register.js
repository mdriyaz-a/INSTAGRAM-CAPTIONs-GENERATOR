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
import { register, setAuthToken } from '../services/authService';

/**
 * Register page component
 * @param {Object} props - Component props
 * @param {Function} props.onRegister - Function to call when registration is successful
 * @returns {JSX.Element} - Register page component
 */
const Register = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        username: formData.username,
        password: formData.password,
      });
      onRegister(response.data.access_token, response.data.user);
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 'An error occurred during registration'
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
          height: { md: '650px' },
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

        {/* Right side - Register Form */}
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
            Create Account
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign up to start generating creative captions
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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              helperText="Password must be at least 6 characters long"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              error={
                !!(formData.confirmPassword &&
                formData.password !== formData.confirmPassword)
              }
              helperText={
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword
                  ? 'Passwords do not match'
                  : ''
              }
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
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;