import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Home as HomeIcon,
  History as HistoryIcon,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import Clock from './Clock';

/**
 * Navigation bar component
 * @param {Object} props - Component props
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {Function} props.onLogout - Function to call when logging out
 * @param {Object} props.user - User object
 * @returns {JSX.Element} - Navbar component
 */
const Navbar = ({ isAuthenticated, onLogout, user }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'grey.100',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                height: 45,
                width: 45,
                mr: 1.5,
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 20px rgba(131, 58, 180, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0))',
                  zIndex: 1,
                }
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'relative', zIndex: 2 }}
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  background: 'linear-gradient(90deg, #405DE6, #833AB4, #C13584)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Instagram Caption Generator
              </Typography>
            </Box>
          </Typography>

          {isAuthenticated ? (
            <>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  startIcon={<HomeIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    color: 'text.primary',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(131, 58, 180, 0.08)',
                    },
                    '&.active': {
                      backgroundColor: 'rgba(131, 58, 180, 0.12)',
                      color: '#833AB4',
                    }
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  component={RouterLink}
                  to="/history"
                  startIcon={<HistoryIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    color: 'text.primary',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(131, 58, 180, 0.08)',
                    },
                    '&.active': {
                      backgroundColor: 'rgba(131, 58, 180, 0.12)',
                      color: '#833AB4',
                    }
                  }}
                >
                  Post History
                </Button>
              </Box>

              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                sx={{
                  ml: 1,
                  border: '2px solid',
                  borderColor: 'rgba(131, 58, 180, 0.2)',
                  p: 0.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(131, 58, 180, 0.5)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    background: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584)',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(131, 58, 180, 0.3)',
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    Signed in as <strong>{user?.username}</strong>
                  </Typography>
                </MenuItem>
                <MenuItem
                  component={RouterLink}
                  to="/dashboard"
                  onClick={handleClose}
                  sx={{ display: { md: 'none' } }}
                >
                  <HomeIcon fontSize="small" sx={{ mr: 1 }} />
                  Dashboard
                </MenuItem>
                <MenuItem
                  component={RouterLink}
                  to="/history"
                  onClick={handleClose}
                  sx={{ display: { md: 'none' } }}
                >
                  <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
                  Post History
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;