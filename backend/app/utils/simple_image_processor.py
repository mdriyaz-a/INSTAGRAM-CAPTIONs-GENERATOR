"""
A simplified image processor that doesn't rely on external models.
"""
import os
from PIL import Image

class SimpleImageProcessor:
    """A simplified class for processing images without using ML models."""
    
    def __init__(self, upload_folder):
        """Initialize the image processor with the upload folder."""
        self.upload_folder = upload_folder
    
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
        """
        Generate a simple description of the image based on its properties.
        No ML model is used, just basic image analysis.
        """
        try:
            # Check if the image exists
            if not os.path.exists(image_path):
                print(f"Image not found at path: {image_path}")
                return "An image that could not be found"

            # Open the image
            image = Image.open(image_path)
            
            # Get basic image properties
            width, height = image.size
            format_name = image.format
            mode = image.mode
            
            # Analyze image colors
            try:
                # Get the dominant colors if possible
                colors = image.getcolors(maxcolors=256)
                if colors:
                    # Sort colors by count (most frequent first)
                    colors.sort(reverse=True, key=lambda x: x[0])
                    # Get the RGB values of the most frequent color
                    most_frequent_color = colors[0][1]
                    if isinstance(most_frequent_color, tuple) and len(most_frequent_color) >= 3:
                        r, g, b = most_frequent_color[:3]
                        # Simple color classification
                        if r > 200 and g > 200 and b > 200:
                            color_desc = "bright white"
                        elif r < 50 and g < 50 and b < 50:
                            color_desc = "dark black"
                        elif r > 200 and g < 100 and b < 100:
                            color_desc = "vibrant red"
                        elif r < 100 and g > 200 and b < 100:
                            color_desc = "vibrant green"
                        elif r < 100 and g < 100 and b > 200:
                            color_desc = "vibrant blue"
                        elif r > 200 and g > 200 and b < 100:
                            color_desc = "vibrant yellow"
                        elif r > 200 and g < 100 and b > 200:
                            color_desc = "vibrant purple"
                        elif r < 100 and g > 200 and b > 200:
                            color_desc = "vibrant cyan"
                        else:
                            color_desc = "colorful"
                    else:
                        color_desc = "colorful"
                else:
                    color_desc = "colorful"
            except Exception as e:
                print(f"Error analyzing colors: {e}")
                color_desc = "colorful"
            
            # Determine image type based on aspect ratio
            aspect_ratio = width / height
            if 0.9 <= aspect_ratio <= 1.1:
                shape_desc = "square"
            elif aspect_ratio > 1.1:
                shape_desc = "landscape"
            else:
                shape_desc = "portrait"
            
            # Generate a description
            description = f"A {color_desc} {shape_desc} image"
            
            # Add format information
            if format_name:
                description += f" in {format_name} format"
            
            # Add resolution information
            if width > 1000 or height > 1000:
                description += f" with high resolution ({width}x{height})"
            else:
                description += f" with resolution {width}x{height}"
            
            print(f"Generated simple image description: {description}")
            return description
        except Exception as e:
            print(f"Error generating simple image description: {e}")
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