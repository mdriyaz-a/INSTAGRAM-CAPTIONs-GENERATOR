import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Import components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostHistory from './pages/PostHistory';
import PostDetail from './pages/PostDetail';

// Import services
import { getProfile, setAuthToken, getAuthToken, isAuthenticated as checkIsAuthenticated } from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = getAuthToken();
    if (token) {
      console.log('Found token in localStorage, setting it in API headers');
      // Ensure the token is set in API headers
      import('./services/api').then(apiModule => {
        const api = apiModule.default;
        api.defaults.headers.common['Authorization'] = token;
        console.log('Token set in API headers on app load');
        checkAuth();
      });
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const response = await getProfile();
      setUser(response.data);
      setIsAuthenticated(true);
      console.log('User authenticated:', response.data);
    } catch (error) {
      console.error('Authentication error:', error);
      // Clear the token
      setAuthToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token, userData) => {
    console.log('Logging in user:', userData);
    // Store the token
    setAuthToken(token);

    // Ensure the token is set in API headers
    import('./services/api').then(apiModule => {
      const api = apiModule.default;
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = formattedToken;
      console.log('Token set in API headers on login');

      setUser(userData);
      setIsAuthenticated(true);
      navigate('/dashboard');
    });
  };

  const handleLogout = () => {
    console.log('Logging out user');
    // Clear the token
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="App">
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} user={user} />
      <Box sx={{ padding: 3 }}>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register onRegister={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/history"
            element={
              isAuthenticated ? (
                <PostHistory user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/posts/:postId"
            element={
              isAuthenticated ? (
                <PostDetail user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
          />
        </Routes>
      </Box>
    </div>
  );
}

export default App;