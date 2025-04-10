import os
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from app import db
from app.models import User, Post
from app.utils.image_processor import ImageProcessor
from app.utils.direct_instagram_poster import post_to_instagram as direct_post_to_instagram
from app.utils.instagram_poster import InstagramPoster, post_to_instagram_direct

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/', methods=['GET'])
@jwt_required()
def get_posts():
    """Get all posts for the logged in user."""
    try:
        # Get the identity from the JWT token (should be a string)
        user_id_str = get_jwt_identity()
        print(f"JWT identity: {user_id_str}, type: {type(user_id_str)}")

        # Convert to integer for database lookup
        user_id = int(user_id_str)
    except (ValueError, TypeError) as e:
        print(f"Error converting user ID to integer: {e}")
        return jsonify({'message': f'Invalid user ID format'}), 401

    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Get all posts for the user
    posts = Post.query.filter_by(user_id=user_id).order_by(Post.created_at.desc()).all()
    
    return jsonify({
        'posts': [post.to_dict() for post in posts]
    }), 200

@posts_bp.route('/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post(post_id):
    """Get a specific post."""
    try:
        # Get the identity from the JWT token (should be a string)
        user_id_str = get_jwt_identity()

        # Convert to integer for database lookup
        user_id = int(user_id_str)
    except (ValueError, TypeError) as e:
        print(f"Error converting user ID to integer: {e}")
        return jsonify({'message': f'Invalid user ID format'}), 401

    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Get the post
    post = Post.query.filter_by(id=post_id, user_id=user_id).first()
    
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    
    return jsonify(post.to_dict()), 200

@posts_bp.route('/', methods=['POST'])
@jwt_required()
def create_post():
    """Create a new post."""
    # Print all headers for debugging
    print("Request headers:")
    for header, value in request.headers.items():
        # Don't print the full token for security reasons
        if header.lower() == 'authorization':
            print(f"  {header}: {value[:20]}...")
        else:
            print(f"  {header}: {value}")

    try:
        # Get the identity from the JWT token (should be a string)
        user_id_str = get_jwt_identity()
        print(f"JWT identity: {user_id_str}, type: {type(user_id_str)}")

        # Convert to integer for database lookup
        user_id = int(user_id_str)
        print(f"Converted user_id: {user_id}")
    except (ValueError, TypeError) as e:
        print(f"Error converting user ID to integer: {e}")
        return jsonify({'message': f'Invalid user ID format: {str(e)}'}), 401

    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('caption'):
        return jsonify({'message': 'Missing caption'}), 400
    
    # Create new post
    image_path = data.get('image_path')

    # If image_path is provided but doesn't exist, try to find it in the upload folder
    if image_path and not os.path.exists(image_path):
        # Try to find the image in the upload folder
        upload_folder = current_app.config['UPLOAD_FOLDER']
        basename = os.path.basename(image_path) if image_path else None
        if basename:
            possible_path = os.path.join(upload_folder, basename)
            if os.path.exists(possible_path):
                image_path = possible_path
                logger.info(f"Found image at: {image_path}")
            else:
                logger.warning(f"Image not found at: {possible_path}")

    new_post = Post(
        user_id=user_id,
        image_path=image_path,
        image_description=data.get('image_description'),
        caption=data['caption'],
        post_type=data.get('post_type', 'post')
    )
    
    # We're not supporting scheduled posts anymore
    if data.get('scheduled_at'):
        return jsonify({'message': 'Scheduled posts are not supported'}), 400
    
    # Add post to database
    db.session.add(new_post)
    db.session.commit()
    
    # If Instagram credentials are provided, post immediately
    if data.get('instagram_credentials'):
        instagram_credentials = data['instagram_credentials']

        # Validate Instagram credentials
        if not instagram_credentials.get('username') or not instagram_credentials.get('password'):
            logger.warning("Instagram credentials provided but missing username or password")
            # Don't return an error, just don't post to Instagram
            response_data = {
                'message': 'Post created successfully, but Instagram credentials were incomplete',
                'post': new_post.to_dict(),
                'instagram_status': 'skipped'
            }
        else:
            # Post to Instagram
            logger.info(f"Posting to Instagram with username: {instagram_credentials['username']}")

            try:
                # Post directly to Instagram using a thread to avoid blocking
                import threading
                from flask import current_app
                import copy

                # Store the post ID and credentials to avoid SQLAlchemy session issues
                post_id = new_post.id
                post_caption = new_post.caption
                post_image_path = new_post.image_path
                post_type = new_post.post_type
                username = instagram_credentials['username']
                password = instagram_credentials['password']

                # Get the current app for the thread
                app = current_app._get_current_object()

                def instagram_posting_thread():
                    # Create a new application context for this thread
                    with app.app_context():
                        try:
                            logger.info(f"Starting Instagram posting in thread for post ID: {post_id}")

                            # Find the image
                            import os

                            # Check if post_image_path is None
                            if not post_image_path:
                                logger.error("Post has no image path")
                                return

                            full_image_path = post_image_path

                            # Try to find the image if it doesn't exist
                            if not os.path.exists(full_image_path):
                                upload_folder = app.config['UPLOAD_FOLDER']
                                basename = os.path.basename(post_image_path)
                                possible_path = os.path.join(upload_folder, basename)
                                if os.path.exists(possible_path):
                                    full_image_path = possible_path
                                    logger.info(f"Found image at: {full_image_path}")

                            if not os.path.exists(full_image_path):
                                logger.error(f"Image not found at path: {full_image_path}")
                                return

                            # Use the direct Instagram poster (runs in separate process)
                            logger.info("Using direct Instagram poster (runs in separate process)")
                            success = direct_post_to_instagram(
                                full_image_path,
                                post_caption,
                                username,
                                password
                            )

                            # Update the post status in the database
                            if success:
                                logger.info(f"Post {post_id} successfully posted to Instagram")
                                from app.models import Post
                                from app import db
                                post = Post.query.get(post_id)
                                if post:
                                    post.is_posted = True
                                    db.session.commit()
                                    logger.info(f"Updated post {post_id} status to posted")
                            else:
                                logger.error(f"Failed to post {post_id} to Instagram")
                        except Exception as thread_error:
                            logger.error(f"Exception in Instagram posting thread: {thread_error}")
                            import traceback
                            logger.error(traceback.format_exc())

                # Start Instagram posting in a background thread
                instagram_thread = threading.Thread(target=instagram_posting_thread)
                instagram_thread.daemon = True
                instagram_thread.start()

                # Set status to queued since we're posting in the background
                instagram_status = True
                response_data = {
                    'message': 'Post created successfully. Instagram posting has been queued.',
                    'post': new_post.to_dict(),
                    'instagram_status': 'queued'
                }
            except Exception as instagram_error:
                logger.error(f"Exception setting up Instagram posting: {instagram_error}")
                import traceback
                logger.error(traceback.format_exc())
                instagram_status = False
                response_data = {
                    'message': 'Post created successfully, but Instagram posting failed to start.',
                    'post': new_post.to_dict(),
                    'instagram_status': 'failed'
                }

            # Response data is already set in the try/except block above

            return jsonify(response_data), 201
    
    # Default response for posts without Instagram credentials
    response_data = {
        'message': 'Post created successfully',
        'post': new_post.to_dict(),
        'instagram_status': 'not_requested'
    }

    return jsonify(response_data), 201

@posts_bp.route('/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    """Update a specific post."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Get the post
    post = Post.query.filter_by(id=post_id, user_id=user_id).first()
    
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    
    data = request.get_json()
    
    # Update post fields
    if data.get('caption'):
        post.caption = data['caption']
    
    if data.get('post_type'):
        post.post_type = data['post_type']
    
    if data.get('scheduled_at'):
        return jsonify({'message': 'Scheduled posts are not supported'}), 400
    
    # Update the post in the database
    db.session.commit()
    
    return jsonify({
        'message': 'Post updated successfully',
        'post': post.to_dict()
    }), 200

@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """Delete a specific post."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Get the post
    post = Post.query.filter_by(id=post_id, user_id=user_id).first()
    
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    
    # Delete the post from the database
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({
        'message': 'Post deleted successfully'
    }), 200

@posts_bp.route('/<int:post_id>/post-to-instagram', methods=['POST'])
@jwt_required()
def post_to_instagram_endpoint(post_id):
    """Post a specific post to Instagram."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Get the post
    post = Post.query.filter_by(id=post_id, user_id=user_id).first()

    if not post:
        return jsonify({'message': 'Post not found'}), 404

    data = request.get_json()

    # Get Instagram credentials
    instagram_username = None
    instagram_password = None

    if data and data.get('instagram_credentials'):
        instagram_username = data['instagram_credentials'].get('username')
        instagram_password = data['instagram_credentials'].get('password')
    elif user.instagram_username:
        instagram_username = user.instagram_username
        instagram_password = user.get_instagram_password()

    if not instagram_username or not instagram_password:
        return jsonify({'message': 'Missing Instagram credentials'}), 400

    # Post to Instagram using a background thread
    logger.info(f"Posting to Instagram with username: {instagram_username}")

    try:
        # Post directly to Instagram using a thread to avoid blocking
        import threading
        from flask import current_app

        # Store the post data to avoid SQLAlchemy session issues
        post_id_copy = post.id
        post_caption = post.caption
        post_image_path = post.image_path
        post_type = post.post_type
        username_copy = instagram_username
        password_copy = instagram_password

        # Get the current app for the thread
        app = current_app._get_current_object()

        def instagram_posting_thread():
            # Create a new application context for this thread
            with app.app_context():
                try:
                    logger.info(f"Starting Instagram posting in thread for post ID: {post_id_copy}")

                    # Create a direct implementation without using the database
                    from app.utils.instagram_poster import InstagramPoster

                    # Find the image
                    import os

                    # Check if post_image_path is None
                    if not post_image_path:
                        logger.error("Post has no image path")
                        return

                    full_image_path = post_image_path

                    # Try to find the image if it doesn't exist
                    if not os.path.exists(full_image_path):
                        upload_folder = app.config['UPLOAD_FOLDER']
                        basename = os.path.basename(post_image_path)
                        possible_path = os.path.join(upload_folder, basename)
                        if os.path.exists(possible_path):
                            full_image_path = possible_path
                            logger.info(f"Found image at: {full_image_path}")

                    if not os.path.exists(full_image_path):
                        logger.error(f"Image not found at path: {full_image_path}")
                        return

                    # Convert image for Instagram
                    try:
                        from PIL import Image

                        # Open the image
                        image = Image.open(full_image_path)

                        # Convert to RGB if needed
                        if image.mode != 'RGB':
                            image = image.convert('RGB')

                        # Crop to square
                        width, height = image.size
                        min_dim = min(width, height)
                        left = (width - min_dim) // 2
                        top = (height - min_dim) // 2
                        right = left + min_dim
                        bottom = top + min_dim
                        image_cropped = image.crop((left, top, right, bottom))

                        # Resize for Instagram
                        image_resized = image_cropped.resize((1080, 1080), resample=Image.LANCZOS)

                        # Save as JPEG
                        output_dir = os.path.dirname(full_image_path)
                        name = os.path.splitext(os.path.basename(full_image_path))[0]
                        instagram_image_path = os.path.join(output_dir, f"{name}_instagram.jpg")
                        image_resized.save(instagram_image_path, 'JPEG', quality=95)
                        logger.info(f"Saved Instagram-sized image to: {instagram_image_path}")
                    except Exception as img_error:
                        logger.error(f"Error processing image: {img_error}")
                        instagram_image_path = full_image_path

                    # Use the direct Instagram poster (runs in separate process)
                    logger.info("Using direct Instagram poster (runs in separate process)")
                    success = direct_post_to_instagram(
                        full_image_path,
                        post_caption,
                        username_copy,
                        password_copy
                    )

                    # Update the post status in the database
                    if success:
                        logger.info(f"Post {post_id_copy} successfully posted to Instagram")
                        from app.models import Post
                        from app import db
                        post = Post.query.get(post_id_copy)
                        if post:
                            post.is_posted = True
                            db.session.commit()
                            logger.info(f"Updated post {post_id_copy} status to posted")
                    else:
                        logger.error(f"Failed to post {post_id_copy} to Instagram")
                except Exception as thread_error:
                    logger.error(f"Exception in Instagram posting thread: {thread_error}")
                    import traceback
                    logger.error(traceback.format_exc())

        # Start Instagram posting in a background thread
        instagram_thread = threading.Thread(target=instagram_posting_thread)
        instagram_thread.daemon = True
        instagram_thread.start()

        # Return success immediately since we're posting in the background
        return jsonify({
            'message': 'Instagram posting has been queued',
            'instagram_status': 'queued'
        }), 200
    except Exception as e:
        logger.error(f"Error setting up Instagram posting: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Failed to start Instagram posting',
            'instagram_status': 'failed'
        }), 500

# We're using direct Instagram posting with Instabot