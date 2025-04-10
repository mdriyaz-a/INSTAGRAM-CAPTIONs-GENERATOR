import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

/**
 * Image uploader component with drag and drop functionality
 * @param {Object} props - Component props
 * @param {Function} props.onImageUpload - Function to call when an image is uploaded
 * @param {boolean} props.loading - Whether the component is in a loading state
 * @returns {JSX.Element} - Image uploader component
 */
const ImageUploader = ({ onImageUpload, loading }) => {
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      // Handle rejected files (wrong type, too many, etc.)
      if (rejectedFiles && rejectedFiles.length > 0) {
        const rejectedFile = rejectedFiles[0];
        if (rejectedFile.errors) {
          const error = rejectedFile.errors[0];
          if (error.code === 'file-invalid-type') {
            console.error('Invalid file type:', error.message);
            // We don't need to show an error here as the parent component will handle it
          } else if (error.code === 'file-too-large') {
            console.error('File too large:', error.message);
            // We don't need to show an error here as the parent component will handle it
          }
        }
        return;
      }

      // Handle accepted files
      const file = acceptedFiles[0];
      if (file) {
        console.log(`Processing file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`);

        // Create a preview URL for the image
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Call the onImageUpload callback with the file
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024, // 15MB max size (we'll resize it later)
    disabled: loading,
  });

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom fontWeight="medium">
        Upload an image for caption generation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        We'll analyze your image and generate creative captions based on its content
      </Typography>

      <Paper
        {...getRootProps()}
        className="dropzone"
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          border: '2px dashed',
          borderColor: isDragReject
            ? 'error.main'
            : isDragActive
              ? 'primary.main'
              : 'grey.200',
          borderRadius: 4,
          bgcolor: isDragReject
            ? 'rgba(211, 47, 47, 0.04)'
            : isDragActive
              ? 'rgba(64, 93, 230, 0.04)'
              : 'background.paper',
          textAlign: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: isDragReject ? 'error.main' : 'primary.main',
            bgcolor: isDragReject
              ? 'rgba(211, 47, 47, 0.04)'
              : 'rgba(64, 93, 230, 0.04)',
            transform: loading ? 'none' : 'translateY(-5px)',
            boxShadow: loading ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.08)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'radial-gradient(circle at top right, rgba(193,53,132,0.03) 0%, rgba(193,53,132,0) 70%)',
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'radial-gradient(circle at bottom left, rgba(64,93,230,0.03) 0%, rgba(64,93,230,0) 70%)',
            zIndex: 0,
          },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {loading ? (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Box sx={{ position: 'relative', mb: 4 }}>
                <CircularProgress
                  size={70}
                  sx={{
                    color: 'primary.main',
                    opacity: 0.3,
                  }}
                />
                <CircularProgress
                  size={70}
                  sx={{
                    color: '#C13584',
                    position: 'absolute',
                    left: 0,
                    animationDuration: '1.2s',
                  }}
                />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Processing image...
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                We're analyzing your image to generate the best captions for your Instagram post
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(64, 93, 230, 0.1), rgba(193, 53, 132, 0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 4,
                  mx: 'auto',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  border: '1px solid',
                  borderColor: 'rgba(64, 93, 230, 0.1)',
                  transition: 'all 0.3s ease',
                  transform: isDragActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <CloudUploadIcon
                  sx={{
                    fontSize: 50,
                    color: isDragActive ? '#833AB4' : 'primary.main',
                    transition: 'all 0.3s ease',
                  }}
                />
              </Box>
              {isDragReject ? (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, color: 'error.main' }}>
                  File type not supported!
                </Typography>
              ) : isDragActive ? (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, color: '#833AB4' }}>
                  Drop your image here...
                </Typography>
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
                  Drag & drop your image here
                </Typography>
              )}
              <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem' }}>
                or <span style={{
                  color: '#833AB4',
                  fontWeight: 600,
                  padding: '4px 12px',
                  background: 'rgba(131, 58, 180, 0.08)',
                  borderRadius: '20px',
                }}>browse files</span> from your computer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{
                display: 'inline-block',
                px: 2,
                py: 1,
                borderRadius: 10,
                bgcolor: 'rgba(0, 0, 0, 0.03)',
              }}>
                Supported formats: JPEG, PNG, GIF • Max size: 10MB
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {preview && !loading && (
        <Box
          sx={{
            mt: 5,
            p: 0,
            borderRadius: 4,
            bgcolor: 'background.paper',
            overflow: 'hidden',
            boxShadow: '0 15px 50px rgba(0, 0, 0, 0.08)',
            border: '1px solid',
            borderColor: 'grey.100',
            position: 'relative',
          }}
        >
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C)',
            zIndex: 1,
          }} />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
            }}
          >
            <Box
              sx={{
                flex: { xs: '1', md: '0 0 45%' },
                position: 'relative',
                bgcolor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                minHeight: { xs: '250px', md: 'auto' },
              }}
            >
              <Box
                component="img"
                src={preview}
                alt="Preview"
                className="image-preview"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 400,
                  borderRadius: 2,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  objectFit: 'contain',
                }}
              />
            </Box>

            <Box
              sx={{
                flex: { xs: '1', md: '0 0 55%' },
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom color="#833AB4">
                Image Ready for Caption Generation
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.7 }}>
                Your image has been uploaded successfully and is ready for caption generation. Click the "Generate Captions" button below to create engaging Instagram captions based on this image.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => {
                    setPreview(null);
                    onImageUpload(null);
                  }}
                  disabled={loading}
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: 'grey.300',
                    color: 'text.primary',
                    px: 3,
                    py: 1.5,
                    '&:hover': {
                      borderColor: 'grey.400',
                      bgcolor: 'rgba(0, 0, 0, 0.01)',
                    }
                  }}
                >
                  Change Image
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploader;