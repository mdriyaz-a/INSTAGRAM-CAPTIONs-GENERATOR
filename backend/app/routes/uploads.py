import os
import logging
import json
from flask import Blueprint, send_from_directory, current_app, abort, jsonify

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

uploads_bp = Blueprint('uploads', __name__)

@uploads_bp.route('/', methods=['GET'])
def list_uploads():
    """List all uploaded files."""
    try:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        logger.info(f"Listing files in upload folder: {upload_folder}")

        # Check if the upload folder exists
        if not os.path.exists(upload_folder):
            logger.error(f"Upload folder does not exist: {upload_folder}")
            return jsonify({
                'error': f"Upload folder does not exist: {upload_folder}",
                'files': []
            }), 500

        # List all files in the upload folder
        files = []
        for root, dirs, filenames in os.walk(upload_folder):
            for filename in filenames:
                file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(file_path, upload_folder)
                files.append({
                    'filename': filename,
                    'path': relative_path,
                    'full_path': file_path,
                    'url': f"/api/uploads/{filename}"
                })

        # Also list all files in the current directory
        current_dir = os.getcwd()
        logger.info(f"Current working directory: {current_dir}")

        current_dir_files = []
        for root, dirs, filenames in os.walk(current_dir):
            for filename in filenames:
                if any(filename.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                    file_path = os.path.join(root, filename)
                    current_dir_files.append({
                        'filename': filename,
                        'full_path': file_path
                    })

        return jsonify({
            'upload_folder': upload_folder,
            'files': files,
            'current_dir': current_dir,
            'current_dir_files': current_dir_files
        })
    except Exception as e:
        logger.error(f"Error listing uploads: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'files': []
        }), 500
    except Exception as e:
        logger.error(f"Error listing uploads: {e}")

@uploads_bp.route('/placeholder', methods=['GET'])
def serve_placeholder():
    """Serve a placeholder image."""
    try:
        # Create a simple placeholder image using PIL
        from PIL import Image, ImageDraw, ImageFont
        import io

        # Create a new image with a white background
        img = Image.new('RGB', (400, 300), color=(240, 240, 240))
        d = ImageDraw.Draw(img)

        # Add text
        d.text((150, 150), "No Image", fill=(0, 0, 0))

        # Save the image to a bytes buffer
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)

        # Return the image
        from flask import Response
        return Response(buf.getvalue(), mimetype='image/jpeg')
    except Exception as e:
        logger.error(f"Error creating placeholder image: {e}")
        import traceback
        logger.error(traceback.format_exc())
        abort(404)

@uploads_bp.route('/any-image', methods=['GET'])
def serve_any_image():
    """Serve any image file from the uploads folder."""
    try:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        logger.info(f"Serving any image from upload folder: {upload_folder}")

        # Find any image file
        for root, dirs, files in os.walk(upload_folder):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                    file_path = os.path.join(root, file)
                    logger.info(f"Found image file: {file_path}")

                    # Try to read the file directly
                    try:
                        with open(file_path, 'rb') as f:
                            image_data = f.read()

                        # Determine content type based on extension
                        content_type = 'image/jpeg'  # Default
                        if file.lower().endswith('.png'):
                            content_type = 'image/png'
                        elif file.lower().endswith('.gif'):
                            content_type = 'image/gif'

                        from flask import Response
                        return Response(image_data, mimetype=content_type)
                    except Exception as file_error:
                        logger.error(f"Error reading file {file_path}: {file_error}")
                        continue

        # If no image found, abort
        logger.error("No image files found in upload folder")
        abort(404)
    except Exception as e:
        logger.error(f"Error serving any image: {e}")
        import traceback
        logger.error(traceback.format_exc())
        abort(404)

