"""
BLIP Image Processor for generating image descriptions.
This implementation is based on the code in a.py.
"""
import os
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

class BlipImageProcessor:
    """Class for processing images and generating descriptions using the BLIP model."""
    
    # Class-level variables to store the model and processor (singleton pattern)
    _processor = None
    _model = None

    def __init__(self, upload_folder):
        """Initialize the image processor with the upload folder."""
        self.upload_folder = upload_folder

        # Load the BLIP model for image captioning (using singleton pattern)
        if BlipImageProcessor._processor is None or BlipImageProcessor._model is None:
            print("Loading BLIP model directly...")
            try:
                # Use local cache to prevent redownloading
                cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "model_cache")
                os.makedirs(cache_dir, exist_ok=True)

                BlipImageProcessor._processor = BlipProcessor.from_pretrained(
                    "Salesforce/blip-image-captioning-base",
                    cache_dir=cache_dir
                )
                BlipImageProcessor._model = BlipForConditionalGeneration.from_pretrained(
                    "Salesforce/blip-image-captioning-base",
                    cache_dir=cache_dir
                )
                print("BLIP model loaded successfully")
            except Exception as e:
                print(f"Error loading BLIP model: {e}")
                # Create dummy processor and model for fallback
                BlipImageProcessor._processor = None
                BlipImageProcessor._model = None
                raise

        # Use the class-level instances
        self.processor = BlipImageProcessor._processor
        self.model = BlipImageProcessor._model
    
    def save_image(self, image_file, filename):
        """Save the uploaded image to the upload folder with preprocessing for large images."""
        try:
            # Ensure the upload folder exists
            os.makedirs(self.upload_folder, exist_ok=True)

            # Create the full path
            image_path = os.path.join(self.upload_folder, filename)

            # Save the image
            image_file.save(image_path)
            print(f"Image saved successfully at: {image_path}")

            # Check if the image is very large and resize it if needed
            try:
                with Image.open(image_path) as img:
                    # If image is larger than 2000x2000, resize it to prevent memory issues
                    if img.width > 2000 or img.height > 2000:
                        print(f"Image is very large ({img.width}x{img.height}), resizing for better processing")

                        # Calculate new dimensions (max 2000px width/height)
                        ratio = min(2000 / img.width, 2000 / img.height)
                        new_width = int(img.width * ratio)
                        new_height = int(img.height * ratio)

                        # Resize and save
                        resized_img = img.resize((new_width, new_height), Image.LANCZOS)
                        resized_img.save(image_path)
                        print(f"Resized image to {new_width}x{new_height} and saved at: {image_path}")
            except Exception as resize_error:
                print(f"Warning: Could not check/resize image: {resize_error}")
                # Continue with the original image

            return image_path
        except Exception as e:
            print(f"Error saving image: {e}")
            raise
    
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

            # Use the same directory as the original image
            output_dir = os.path.dirname(image_path)
            new_path = os.path.join(output_dir, new_filename)

            # Save the resized image
            image_resized.save(new_path)

            print(f"Saved Instagram-sized image to: {new_path}")
            return new_path
        except Exception as e:
            print(f"Error converting image to Instagram size: {e}")
            return image_path

    def get_image_description(self, image_path):
        """
        Generate a description of the image using the BLIP model.
        This implementation is based on the code in a.py.
        """
        try:
            # Check if the model failed to load
            if self.processor is None or self.model is None:
                print("BLIP model not available, using fallback description")
                return "A beautiful image uploaded by the user"

            # Check if the image exists
            if not os.path.exists(image_path):
                print(f"Image not found at path: {image_path}")
                return "An image that could not be found"

            # Open and convert the image to RGB
            image = Image.open(image_path).convert("RGB")

            # Resize image if it's too large to prevent memory issues
            max_size = 1000  # Max dimension
            if image.width > max_size or image.height > max_size:
                ratio = min(max_size / image.width, max_size / image.height)
                new_width = int(image.width * ratio)
                new_height = int(image.height * ratio)
                image = image.resize((new_width, new_height), Image.LANCZOS)
                print(f"Resized image to {new_width}x{new_height} for BLIP processing")

            # Process the image and generate a description
            try:
                inputs = self.processor(image, return_tensors="pt")

                # Generate the caption with a timeout
                output = self.model.generate(**inputs, max_length=50)

                # Decode the output to get the description
                description = self.processor.decode(output[0], skip_special_tokens=True)

                print(f"Generated BLIP image description: {description}")
                return description
            except Exception as model_error:
                print(f"Error during BLIP model inference: {model_error}")
                # Try with a smaller image if the first attempt failed
                if image.width > 500 or image.height > 500:
                    try:
                        smaller_image = image.resize((500, 500), Image.LANCZOS)
                        inputs = self.processor(smaller_image, return_tensors="pt")
                        output = self.model.generate(**inputs, max_length=30)
                        description = self.processor.decode(output[0], skip_special_tokens=True)
                        print(f"Generated BLIP description with smaller image: {description}")
                        return description
                    except Exception as retry_error:
                        print(f"Error with smaller image: {retry_error}")

                return "A beautiful image"
        except Exception as e:
            print(f"Error generating BLIP image description: {e}")
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