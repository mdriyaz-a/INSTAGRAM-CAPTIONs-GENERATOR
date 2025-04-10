"""
Simplified caption generation route that doesn't rely on external models.
This is a fallback for when the main caption generation fails.
"""
import os
import traceback
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import User
from app.utils.blip_image_processor import BlipImageProcessor
from app.utils.mock_caption_generator import MockCaptionGenerator

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

simple_captions_bp = Blueprint('simple_captions', __name__)

def allowed_file(filename):
    """Check if the file has an allowed extension."""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@simple_captions_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_caption():
    """Generate captions for an image or text using the mock generator."""
    try:
        # Get user ID from JWT token
        try:
            # Get the identity from the JWT token (should be a string)
            user_id_str = get_jwt_identity()
            logger.info(f"JWT identity: {user_id_str}, type: {type(user_id_str)}")

            # Convert to integer for database lookup
            try:
                user_id = int(user_id_str)
            except (ValueError, TypeError) as e:
                logger.error(f"Error converting user ID to integer: {e}")
                return jsonify({'message': f'Invalid user ID format: {user_id_str}'}), 401
        except Exception as e:
            logger.error(f"Error getting JWT identity: {e}")
            return jsonify({'message': f'Authentication error: {str(e)}'}), 401

        # Get user from database
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"User not found: {user_id}")
            # Continue anyway for the simple captions endpoint
            logger.info("Continuing without user for simple captions")

        # Initialize the mock generator (always works without external dependencies)
        mock_generator = MockCaptionGenerator()

        # Check if the request contains an image file or text
        if 'image' in request.files:
            try:
                # Process image upload
                image_file = request.files['image']

                if image_file.filename == '':
                    return jsonify({'message': 'No selected file'}), 400

                if not allowed_file(image_file.filename):
                    return jsonify({'message': 'File type not allowed. Supported formats: JPG, JPEG, PNG, GIF'}), 400

                # Process the image with BLIP
                logger.info("Using BlipImageProcessor with optimized settings...")

                # Use a safe filename that doesn't depend on user_id
                safe_filename = secure_filename(f"blip_{image_file.filename}")

                try:
                    # Get file size for logging
                    image_file.seek(0, os.SEEK_END)
                    file_size = image_file.tell() / (1024 * 1024)  # Size in MB
                    image_file.seek(0)  # Reset file pointer
                    logger.info(f"Processing file: {safe_filename}, Size: {file_size:.2f}MB, Type: {image_file.content_type}")

                    # Initialize BLIP processor with error handling
                    try:
                        blip_processor = BlipImageProcessor(current_app.config['UPLOAD_FOLDER'])
                        image_path = blip_processor.save_image(image_file, safe_filename)
                        logger.info(f"Image saved at: {image_path}")
                    except Exception as e:
                        logger.error(f"Error initializing BLIP or saving image: {e}")
                        logger.error(traceback.format_exc())

                        # Save the image directly as fallback
                        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], safe_filename)
                        os.makedirs(os.path.dirname(image_path), exist_ok=True)
                        image_file.save(image_path)
                        logger.info(f"Image saved directly at: {image_path}")

                    # Generate a BLIP description with robust error handling
                    try:
                        if image_path:
                            # Try to initialize BLIP again if needed
                            if 'blip_processor' not in locals() or blip_processor is None:
                                blip_processor = BlipImageProcessor(current_app.config['UPLOAD_FOLDER'])

                            description = blip_processor.get_image_description(image_path)
                        else:
                            description = "An image uploaded by the user"
                        logger.info(f"Generated BLIP description: {description}")
                    except Exception as e:
                        logger.error(f"Error generating BLIP description: {e}")
                        logger.error(traceback.format_exc())
                        description = "An image uploaded by the user"
                except Exception as outer_e:
                    logger.error(f"Unexpected error in image processing: {outer_e}")
                    logger.error(traceback.format_exc())
                    image_path = None
                    description = "An image uploaded by the user"

                # Generate captions with the mock generator
                captions = mock_generator.generate_caption_with_suggestions(description)
                logger.info(f"Generated captions successfully using mock generator")

                return jsonify({
                    'image_path': image_path,
                    'description': description,
                    'captions': captions
                }), 200

            except Exception as e:
                logger.error(f"Error processing image: {e}")
                logger.error(traceback.format_exc())

                # Return fallback captions even on error
                description = "An image uploaded by the user"
                captions = mock_generator.generate_caption_with_suggestions(description)

                return jsonify({
                    'image_path': None,
                    'description': description,
                    'captions': captions,
                    'fallback': True,
                    'message': 'Using fallback captions due to processing error'
                }), 200

        elif request.json and 'text' in request.json:
            try:
                # Process text input
                text = request.json['text']

                if not text or text.strip() == "":
                    return jsonify({'message': 'Text cannot be empty'}), 400

                # Generate captions with the mock generator
                captions = mock_generator.generate_caption_with_suggestions(text)
                logger.info(f"Generated captions successfully using mock generator")

                return jsonify({
                    'text': text,
                    'captions': captions
                }), 200

            except Exception as e:
                logger.error(f"Error processing text: {e}")
                logger.error(traceback.format_exc())

                # Return fallback captions even on error
                fallback_text = text if text else "Text provided by the user"
                captions = mock_generator.generate_caption_with_suggestions(fallback_text)

                return jsonify({
                    'text': fallback_text,
                    'captions': captions,
                    'fallback': True,
                    'message': 'Using fallback captions due to processing error'
                }), 200

        else:
            # If no image or text provided, return generic captions
            logger.warning("No image or text provided, returning generic captions")

            generic_captions = [
                {
                    'text': "A beautiful moment captured in time.",
                    'hashtags': ["#photography", "#moment", "#beautiful"],
                    'style': "casual"
                },
                {
                    'text': "Every picture tells a story.",
                    'hashtags': ["#story", "#picture", "#memories"],
                    'style': "inspirational"
                },
                {
                    'text': "Life is better with good photos!",
                    'hashtags': ["#goodvibes", "#photooftheday", "#lifestyle"],
                    'style': "funny"
                }
            ]

            return jsonify({
                'description': "Generic caption",
                'captions': generic_captions,
                'fallback': True,
                'message': 'Using generic captions as no image or text was provided'
            }), 200

    except Exception as e:
        logger.error(f"Unexpected error in generate_caption: {e}")
        logger.error(traceback.format_exc())

        # Return generic captions even on unexpected errors
        generic_captions = [
            {
                'text': "A beautiful moment captured in time.",
                'hashtags': ["#photography", "#moment", "#beautiful"],
                'style': "casual"
            },
            {
                'text': "Every picture tells a story.",
                'hashtags': ["#story", "#picture", "#memories"],
                'style': "inspirational"
            },
            {
                'text': "Life is better with good photos!",
                'hashtags': ["#goodvibes", "#photooftheday", "#lifestyle"],
                'style': "funny"
            }
        ]

        return jsonify({
            'description': "Generic caption",
            'captions': generic_captions,
            'fallback': True,
            'message': 'Using generic captions due to an unexpected error'
        }), 200