@uploads_bp.route('/direct/<path:filename>', methods=['GET'])
def serve_direct(filename):
    """Serve files directly from the current working directory."""
    try:
        logger.info(f"Serving file directly: {filename}")

        # Get the current working directory
        cwd = os.getcwd()
        logger.info(f"Current working directory: {cwd}")

        # Try to find the file in the current working directory
        file_path = os.path.join(cwd, filename)
        logger.info(f"Looking for file at: {file_path}")

        if os.path.exists(file_path) and os.path.isfile(file_path):
            logger.info(f"File found: {file_path}")

            # Try to read the file directly
            try:
                with open(file_path, 'rb') as f:
                    file_data = f.read()

                # Determine content type based on extension
                content_type = 'application/octet-stream'  # Default
                if file_path.lower().endswith(('.jpg', '.jpeg')):
                    content_type = 'image/jpeg'
                elif file_path.lower().endswith('.png'):
                    content_type = 'image/png'
                elif file_path.lower().endswith('.gif'):
                    content_type = 'image/gif'

                from flask import Response
                return Response(file_data, mimetype=content_type)
            except Exception as file_error:
                logger.error(f"Error reading file {file_path}: {file_error}")
                return f"Error reading file: {str(file_error)}", 500
        else:
            logger.error(f"File not found: {file_path}")
            return f"File not found: {file_path}", 404
    except Exception as e:
        logger.error(f"Error serving file {filename}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return f"Error: {str(e)}", 500

@uploads_bp.route('/<path:filename>', methods=['GET'])
def serve_upload(filename):
    """Serve uploaded files."""
    try:
        logger.info(f"Serving uploaded file: {filename}")

        # Get the current working directory
        cwd = os.getcwd()
        logger.info(f"Current working directory: {cwd}")

        # Try different paths to find the file
        possible_paths = [
            os.path.join(cwd, 'uploads', filename),  # Try uploads folder in current directory
            os.path.join(cwd, filename),  # Try directly in current directory
            os.path.join(cwd, 'backend', 'uploads', filename),  # Try backend/uploads
            os.path.join(cwd, 'backend', filename)  # Try backend directory
        ]

        # Also try with just the basename
        basename = os.path.basename(filename)
        possible_paths.append(os.path.join(cwd, 'uploads', basename))
        possible_paths.append(os.path.join(cwd, basename))
        possible_paths.append(os.path.join(cwd, 'backend', 'uploads', basename))
        possible_paths.append(os.path.join(cwd, 'backend', basename))

        # Log all possible paths
        logger.info("Trying the following paths:")
        for path in possible_paths:
            logger.info(f"  {path} - Exists: {os.path.exists(path)}")

        # Try each path
        for file_path in possible_paths:
            if os.path.exists(file_path) and os.path.isfile(file_path):
                logger.info(f"File found at: {file_path}")

                # Try to read the file directly
                try:
                    with open(file_path, 'rb') as f:
                        file_data = f.read()

                    # Determine content type based on extension
                    content_type = 'application/octet-stream'  # Default
                    if file_path.lower().endswith(('.jpg', '.jpeg')):
                        content_type = 'image/jpeg'
                    elif file_path.lower().endswith('.png'):
                        content_type = 'image/png'
                    elif file_path.lower().endswith('.gif'):
                        content_type = 'image/gif'

                    from flask import Response
                    return Response(file_data, mimetype=content_type)
                except Exception as file_error:
                    logger.error(f"Error reading file {file_path}: {file_error}")
                    # Continue to next path

        # If still not found, try to find any image file in the uploads directory
        uploads_dir = os.path.join(cwd, 'uploads')
        if os.path.exists(uploads_dir) and os.path.isdir(uploads_dir):
            logger.info(f"Looking for any image file in: {uploads_dir}")
            for root, dirs, files in os.walk(uploads_dir):
                for file in files:
                    if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                        file_path = os.path.join(root, file)
                        logger.info(f"Found image file: {file_path}")

                        # Try to read the file
                        try:
                            with open(file_path, 'rb') as f:
                                file_data = f.read()

                            # Determine content type
                            content_type = 'image/jpeg'  # Default
                            if file_path.lower().endswith('.png'):
                                content_type = 'image/png'
                            elif file_path.lower().endswith('.gif'):
                                content_type = 'image/gif'

                            from flask import Response
                            return Response(file_data, mimetype=content_type)
                        except Exception as file_error:
                            logger.error(f"Error reading file {file_path}: {file_error}")
                            # Continue to next file

        # If still not found, return a placeholder image
        logger.error(f"File not found after searching all paths: {filename}")
        return serve_placeholder()
    except Exception as e:
        logger.error(f"Error serving uploaded file {filename}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return serve_placeholder()