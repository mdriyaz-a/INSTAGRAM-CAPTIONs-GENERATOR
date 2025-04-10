import os
import tempfile
import shutil
import logging
from instabot import Bot
from flask import current_app
from app.models import Post, db

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InstagramPoster:
    """Class for posting to Instagram using Instabot."""

    def __init__(self):
        """Initialize the Instagram poster."""
        self.bot = None

    def _initialize_bot(self):
        """Initialize the Instagram bot with a fresh session."""
        try:
            # Clean up any existing session files to force a fresh login
            logger.info("Cleaning up any existing Instagram session files...")
            self._clean_session_files()
            logger.info("Session files cleaned successfully")

            # Create a new bot instance with verbose logging
            logger.info("Creating new Instabot instance...")

            # Set up a temporary directory for the bot
            import tempfile
            import os
            temp_dir = os.path.join(tempfile.gettempdir(), f'instabot_{os.getpid()}')
            os.makedirs(temp_dir, exist_ok=True)

            # Temporarily modify the environment to redirect config
            import os
            old_cwd = os.getcwd()
            os.chdir(temp_dir)

            # Initialize the bot with custom settings
            self.bot = Bot(
                # Disable some features to make it more reliable
                filter_users=False,
                filter_private_users=False,
                filter_previously_followed=False,
                filter_business_accounts=False,
                filter_verified_accounts=False,
                # Set timeouts
                timeout=30,
                # Enable verbose logging
                verbosity=True
            )

            # Restore the working directory
            os.chdir(old_cwd)

            logger.info("Instabot instance created successfully")
        except Exception as e:
            logger.error(f"Error initializing Instagram bot: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Create a basic bot as fallback
            self.bot = Bot()
            logger.info("Created fallback Instabot instance")

    def _clean_session_files(self):
        """Clean up any existing session files to force a fresh login."""
        try:
            # Get the temp directory
            temp_dir = tempfile.gettempdir()

            # Clean up config directory
            config_dir = os.path.join(temp_dir, 'config')
            logger.info(f"Looking for Instabot config directory at: {config_dir}")
            if os.path.exists(config_dir):
                logger.info(f"Found existing config directory, removing: {config_dir}")
                shutil.rmtree(config_dir)
                logger.info("Config directory removed successfully")
            else:
                logger.info("No existing config directory found")

            # Clean up cookie files
            cookie_files = [
                os.path.join(temp_dir, 'instagram.json'),
                os.path.join(os.getcwd(), 'instagram.json'),
                os.path.join(os.path.expanduser('~'), 'instagram.json')
            ]
            for cookie_file in cookie_files:
                if os.path.exists(cookie_file):
                    logger.info(f"Found existing cookie file, removing: {cookie_file}")
                    os.remove(cookie_file)

            # Clean up process-specific config directories
            for item in os.listdir(temp_dir):
                if item.startswith('instabot_'):
                    item_path = os.path.join(temp_dir, item)
                    if os.path.isdir(item_path):
                        logger.info(f"Found existing instabot directory, removing: {item_path}")
                        shutil.rmtree(item_path)

            # Clean up any config directories in the current directory
            current_dir_config = os.path.join(os.getcwd(), 'config')
            if os.path.exists(current_dir_config):
                logger.info(f"Found config directory in current directory, removing: {current_dir_config}")
                shutil.rmtree(current_dir_config)

            # Clean up any cookie files in the current directory
            for item in os.listdir(os.getcwd()):
                if item.endswith('.checkpoint') or item.endswith('.json'):
                    if 'instagram' in item.lower() or 'instabot' in item.lower():
                        item_path = os.path.join(os.getcwd(), item)
                        logger.info(f"Found Instagram-related file, removing: {item_path}")
                        os.remove(item_path)
                        
            # Clean up any .REMOVE_ME files in the uploads directory
            uploads_dir = os.path.join(os.getcwd(), 'uploads')
            if os.path.exists(uploads_dir):
                for item in os.listdir(uploads_dir):
                    if item.endswith('.REMOVE_ME'):
                        item_path = os.path.join(uploads_dir, item)
                        logger.info(f"Found .REMOVE_ME file, removing: {item_path}")
                        os.remove(item_path)
        except Exception as e:
            logger.error(f"Error cleaning session files: {e}")
            import traceback
            logger.error(traceback.format_exc())

    def post_to_instagram(self, image_path, caption, username, password, post_type='post'):
        """
        Post the image with the generated caption to Instagram using Instabot.

        Args:
            image_path (str): The path to the image file.
            caption (str): The caption for the post.
            username (str): The Instagram username.
            password (str): The Instagram password.
            post_type (str, optional): The type of post ('post' or 'story'). Defaults to 'post'.

        Returns:
            bool: True if the post was successful, False otherwise.
        """
        try:
            # Check if the image exists
            if not os.path.exists(image_path):
                logger.error(f"Image file does not exist at path: {image_path}")
                return False

            # Check if the image is a valid image file
            try:
                from PIL import Image
                img = Image.open(image_path)
                img_format = img.format
                img_size = img.size
                logger.info(f"Image validated: Format={img_format}, Size={img_size}")

                # Make sure the image is in a format Instagram accepts
                if img_format not in ['JPEG', 'JPG', 'PNG']:
                    logger.info(f"Converting image from {img_format} to JPEG for Instagram compatibility")
                    # Convert to RGB (in case it's RGBA or another mode)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    # Save as JPEG
                    jpeg_path = os.path.splitext(image_path)[0] + '.jpg'
                    img.save(jpeg_path, 'JPEG', quality=95)
                    image_path = jpeg_path
                    logger.info(f"Image converted and saved to: {image_path}")
            except Exception as img_error:
                logger.error(f"Invalid image file: {img_error}")
                return False

            # Initialize the bot with detailed logging
            logger.info("Initializing Instagram bot with disabled persistence...")
            self._initialize_bot()
            logger.info("Bot initialized successfully")

            # Login to Instagram with detailed error handling
            logger.info(f"Attempting to login to Instagram as {username}")
            try:
                # Disable signal handling for login
                import signal
                original_handler = None

                # Try to disable signal handling if possible
                try:
                    # Save the original SIGINT handler
                    original_handler = signal.getsignal(signal.SIGINT)
                    # Set a dummy handler
                    signal.signal(signal.SIGINT, lambda sig, frame: None)
                    logger.info("Temporarily disabled SIGINT handling")
                except (ValueError, TypeError, AttributeError) as signal_error:
                    logger.warning(f"Could not disable signal handling: {signal_error}")

                # Perform the login
                login_success = self.bot.login(username=username, password=password)

                # Restore the original signal handler if we changed it
                if original_handler is not None:
                    try:
                        signal.signal(signal.SIGINT, original_handler)
                        logger.info("Restored original SIGINT handling")
                    except Exception as restore_error:
                        logger.warning(f"Error restoring signal handler: {restore_error}")

                if not login_success:
                    logger.error("Failed to login to Instagram - login returned False")
                    return False

                logger.info("Successfully logged in to Instagram")
            except Exception as login_error:
                logger.error(f"Exception during Instagram login: {login_error}")
                return False

            # Post the image with detailed error handling
            try:
                # Disable signal handling for upload
                import signal
                original_handler = None

                # Try to disable signal handling if possible
                try:
                    # Save the original SIGINT handler
                    original_handler = signal.getsignal(signal.SIGINT)
                    # Set a dummy handler
                    signal.signal(signal.SIGINT, lambda sig, frame: None)
                    logger.info("Temporarily disabled SIGINT handling for upload")
                except (ValueError, TypeError, AttributeError) as signal_error:
                    logger.warning(f"Could not disable signal handling for upload: {signal_error}")

                # Perform the upload
                if post_type == 'story':
                    # Upload as a story
                    logger.info(f"Uploading story to Instagram: {image_path}")
                    upload_success = self.bot.upload_story_photo(image_path)
                else:
                    # Check for and remove any existing .REMOVE_ME files
                    remove_me_path = f"{image_path}.REMOVE_ME"
                    if os.path.exists(remove_me_path):
                        logger.info(f"Removing existing .REMOVE_ME file: {remove_me_path}")
                        try:
                            os.remove(remove_me_path)
                        except Exception as rm_error:
                            logger.warning(f"Could not remove .REMOVE_ME file: {rm_error}")
                    
                    # Upload as a regular post
                    logger.info(f"Uploading post to Instagram: {image_path}")
                    logger.info(f"Caption: {caption[:50]}..." if len(caption) > 50 else f"Caption: {caption}")
                    upload_success = self.bot.upload_photo(image_path, caption=caption)

                # Restore the original signal handler if we changed it
                if original_handler is not None:
                    try:
                        signal.signal(signal.SIGINT, original_handler)
                        logger.info("Restored original SIGINT handling after upload")
                    except Exception as restore_error:
                        logger.warning(f"Error restoring signal handler after upload: {restore_error}")

                if upload_success:
                    logger.info("Successfully posted to Instagram")
                else:
                    logger.error("Failed to post to Instagram - upload returned False")
            except Exception as upload_error:
                logger.error(f"Exception during Instagram upload: {upload_error}")
                # Handle the specific file rename error
                if "Cannot create a file when that file already exists" in str(upload_error) and ".REMOVE_ME" in str(upload_error):
                    logger.info("Post was likely successful despite the .REMOVE_ME file error")
                    return True
                return False

            # Logout with error handling
            try:
                logger.info("Logging out from Instagram")
                self.bot.logout()
                logger.info("Successfully logged out from Instagram")
            except Exception as logout_error:
                logger.error(f"Error during logout: {logout_error}")
                # Don't return False here, as the upload might have succeeded

            return upload_success if 'upload_success' in locals() else False
        except Exception as e:
            logger.error(f"Unexpected error posting to Instagram: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

def post_to_instagram_direct(post_id, username, password):
    """
    Post directly to Instagram.

    Args:
        post_id (int): The ID of the post to publish.
        username (str): The Instagram username.
        password (str): The Instagram password.

    Returns:
        bool: True if the post was successful, False otherwise.
    """
    try:
        # Import necessary modules
        import threading
        import time
        from PIL import Image

        logger.info(f"Starting Instagram posting process for post ID: {post_id}")
        logger.info(f"Using Instagram username: {username}")

        # Get the post
        post = Post.query.get(post_id)

        if not post:
            logger.error(f"Post {post_id} not found in database")
            return False

        logger.info(f"Post found: ID={post.id}, Caption={post.caption[:30]}...")

        # Check if the image exists
        if not post.image_path:
            logger.error(f"No image path found for post {post_id}")
            return False

        logger.info(f"Original image path from post: {post.image_path}")

        # Fix the image path if it's relative
        full_image_path = post.image_path

        # Try multiple approaches to find the image
        if not os.path.exists(full_image_path):
            logger.warning(f"Image not found at original path: {full_image_path}")

            # Use a default upload folder
            upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
            logger.info(f"Using default upload folder: {upload_folder}")

            # Approach 1: Try with upload folder
            basename = os.path.basename(post.image_path)
            possible_path1 = os.path.join(upload_folder, basename)
            logger.info(f"Trying path with upload folder: {possible_path1}")

            if os.path.exists(possible_path1):
                full_image_path = possible_path1
                logger.info(f"Found image at: {full_image_path}")
            else:
                # Approach 2: Try with static folder
                static_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static')
                possible_path2 = os.path.join(static_folder, basename)
                logger.info(f"Trying path with static folder: {possible_path2}")

                if os.path.exists(possible_path2):
                    full_image_path = possible_path2
                    logger.info(f"Found image at: {full_image_path}")
                else:
                    # Approach 3: Search in upload folder for any file with similar name
                    logger.info(f"Searching in upload folder for files with similar name to: {basename}")
                    if os.path.exists(upload_folder):
                        for filename in os.listdir(upload_folder):
                            if basename.lower() in filename.lower():
                                possible_path3 = os.path.join(upload_folder, filename)
                                logger.info(f"Found potential match: {possible_path3}")
                                full_image_path = possible_path3
                                break

        if not os.path.exists(full_image_path):
            logger.error(f"Image not found after all attempts. Last tried path: {full_image_path}")
            return False

        logger.info(f"Final image path to use: {full_image_path}")

        # Get file info for debugging
        try:
            file_size = os.path.getsize(full_image_path) / 1024  # Size in KB
            logger.info(f"Image file size: {file_size:.2f} KB")
        except Exception as size_error:
            logger.warning(f"Could not get file size: {size_error}")

        # Convert the image to Instagram size
        try:
            logger.info("Converting image to Instagram size...")

            # Open the image
            image = Image.open(full_image_path)

            # Check format and convert if needed
            img_format = image.format
            logger.info(f"Image format: {img_format}")

            # Make sure the image is in a format Instagram accepts
            if img_format not in ['JPEG', 'JPG', 'PNG']:
                logger.info(f"Converting image from {img_format} to JPEG for Instagram compatibility")
                # Convert to RGB (in case it's RGBA or another mode)
                if image.mode != 'RGB':
                    image = image.convert('RGB')

            # Get the image dimensions
            width, height = image.size
            logger.info(f"Original image dimensions: {width}x{height}")

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
            filename = os.path.basename(full_image_path)
            name, ext = os.path.splitext(filename)
            new_filename = f"{name}_instagram.jpg"  # Always use .jpg extension

            # Use the same directory as the original image
            output_dir = os.path.dirname(full_image_path)
            instagram_image_path = os.path.join(output_dir, new_filename)

            # Save the resized image as JPEG
            image_resized.save(instagram_image_path, 'JPEG', quality=95)
            logger.info(f"Saved Instagram-sized image to: {instagram_image_path}")

            # Verify the converted image
            if not os.path.exists(instagram_image_path):
                logger.error(f"Converted image not found at: {instagram_image_path}")
                logger.info("Using original image as fallback")
                instagram_image_path = full_image_path
        except Exception as convert_error:
            logger.error(f"Error converting image: {convert_error}")
            import traceback
            logger.error(traceback.format_exc())
            logger.info("Using original image as fallback")
            instagram_image_path = full_image_path

        # Post to Instagram using a thread to avoid signal issues
        logger.info("Creating Instagram poster...")
        instagram_poster = InstagramPoster()

        logger.info("Starting Instagram posting process...")
        logger.info(f"Image path: {instagram_image_path}")
        logger.info(f"Caption: {post.caption[:50]}..." if len(post.caption) > 50 else f"Caption: {post.caption}")
        logger.info(f"Username: {username}")
        logger.info(f"Post type: {post.post_type}")

        # Use a thread with timeout for the entire posting process
        success = False
        posting_error = None

        def posting_thread():
            nonlocal success, posting_error
            try:
                success = instagram_poster.post_to_instagram(
                    instagram_image_path,
                    post.caption,
                    username,
                    password,
                    post.post_type
                )
            except Exception as e:
                posting_error = e

        # Start posting in a separate thread
        thread = threading.Thread(target=posting_thread)
        thread.daemon = True
        thread.start()

        # Wait for posting with timeout
        timeout = 90  # seconds (longer for the entire process)
        start_time = time.time()
        while thread.is_alive() and time.time() - start_time < timeout:
            time.sleep(1)

        if thread.is_alive():
            logger.error(f"Instagram posting timed out after {timeout} seconds")
            return False

        if posting_error:
            logger.error(f"Exception during Instagram posting: {posting_error}")
            return False

        if success:
            logger.info("Successfully posted to Instagram")
            # Update the post status
            post.is_posted = True
            db.session.commit()
            return True
        else:
            logger.error("Failed to post to Instagram")
            return False
    except Exception as e:
        logger.error(f"Error in post_to_instagram_direct: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

        if success:
            # Update the post status
            post.is_posted = True
            db.session.commit()
            logger.info(f"Post {post_id} successfully posted to Instagram")
            return True
        else:
            logger.error(f"Failed to post {post_id} to Instagram")
            return False
    except Exception as e:
        logger.error(f"Error in post_to_instagram_direct: {e}")
        return False