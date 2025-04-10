import os
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch

class ImageProcessor:
    """Class for processing images and generating descriptions."""
    
    def __init__(self, upload_folder):
        """Initialize the image processor with the upload folder."""
        self.upload_folder = upload_folder
        # Load the BLIP model for image captioning
        self.processor = None
        self.model = None
    
    def _load_model(self):
        """Lazy load the BLIP model to save resources."""
        try:
            if self.processor is None or self.model is None:
                print("Loading BLIP model...")
                self.processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
                self.model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
                print("BLIP model loaded successfully")
        except Exception as e:
            print(f"Error loading BLIP model: {e}")
            # Set to None to indicate loading failed
            self.processor = None
            self.model = None
            raise

    def save_image(self, image_file, filename):
        """Save the uploaded image to the upload folder."""
        try:
            # Ensure the upload folder exists
            os.makedirs(self.upload_folder, exist_ok=True)

            # Create the full path
            image_path = os.path.join(self.upload_folder, filename)

            # Save the image
            image_file.save(image_path)

            print(f"Image saved successfully at: {image_path}")
            return image_path
        except Exception as e:
            print(f"Error saving image: {e}")
            raise

    def get_image_description(self, image_path):
        """Generate a description of the image using the BLIP model."""
        try:
            # Check if the image exists
            if not os.path.exists(image_path):
                print(f"Image not found at path: {image_path}")
                return "An image that could not be found"

            # Try to load the model
            try:
                self._load_model()
            except Exception as e:
                print(f"Could not load BLIP model, using fallback description: {e}")
                return "A beautiful image"

            # If model loading failed, return a generic description
            if self.processor is None or self.model is None:
                return "A beautiful image"

            # Open and convert the image to RGB
            image = Image.open(image_path).convert("RGB")

            # Process the image and generate a description
            inputs = self.processor(image, return_tensors="pt")

            # Generate the caption
            with torch.no_grad():
                output = self.model.generate(**inputs)

            # Decode the output to get the description
            description = self.processor.decode(output[0], skip_special_tokens=True)

            print(f"Generated image description: {description}")
            return description
        except Exception as e:
            print(f"Error generating image description: {e}")
            return "A beautiful image"
    
    def convert_to_instagram_size(self, image_path):
        """
        Convert the given image to an Instagram-compatible size by center-cropping it to a square
        and resizing to 1080x1080.
        """
        try:
            # Open the image
            image = Image.open(image_path)
            
            # Get the image dimensions
            width, height = image.size
            
            # Determine the smaller dimension for a center crop
            min_dim = min(width, height)
            left = (width - min_dim) // 2
            top = (height - min_dim) // 2
            right = left + min_dim
            bottom = top + min_dim
            
            # Crop the image to a square
            image_cropped = image.crop((left, top, right, bottom))
            
            # Resize to 1080x1080 pixels using LANCZOS resampling filter
            image_resized = image_cropped.resize((1080, 1080), resample=Image.LANCZOS)
            
            # Generate a new filename for the converted image
            filename = os.path.basename(image_path)
            name, ext = os.path.splitext(filename)
            new_filename = f"{name}_instagram{ext}"
            new_path = os.path.join(self.upload_folder, new_filename)
            
            # Save the resized image
            image_resized.save(new_path)
            
            return new_path
        except Exception as e:
            print(f"Error converting image to Instagram size: {e}")
            return image_path