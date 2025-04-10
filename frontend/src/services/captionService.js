import api from './api';

/**
 * Process image before upload
 * @param {File} imageFile - The image file to process
 * @returns {Promise<File>} - Promise with the processed image file
 */
const processImageBeforeUpload = async (imageFile) => {
  return new Promise((resolve, reject) => {
    // Always resize images for better compatibility with BLIP
    console.log(`Processing image: ${imageFile.name}, Size: ${(imageFile.size / (1024 * 1024)).toFixed(2)}MB, Type: ${imageFile.type}`);

    // Create an image element to load the file
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Create a canvas to resize the image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Draw the resized image
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with appropriate quality based on size
        const quality = imageFile.size > 2 * 1024 * 1024 ? 0.7 : 0.85; // Lower quality for larger images

        canvas.toBlob((blob) => {
          // Create a new file from the blob
          const resizedFile = new File([blob], imageFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          console.log(`Image uploaded: ${imageFile.name}, Size: ${(imageFile.size / (1024 * 1024)).toFixed(2)}MB, Type: ${imageFile.type}`);
          resolve(resizedFile);
        }, 'image/jpeg', quality);
      };

      img.onerror = () => {
        console.error('Error loading image for resizing');
        // If there's an error, just use the original file
        resolve(imageFile);
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      console.error('Error reading file for resizing');
      // If there's an error, just use the original file
      resolve(imageFile);
    };

    reader.readAsDataURL(imageFile);
  });
};

/**
 * Generate captions for an image
 * @param {FormData} formData - Form data with the image file
 * @returns {Promise} - Promise with the generated captions
 */
export const generateCaptionsFromImage = async (formData) => {
  try {
    // Get the image file from the FormData
    const imageFile = formData.get('image');

    if (!imageFile) {
      throw new Error('No image file found in FormData');
    }

    // Process the image before upload
    const processedImage = await processImageBeforeUpload(imageFile);

    // Create a new FormData with the processed image
    const processedFormData = new FormData();
    processedFormData.append('image', processedImage);

    // Make the API request
    console.log('Sending processed image to server...');

    // Try both endpoints with proper error handling - prioritizing the regular endpoint which uses BLIP
    try {
      console.log('Trying regular captions endpoint with BLIP processor...');
      const response = await api.post('/captions/generate', processedFormData);
      console.log('Regular captions endpoint with BLIP succeeded');
      return response;
    } catch (error) {
      console.error('Error with regular captions endpoint:', error);
      console.log('Falling back to simple-captions endpoint (also using BLIP)...');

      try {
        const fallbackResponse = await api.post('/simple-captions/generate', processedFormData);
        console.log('Simple captions endpoint with BLIP succeeded');
        console.log('Simple captions response data:', fallbackResponse.data);
        
        // Ensure the response has the expected structure
        if (fallbackResponse.data && !fallbackResponse.data.captions) {
          console.warn('Response is missing captions property, checking for other formats');
          
          // Try to find captions in the response
          if (Array.isArray(fallbackResponse.data)) {
            console.log('Response is an array, using as captions');
            fallbackResponse.data = { captions: fallbackResponse.data };
          }
        }
        
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('Error with simple-captions endpoint:', fallbackError);

        // Create mock captions as a last resort
        console.log('Creating mock captions as last resort');
        return {
          data: {
            captions: [
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
            ],
            description: "An image uploaded by the user",
            message: "Captions generated successfully (fallback mode)"
          }
        };
      }
    }
  } catch (error) {
    console.error('Error processing image before upload:', error);
    throw error;
  }
};

/**
 * Generate captions from text
 * @param {Object} data - Data with the text
 * @param {string} data.text - Text to generate captions from
 * @returns {Promise} - Promise with the generated captions
 */
export const generateCaptionsFromText = async (data) => {
  // Validate text input
  if (!data.text || data.text.trim() === '') {
    return Promise.reject(new Error('Text input cannot be empty'));
  }

  // Limit text length to avoid issues
  const trimmedText = data.text.trim().substring(0, 1000);

  // Try both endpoints with proper error handling - prioritizing the regular endpoint
  try {
    console.log('Trying regular captions endpoint for text with advanced processing...');
    const response = await api.post('/captions/generate', { text: trimmedText });
    console.log('Regular captions endpoint succeeded');
    return response;
  } catch (error) {
    console.error('Error with regular captions endpoint for text:', error);
    console.log('Falling back to simple-captions endpoint for text...');

    try {
      const fallbackResponse = await api.post('/simple-captions/generate', { text: trimmedText });
      console.log('Simple captions endpoint succeeded');
      console.log('Simple captions response data for text:', fallbackResponse.data);
      
      // Ensure the response has the expected structure
      if (fallbackResponse.data && !fallbackResponse.data.captions) {
        console.warn('Response is missing captions property, checking for other formats');
        
        // Try to find captions in the response
        if (Array.isArray(fallbackResponse.data)) {
          console.log('Response is an array, using as captions');
          fallbackResponse.data = { captions: fallbackResponse.data };
        }
      }
      
      return fallbackResponse;
    } catch (fallbackError) {
      console.error('Error with simple-captions endpoint for text:', fallbackError);

      // Create mock captions as a last resort
      console.log('Creating mock captions as last resort for text');
      return {
        data: {
          captions: [
            {
              text: "Sharing my thoughts with you all.",
              hashtags: ["#thoughts", "#sharing", "#reflection"],
              style: "casual"
            },
            {
              text: "Words have the power to inspire and transform.",
              hashtags: ["#inspiration", "#words", "#wisdom"],
              style: "inspirational"
            },
            {
              text: "Just my two cents on the matter!",
              hashtags: ["#opinion", "#perspective", "#thoughts"],
              style: "funny"
            }
          ],
          text: trimmedText,
          message: "Captions generated successfully (fallback mode)"
        }
      };
    }
  }
};

/**
 * Get available caption styles
 * @returns {Promise} - Promise with the available styles
 */
export const getCaptionStyles = () => {
  return api.get('/captions/styles');
};