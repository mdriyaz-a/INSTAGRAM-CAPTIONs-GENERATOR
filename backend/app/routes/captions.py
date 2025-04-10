import os
import traceback
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import User
try:
    from app.utils.image_processor import ImageProcessor
except ImportError:
    ImageProcessor = None
from app.utils.simple_image_processor import SimpleImageProcessor
from app.utils.blip_image_processor import BlipImageProcessor
from app.utils.caption_generator import CaptionGenerator
from app.utils.mock_caption_generator import MockCaptionGenerator
from app.utils.direct_cohere_generator import DirectCohereGenerator

captions_bp = Blueprint('captions', __name__)

def allowed_file(filename):
    """Check if the file has an allowed extension."""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@captions_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_caption():
    """Generate captions for an image or text."""
    try:
        # Get user ID from JWT token
        try:
            # Get the identity from the JWT token (should be a string)
            user_id_str = get_jwt_identity()
            print(f"JWT identity: {user_id_str}, type: {type(user_id_str)}")

            # Convert to integer for database lookup
            try:
                user_id = int(user_id_str)
            except (ValueError, TypeError) as e:
                print(f"Error converting user ID to integer: {e}")
                return jsonify({'message': f'Invalid user ID format: {user_id_str}'}), 401
        except Exception as e:
            print(f"Error getting JWT identity: {e}")
            return jsonify({'message': f'Authentication error: {str(e)}'}), 401

        # Get user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Check if the request contains an image file or text
        if 'image' in request.files:
            try:
                # Process image upload
                image_file = request.files['image']

                if image_file.filename == '':
                    return jsonify({'message': 'No selected file'}), 400

                if not allowed_file(image_file.filename):
                    return jsonify({'message': 'File type not allowed. Supported formats: JPG, JPEG, PNG, GIF'}), 400

                # Save the image
                filename = secure_filename(f"{user_id}_{image_file.filename}")

                # Try to use the BLIP image processor (as in a.py)
                try:
                    print("Using BlipImageProcessor (as in a.py)...")
                    image_processor = BlipImageProcessor(current_app.config['UPLOAD_FOLDER'])

                    # Save the image
                    image_path = image_processor.save_image(image_file, filename)
                    print(f"Image saved at: {image_path}")

                    # Generate image description using BLIP
                    description = image_processor.get_image_description(image_path)
                    print(f"Generated description with BlipImageProcessor: {description}")
                except Exception as e:
                    print(f"Error with BlipImageProcessor: {e}")
                    print(traceback.format_exc())

                    # Try again with BLIP but with a simpler approach
                    try:
                        print("Trying BLIP again with a simpler approach...")
                        # Save the image directly without processing
                        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                        os.makedirs(os.path.dirname(image_path), exist_ok=True)
                        image_file.save(image_path)
                        print(f"Image saved directly at: {image_path}")

                        # Try to initialize BLIP again
                        blip_processor = BlipImageProcessor(current_app.config['UPLOAD_FOLDER'])
                        description = blip_processor.get_image_description(image_path)
                        print(f"Generated description with second BLIP attempt: {description}")
                    except Exception as retry_error:
                        print(f"Error with second BLIP attempt: {retry_error}")
                        print(traceback.format_exc())
                        # Use a default description rather than failing
                        description = "A beautiful image uploaded by the user"
                        print(f"Using default description: {description}")

                # Generate captions with suggestions
                try:
                    # Try with the direct Cohere generator (as in a.py)
                    try:
                        print("Attempting to use Direct Cohere API for caption generation (as in a.py)...")
                        direct_generator = DirectCohereGenerator(current_app.config['COHERE_API_KEY'])
                        captions = direct_generator.generate_caption_with_suggestions(description)
                        print(f"Generated captions successfully using Direct Cohere API")
                    except Exception as direct_error:
                        print(f"Direct Cohere API error: {direct_error}")

                        # Try with the regular caption generator
                        try:
                            print("Falling back to regular Cohere API for caption generation...")
                            caption_generator = CaptionGenerator(current_app.config['COHERE_API_KEY'])
                            captions = caption_generator.generate_caption_with_suggestions(description)
                            print(f"Generated captions successfully using regular Cohere API")
                        except Exception as cohere_error:
                            # If Cohere API fails, use the mock generator as fallback
                            print(f"Cohere API error: {cohere_error}")
                            print("Falling back to mock caption generator...")
                            mock_generator = MockCaptionGenerator()
                            captions = mock_generator.generate_caption_with_suggestions(description)
                            print(f"Generated captions successfully using mock generator")
                except Exception as e:
                    print(f"Error generating captions: {e}")
                    print(traceback.format_exc())
                    return jsonify({'message': f'Error generating captions: {str(e)}'}), 500

                return jsonify({
                    'image_path': image_path,
                    'description': description,
                    'captions': captions
                }), 200

            except Exception as e:
                print(f"Error processing image: {e}")
                return jsonify({'message': f'Error processing image: {str(e)}'}), 500

        elif request.json and 'text' in request.json:
            try:
                # Process text input
                text = request.json['text']

                if not text or text.strip() == "":
                    return jsonify({'message': 'Text cannot be empty'}), 400

                # Generate captions with suggestions
                try:
                    # Try with the direct Cohere generator (as in a.py)
                    try:
                        print("Attempting to use Direct Cohere API for caption generation from text (as in a.py)...")
                        direct_generator = DirectCohereGenerator(current_app.config['COHERE_API_KEY'])
                        captions = direct_generator.generate_caption_with_suggestions(text)
                        print(f"Generated captions successfully using Direct Cohere API")
                    except Exception as direct_error:
                        print(f"Direct Cohere API error: {direct_error}")

                        # Try with the regular caption generator
                        try:
                            print("Falling back to regular Cohere API for caption generation from text...")
                            caption_generator = CaptionGenerator(current_app.config['COHERE_API_KEY'])
                            captions = caption_generator.generate_caption_with_suggestions(text)
                            print(f"Generated captions successfully using regular Cohere API")
                        except Exception as cohere_error:
                            # If Cohere API fails, use the mock generator as fallback
                            print(f"Cohere API error: {cohere_error}")
                            print("Falling back to mock caption generator...")
                            mock_generator = MockCaptionGenerator()
                            captions = mock_generator.generate_caption_with_suggestions(text)
                            print(f"Generated captions successfully using mock generator")
                except Exception as e:
                    print(f"Error generating captions from text: {e}")
                    print(traceback.format_exc())
                    return jsonify({'message': f'Error generating captions: {str(e)}'}), 500

                return jsonify({
                    'description': text,
                    'captions': captions
                }), 200

            except Exception as e:
                print(f"Error processing text: {e}")
                return jsonify({'message': f'Error processing text: {str(e)}'}), 500

        else:
            return jsonify({'message': 'No image or text provided. Please upload an image or provide text.'}), 400

    except Exception as e:
        print(f"Unexpected error in generate_caption: {e}")
        return jsonify({'message': f'An unexpected error occurred: {str(e)}'}), 500

@captions_bp.route('/styles', methods=['GET'])
@jwt_required()
def get_caption_styles():
    """Get available caption styles."""
    styles = [
        {
            'id': 'casual',
            'name': 'Casual',
            'description': 'Relaxed, everyday tone'
        },
        {
            'id': 'formal',
            'name': 'Formal',
            'description': 'Professional and polished'
        },
        {
            'id': 'poetic',
            'name': 'Poetic',
            'description': 'Artistic and expressive'
        },
        {
            'id': 'humorous',
            'name': 'Humorous',
            'description': 'Funny and light-hearted'
        },
        {
            'id': 'inspirational',
            'name': 'Inspirational',
            'description': 'Motivational and uplifting'
        }
    ]
    
    return jsonify(styles), 200