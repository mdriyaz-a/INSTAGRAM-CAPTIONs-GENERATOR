import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { format } from 'date-fns';

import ImageUploader from '../components/ImageUploader';
import CaptionCard from '../components/CaptionCard';
import { generateCaptionsFromImage, generateCaptionsFromText } from '../services/captionService';
import { createPost } from '../services/postService';
import { setInstagramCredentials } from '../services/authService';

/**
 * Dashboard page component
 * @param {Object} props - Component props
 * @param {Object} props.user - User object
 * @returns {JSX.Element} - Dashboard page component
 */
const Dashboard = ({ user }) => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Input states
  const [imageFile, setImageFile] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Caption states
  const [imageDescription, setImageDescription] = useState('');
  const [captions, setCaptions] = useState([]);
  const [selectedCaption, setSelectedCaption] = useState(null);

  // Posting states
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postType, setPostType] = useState('post'); // Only 'post' type is supported
  const [postToInstagram, setPostToInstagram] = useState(false);
  const [instagramCredentials, setInstagramCredentials] = useState({
    instagram_username: '',
    instagram_password: '',
  });
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset states when changing tabs
    setImageFile(null);
    setText('');
    setImageDescription('');
    setCaptions([]);
    setSelectedCaption(null);
    setError('');
  };

  // Handle image upload
  const handleImageUpload = (file) => {
    // If file is null, it means we're clearing the image
    if (file === null) {
      setImageFile(null);
      setImageDescription('');
      setCaptions([]);
      setSelectedCaption(null);

      // Clear any previous errors
      if (error) {
        setError('');
      }

      console.log('Image cleared');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, or GIF image.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB. The image will be resized during upload.');
    }

    setImageFile(file);
    // Reset states when uploading a new image
    setImageDescription('');
    setCaptions([]);
    setSelectedCaption(null);

    // Clear any previous errors
    if (error) {
      setError('');
    }

    console.log(`Image uploaded: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`);
  };

  // Handle text input
  const handleTextChange = (e) => {
    setText(e.target.value);
    // Reset captions when changing text
    setCaptions([]);
    setSelectedCaption(null);
  };

  // Helper function to process captions from API response
  const processCaptionsResponse = (responseData) => {
    console.log('Processing captions from response:', responseData);
    
    if (responseData.captions) {
      // Handle nested captions structure (from regular endpoint)
      if (responseData.captions.captions && Array.isArray(responseData.captions.captions)) {
        console.log('Found nested captions array:', responseData.captions.captions);
        return responseData.captions.captions;
      } 
      // Handle direct array of captions
      else if (Array.isArray(responseData.captions)) {
        console.log('Found direct captions array:', responseData.captions);
        return responseData.captions;
      }
      // Handle captions object with captions property that's not an array
      else if (typeof responseData.captions === 'object') {
        console.log('Found captions object:', responseData.captions);
        // Try to extract captions from the object
        if (responseData.captions.captions) {
          console.log('Extracted captions from object:', responseData.captions.captions);
          return Array.isArray(responseData.captions.captions) 
            ? responseData.captions.captions 
            : [responseData.captions.captions];
        }
      }
    }
    
    // If we still don't have captions, check for fallback captions
    if ((!responseData.captions || 
        (responseData.captions && Array.isArray(responseData.captions) && responseData.captions.length === 0)) && 
        responseData.fallback === true) {
      console.log('Using fallback captions');
      return [
        {
          style: "casual",
          text: "Just vibing with this moment! Life's simple pleasures.",
          hashtags: ["#GoodVibes", "#InstaDaily", "#LifeIsGood"],
          emojis: ["😊", "✌️", "🌟"]
        },
        {
          style: "poetic",
          text: "In the gentle whispers of this scene, I found a piece of my soul.",
          hashtags: ["#SoulfulMoments", "#Poetry", "#DeepThoughts"],
          emojis: ["🌹", "✨", "💫"]
        },
        {
          style: "humorous",
          text: "When this view is your therapy! No regrets, just good times.",
          hashtags: ["#NoFilter", "#JustForLaughs", "#WeekendVibes"],
          emojis: ["😂", "🤣", "🙌"]
        }
      ];
    }
    
    return [];
  };

  // Generate captions
  const handleGenerateCaptions = async () => {
    setError('');
    setLoading(true);
    setCaptions([]);
    setImageDescription('');
    setSelectedCaption(null);

    try {
      if (tabValue === 0 && imageFile) {
        // Check file size
        if (imageFile.size > 10 * 1024 * 1024) { // 10MB limit
          setError('Image file is too large. Maximum size is 10MB.');
          setLoading(false);
          return;
        }

        // Generate captions from image
        const formData = new FormData();
        formData.append('image', imageFile);

        console.log('Sending image for caption generation...');
        const response = await generateCaptionsFromImage(formData);
        console.log('Received response:', response.data);

        if (response.data.description) {
          setImageDescription(response.data.description);
        }

        // Store the image path if it's returned from the server
        if (response.data.image_path) {
          setImageFile({
            ...imageFile,
            path: response.data.image_path
          });
          console.log('Image path set to:', response.data.image_path);
        }

        const processedCaptions = processCaptionsResponse(response.data);
        if (processedCaptions.length > 0) {
          setCaptions(processedCaptions);
        } else {
          setError('Could not process captions from the server response');
        }
      } else if (tabValue === 1 && text) {
        if (text.trim() === '') {
          setError('Please enter some text to generate captions');
          setLoading(false);
          return;
        }

        // Generate captions from text
        console.log('Sending text for caption generation:', text);
        const response = await generateCaptionsFromText({ text });
        console.log('Received response:', response.data);

        setImageDescription(text);

        const processedCaptions = processCaptionsResponse(response.data);
        if (processedCaptions.length > 0) {
          setCaptions(processedCaptions);
        } else {
          setError('Could not process captions from the server response');
        }
      } else {
        setError('Please upload an image or enter text first');
      }
    } catch (err) {
      console.error('Error generating captions:', err);

      // Try to use the simple captions endpoint as a fallback
      try {
        console.log('Attempting to use fallback caption generation...');

        // Create mock captions as a last resort
        const mockCaptions = [
          {
            text: "A beautiful moment captured in time.",
            hashtags: ["#photography", "#moment", "#beautiful"],
            style: "casual"
          },
          {
            text: "Every picture tells a story.",
            hashtags: ["#story", "#picture", "#memories"],
            style: "inspirational"
          },
          {
            text: "Life is better with good photos!",
            hashtags: ["#goodvibes", "#photooftheday", "#lifestyle"],
            style: "funny"
          }
        ];

        setCaptions(mockCaptions);

        if (tabValue === 0) {
          setImageDescription("An image uploaded by the user");
        } else {
          setImageDescription(text || "Text provided by the user");
        }

        // Show a warning instead of an error
        setError('Using fallback captions due to server issues. These are generic captions.');
      } catch (fallbackErr) {
        // If even the fallback fails, show the original error
        if (err.response) {
          // The request was made and the server responded with a status code
          console.error('Server error data:', err.response.data);
          console.error('Server error status:', err.response.status);

          if (err.response.status === 413) {
            setError('Image file is too large. Please use a smaller image.');
          } else if (err.response.status === 422) {
            setError('The server could not process your request. Please try a different image or text.');
          } else {
            setError(err.response.data.message || 'Server error. Please try again later.');
          }
        } else if (err.request) {
          // The request was made but no response was received
          console.error('No response received:', err.request);
          setError('No response from server. Please check your internet connection and try again.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', err.message);
          setError('An error occurred while sending your request. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle caption selection
  const handleSelectCaption = (caption) => {
    setSelectedCaption(caption);
  };

  // Handle caption edit
  const handleEditCaption = (editedCaption) => {
    setCaptions(
      captions.map((caption) =>
        caption.style === editedCaption.style ? editedCaption : caption
      )
    );
    if (selectedCaption?.style === editedCaption.style) {
      setSelectedCaption(editedCaption);
    }
  };

  // Open post dialog
  const handleOpenPostDialog = () => {
    if (!selectedCaption) {
      setError('Please select a caption first');
      return;
    }
    setPostDialogOpen(true);
  };

  // Close post dialog
  const handleClosePostDialog = () => {
    setPostDialogOpen(false);
  };

  // Handle post creation
  const handleCreatePost = async () => {
    setPostLoading(true);

    try {
      // Get the image path if available
      let imagePath = null;
      if (tabValue === 0 && imageFile) {
        imagePath = imageFile.path || null;
        console.log('Using image path for post:', imagePath);
      }

      const postData = {
        image_path: imagePath,
        image_description: imageDescription,
        caption: `${selectedCaption.text} ${selectedCaption.hashtags?.join(' ') || ''}`,
        post_type: postType,
      };

      // No scheduling support

      // Add Instagram credentials if posting to Instagram is enabled
      if (postToInstagram) {
        if (instagramCredentials.instagram_username && instagramCredentials.instagram_password) {
          // Format the credentials correctly for the backend
          postData.instagram_credentials = {
            username: instagramCredentials.instagram_username,
            password: instagramCredentials.instagram_password
          };

          console.log('Instagram credentials provided:',
                     `username: ${instagramCredentials.instagram_username}, ` +
                     `password: ${instagramCredentials.instagram_password ? '********' : 'not provided'}`);

          // Save credentials if requested
          if (saveCredentials) {
            await setInstagramCredentials(instagramCredentials);
          }
        } else {
          // Alert the user that they need to provide Instagram credentials
          setError('Please provide both Instagram username and password to post to Instagram');
          setPostLoading(false);
          return; // Stop the post creation process
        }
      } else {
        // If not posting to Instagram, set credentials to null
        postData.instagram_credentials = null;
        console.log('Not posting to Instagram');
      }

      // Get the token from localStorage
      const token = localStorage.getItem('token');
      console.log('Using token for post creation:', token ? token.substring(0, 20) + '...' : 'No token found');

      // Create a direct fetch request to ensure the token is sent correctly
      const response = await fetch('/api/posts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }

      const data = await response.json();

      // Show success message
      let successMessage = 'Post created successfully';
      let severity = 'success';

      // Add Instagram posting status if applicable
      if (postToInstagram && data.instagram_status) {
        if (data.instagram_status === 'queued') {
          successMessage += ' Instagram posting has been queued.';
        } else if (data.instagram_status === 'success') {
          successMessage += ' Successfully posted to Instagram.';
        } else if (data.instagram_status === 'failed') {
          successMessage += ' Failed to post to Instagram. This could be due to:';
          successMessage += '\n- Invalid Instagram credentials';
          successMessage += '\n- Instagram security measures (try again later)';
          successMessage += '\n- Issues with the image format';
          severity = 'warning';

          // Set error for more visibility
          setError('Instagram posting failed. Please check your credentials and try again later.');
        } else if (data.instagram_status === 'error') {
          successMessage += ' Error posting to Instagram: ' + (data.instagram_error || 'Unknown error');
          severity = 'warning';
        } else if (data.instagram_status === 'skipped') {
          successMessage += ' Instagram posting was skipped due to missing credentials.';
          severity = 'info';
        } else if (data.instagram_status === 'not_requested') {
          // Don't add anything for not_requested
        } else {
          successMessage += ` Instagram status: ${data.instagram_status}`;
        }
      }

      setSnackbarMessage(successMessage);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);

      // Reset states
      setImageFile(null);
      setText('');
      setImageDescription('');
      setCaptions([]);
      setSelectedCaption(null);
      setPostDialogOpen(false);
    } catch (err) {
      console.error('Error creating post:', err);

      // Handle specific error cases
      if (err.message && err.message.includes('Instagram')) {
        setError(
          'Error posting to Instagram: ' + err.message +
          ' Please check your Instagram credentials and try again.'
        );
      } else {
        setError(
          err.message || 'An error occurred while creating the post'
        );
      }
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          mt: 6,
          mb: 8,
          textAlign: 'center',
          maxWidth: 900,
          mx: 'auto',
          position: 'relative',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(64,93,230,0.1) 0%, rgba(64,93,230,0) 70%)',
            borderRadius: '50%',
            top: '-50px',
            left: '-50px',
            zIndex: -1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(193,53,132,0.1) 0%, rgba(193,53,132,0) 70%)',
            borderRadius: '50%',
            bottom: '-30px',
            right: '10%',
            zIndex: -1,
          }}
        />

        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          fontWeight="900"
          sx={{
            background: 'linear-gradient(90deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            letterSpacing: '-0.02em',
            textShadow: '0 10px 30px rgba(0,0,0,0.05)',
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
          }}
        >
          Instagram Caption Generator
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 5,
            color: 'text.secondary',
            maxWidth: '700px',
            mx: 'auto',
            lineHeight: 1.6,
            fontSize: { xs: '1rem', md: '1.25rem' },
          }}
        >
          Create engaging, creative captions for your Instagram posts with the power of AI
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          mb: 8,
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.07)',
          border: '1px solid',
          borderColor: 'grey.100',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)',
            zIndex: 1,
          }
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '4px 4px 0 0',
              background: 'linear-gradient(90deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)',
            },
            '& .MuiTab-root': {
              py: 3,
              px: 5,
              fontSize: '1.1rem',
              fontWeight: 700,
              textTransform: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: 'primary.main',
                opacity: 1,
              },
              '&.Mui-selected': {
                color: '#833AB4',
              }
            },
            borderBottom: '1px solid',
            borderColor: 'grey.100',
          }}
        >
          <Tab
            label="Upload Image"
            icon={<Box component="span" sx={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              bgcolor: '#405DE6',
              mr: 1,
              verticalAlign: 'middle',
              transform: tabValue === 0 ? 'scale(1.5)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }} />}
            iconPosition="start"
          />
          <Tab
            label="Enter Text"
            icon={<Box component="span" sx={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              bgcolor: '#C13584',
              mr: 1,
              verticalAlign: 'middle',
              transform: tabValue === 1 ? 'scale(1.5)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }} />}
            iconPosition="start"
          />
        </Tabs>

        <Box
          sx={{
            p: { xs: 3, sm: 5, md: 6 },
            bgcolor: 'background.paper',
          }}
        >
          {tabValue === 0 ? (
            <ImageUploader onImageUpload={handleImageUpload} loading={loading} />
          ) : (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                What would you like to create a caption for?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Describe your photo or what you want to post about
              </Typography>
              <TextField
                fullWidth
                placeholder="E.g., A beautiful sunset at the beach with palm trees silhouetted against the orange sky"
                multiline
                rows={4}
                value={text}
                onChange={handleTextChange}
                variant="outlined"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={handleGenerateCaptions}
            disabled={loading || (tabValue === 0 && !imageFile) || (tabValue === 1 && !text)}
            size="large"
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: 3,
              background: 'linear-gradient(90deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)',
              boxShadow: '0px 10px 30px rgba(131, 58, 180, 0.3)',
              '&:hover': {
                boxShadow: '0px 15px 35px rgba(131, 58, 180, 0.4)',
                background: 'linear-gradient(90deg, #3951CC, #4A48C4, #7434A3, #B02F76, #D12A62)',
              },
              display: 'flex',
              mx: 'auto',
              minWidth: 250,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
                transform: 'translateX(-100%)',
                transition: 'transform 0.6s ease',
              },
              '&:hover::after': {
                transform: 'translateX(100%)',
              },
              '&:disabled': {
                background: 'linear-gradient(90deg, #a0a0a0, #c0c0c0)',
                boxShadow: 'none',
              }
            }}
          >
            {loading ? (
              <>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                  <CircularProgress size={24} color="inherit" />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: 'white',
                      }}
                    />
                  </Box>
                </Box>
                Processing...
              </>
            ) : (
              <>Generate Creative Captions</>
            )}
          </Button>
        </Box>
      </Paper>

      {imageDescription && (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            mb: 8,
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.05)',
            border: '1px solid',
            borderColor: 'grey.100',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '6px',
            height: '100%',
            background: 'linear-gradient(180deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)',
          }} />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #405DE6, #C13584)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 8px 20px rgba(131, 58, 180, 0.2)',
              }}
            >
              <Typography
                variant="body1"
                fontWeight="bold"
                color="white"
                sx={{ fontSize: '1.2rem' }}
              >
                AI
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight="800"
              sx={{
                background: 'linear-gradient(90deg, #405DE6, #833AB4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {tabValue === 0 ? 'Image Analysis' : 'Content Analysis'}
            </Typography>
          </Box>

          <Box sx={{
            position: 'relative',
            p: 4,
            bgcolor: 'rgba(131, 58, 180, 0.03)',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(131, 58, 180, 0.1)',
          }}>
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.8,
                fontStyle: 'italic',
                color: 'text.primary',
                fontSize: '1.1rem',
                position: 'relative',
                pl: 4,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '-10px',
                  fontSize: '3rem',
                  color: 'rgba(131, 58, 180, 0.2)',
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1,
                }
              }}
            >
              {imageDescription}
            </Typography>
          </Box>
        </Paper>
      )}

      {captions.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: 800,
              mx: 'auto',
              mb: 5,
            }}
          >
            <Typography
              variant="h3"
              fontWeight="900"
              gutterBottom
              sx={{
                background: 'linear-gradient(90deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                position: 'relative',
                display: 'inline-block',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -10,
                  left: '25%',
                  width: '50%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #405DE6, #C13584)',
                  borderRadius: '2px',
                }
              }}
            >
              Your Generated Captions
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 2,
                fontSize: '1.1rem',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Choose the caption style that best fits your content. You can edit any caption before selecting.
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 3,
                py: 1.5,
                borderRadius: 10,
                bgcolor: 'rgba(131, 58, 180, 0.05)',
                border: '1px solid',
                borderColor: 'rgba(131, 58, 180, 0.1)',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#833AB4',
                  fontWeight: 500,
                }}
              >
                Each caption includes suggested hashtags and formatting tips to maximize engagement
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={4}>
            {captions.map((caption, index) => (
              <Grid item xs={12} md={6} key={index}
                sx={{
                  transform: `translateY(${index % 2 === 0 ? '0' : '20px'})`,
                  transition: 'transform 0.5s ease',
                  '@media (max-width: 960px)': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                <CaptionCard
                  caption={caption}
                  isSelected={selectedCaption?.style === caption.style}
                  onSelect={handleSelectCaption}
                  onEdit={handleEditCaption}
                />
              </Grid>
            ))}
          </Grid>

          {selectedCaption && (
            <Box
              sx={{
                mt: 5,
                textAlign: 'center',
                p: 4,
                borderRadius: 4,
                bgcolor: 'rgba(64, 93, 230, 0.05)',
                border: '1px dashed',
                borderColor: 'primary.main',
              }}
            >
              {tabValue === 0 ? (
                <>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary.main"
                    gutterBottom
                  >
                    Ready to post your caption to Instagram?
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
                  >
                    You've selected the {selectedCaption.style} style caption. Continue to set up your Instagram post.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleOpenPostDialog}
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      boxShadow: '0px 8px 16px rgba(64, 93, 230, 0.3)',
                      '&:hover': {
                        boxShadow: '0px 12px 20px rgba(64, 93, 230, 0.4)',
                      },
                    }}
                  >
                    Continue to Post
                  </Button>
                </>
              ) : (
                <>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary.main"
                    gutterBottom
                  >
                    Caption Selected
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-block',
                      bgcolor: 'rgba(64, 93, 230, 0.1)',
                      px: 3,
                      py: 2,
                      borderRadius: 2,
                      mb: 2
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        fontStyle: 'italic',
                        color: 'text.primary'
                      }}
                    >
                      "{selectedCaption.text}"
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mt: 1,
                        color: 'primary.main',
                        textTransform: 'capitalize'
                      }}
                    >
                      {selectedCaption.style} style
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Post Dialog */}
      <Dialog open={postDialogOpen} onClose={handleClosePostDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Post to Instagram</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Selected Caption:
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {selectedCaption?.text}{' '}
              {selectedCaption?.hashtags?.join(' ') || ''}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Post Type</InputLabel>
              <Select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                label="Post Type"
              >
                <MenuItem value="post">Regular Post</MenuItem>
              </Select>
            </FormControl>

            {/* Scheduling removed */}

            <Divider sx={{ my: 3 }} />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Post to Instagram</InputLabel>
              <Select
                value={postToInstagram ? 'yes' : 'no'}
                onChange={(e) => {
                  const newValue = e.target.value === 'yes';
                  setPostToInstagram(newValue);

                  if (!newValue) {
                    // If user selects "no", clear credentials
                    setInstagramCredentials({
                      instagram_username: '',
                      instagram_password: ''
                    });
                  }
                }}
                label="Post to Instagram"
              >
                <MenuItem value="yes">Yes, post to Instagram</MenuItem>
                <MenuItem value="no">No, save to dashboard only</MenuItem>
              </Select>
            </FormControl>

            {/* Show Instagram credentials section when "Yes" is selected */}
            {postToInstagram ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Instagram Credentials
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Enter your Instagram credentials to post directly to Instagram
                </Typography>

                <TextField
                  fullWidth
                  label="Instagram Username"
                  value={instagramCredentials.instagram_username}
                  onChange={(e) =>
                    setInstagramCredentials({
                      ...instagramCredentials,
                      instagram_username: e.target.value,
                    })
                  }
                  margin="normal"
                />

                <TextField
                  fullWidth
                  label="Instagram Password"
                  type="password"
                  value={instagramCredentials.instagram_password}
                  onChange={(e) =>
                    setInstagramCredentials({
                      ...instagramCredentials,
                      instagram_password: e.target.value,
                    })
                  }
                  margin="normal"
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth>
                  <InputLabel>Save Credentials</InputLabel>
                  <Select
                    value={saveCredentials ? 'yes' : 'no'}
                    onChange={(e) => setSaveCredentials(e.target.value === 'yes')}
                    label="Save Credentials"
                  >
                    <MenuItem value="yes">Yes, save for future posts</MenuItem>
                    <MenuItem value="no">No, use only for this post</MenuItem>
                  </Select>
                </FormControl>
              </>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClosePostDialog} disabled={postLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            color="primary"
            disabled={postLoading}
          >
            {postLoading ? <CircularProgress size={24} /> : 'Create Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%', whiteSpace: 'pre-line' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;