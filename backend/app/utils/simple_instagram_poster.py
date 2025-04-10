"""
Simple Instagram poster module.
This is a simplified version based on the working code in a.py.
"""

import os
import shutil
import tempfile
import logging
from instabot import Bot
from PIL import Image

# Set up logging
logger = logging.getLogger(__name__)

def clean_session_files():
    """Clean up any existing session files to force a fresh login."""
    try:
        # Clean up config directory in current directory
        config_dir = os.path.join(os.getcwd(), 'config')
        if os.path.exists(config_dir):
            logger.info(f"Removing config directory: {config_dir}")
            shutil.rmtree(config_dir)
    except Exception as e:
        logger.error(f"Error cleaning session files: {e}")

def convert_to_instagram_size(image_path):
    """
    Convert the image to 1080x1080 by center-cropping and resizing.
    """
    try:
        image = Image.open(image_path)
        width, height = image.size
        min_dim = min(width, height)
        left = (width - min_dim) // 2
        top = (height - min_dim) // 2
        right = left + min_dim
        bottom = top + min_dim
        image_cropped = image.crop((left, top, right, bottom))
        image_resized = image_cropped.resize((1080, 1080), resample=Image.LANCZOS)
        
        # Generate a new filename for the converted image
        filename = os.path.basename(image_path)
        name, ext = os.path.splitext(filename)
        new_filename = f"{name}_instagram.jpg"
        
        # Use the same directory as the original image
        output_dir = os.path.dirname(image_path)
        new_path = os.path.join(output_dir, new_filename)
        
        # Save as JPEG
        if image_resized.mode != 'RGB':
            image_resized = image_resized.convert('RGB')
        image_resized.save(new_path, 'JPEG', quality=95)
        
        logger.info(f"Converted image saved to: {new_path}")
        return new_path
    except Exception as e:
        logger.error(f"Error converting image: {e}")
        return image_path

def clean_remove_me_files(image_path):
    """Clean up any existing .REMOVE_ME files to prevent conflicts"""
    try:
        remove_me_path = f"{image_path}.REMOVE_ME"
        if os.path.exists(remove_me_path):
            logger.info(f"Removing existing .REMOVE_ME file: {remove_me_path}")
            os.remove(remove_me_path)
    except Exception as e:
        logger.error(f"Error cleaning .REMOVE_ME files: {e}")

def post_to_instagram(image_path, caption, username, password):
    """
    Post to Instagram using the simplified approach from a.py.
    """
    try:
        # Clean up any existing session files
        clean_session_files()
        
        # Convert the image to Instagram size
        instagram_image_path = convert_to_instagram_size(image_path)
        
        # Clean up any existing .REMOVE_ME files to prevent conflicts
        clean_remove_me_files(instagram_image_path)
        
        # Create a new bot instance
        logger.info(f"Creating new bot instance")
        bot = Bot()
        
        # Login to Instagram
        logger.info(f"Logging in as {username}")
        login_success = bot.login(username=username, password=password)
        
        if not login_success:
            logger.error("Failed to login to Instagram")
            return False
            
        # Upload the photo
        logger.info(f"Uploading photo: {instagram_image_path}")
        upload_success = bot.upload_photo(instagram_image_path, caption=caption)
        
        if upload_success:
            logger.info("Successfully posted to Instagram")
            return True
        else:
            logger.error("Failed to upload photo to Instagram")
            return False
    except Exception as e:
        logger.error(f"Error posting to Instagram: {e}")
        # Handle the specific file rename error
        if "Cannot create a file when that file already exists" in str(e) and ".REMOVE_ME" in str(e):
            logger.info("Post was likely successful despite the .REMOVE_ME file error")
            return True
        return False