import os
import logging
from flask import Blueprint, render_template, current_app, jsonify, send_from_directory, Response

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

test_bp = Blueprint('test', __name__)

@test_bp.route('/images', methods=['GET'])
def test_images():
    """Test page for images."""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    logger.info(f"Upload folder: {upload_folder}")

    # Check if the upload folder exists
    if not os.path.exists(upload_folder):
        return f"Upload folder does not exist: {upload_folder}"

    # Get all image files
    image_files = []
    for root, dirs, files in os.walk(upload_folder):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, upload_folder)
                exists = os.path.exists(file_path)
                readable = os.access(file_path, os.R_OK)

                image_files.append({
                    'filename': file,
                    'path': relative_path,
                    'full_path': file_path,
                    'exists': exists,
                    'readable': readable,
                    'url': f"/api/uploads/{file}"
                })

    # Create a simple HTML page
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Images</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1 {{ color: #333; }}
            .image-container {{ display: flex; flex-wrap: wrap; gap: 20px; }}
            .image-card {{ border: 1px solid #ddd; padding: 10px; border-radius: 5px; width: 300px; }}
            img {{ max-width: 100%; height: auto; }}
            .error {{ color: red; }}
            .success {{ color: green; }}
            .file-info {{ font-family: monospace; background: #f5f5f5; padding: 5px; }}
        </style>
    </head>
    <body>
        <h1>Test Images</h1>
        <p><strong>Upload folder:</strong> {upload_folder}</p>
        <p><strong>Upload folder exists:</strong> {os.path.exists(upload_folder)}</p>
        <p><strong>Upload folder is readable:</strong> {os.access(upload_folder, os.R_OK)}</p>
        <p><strong>Current working directory:</strong> {os.getcwd()}</p>
        <p><strong>Number of image files found:</strong> {len(image_files)}</p>

        <h2>Image Files</h2>
        <div class="image-container">
    """

    for image in image_files:
        html += f"""
        <div class="image-card">
            <h3>{image['filename']}</h3>
            <div class="file-info">
                <p><strong>Path:</strong> {image['path']}</p>
                <p><strong>Full path:</strong> {image['full_path']}</p>
                <p><strong>File exists:</strong> <span class="{'success' if image['exists'] else 'error'}">{image['exists']}</span></p>
                <p><strong>File readable:</strong> <span class="{'success' if image['readable'] else 'error'}">{image['readable']}</span></p>
            </div>
            <h4>Image Tests</h4>
            <p>Standard URL: <a href="http://localhost:5000{image['url']}" target="_blank">View Image</a></p>
            <img src="http://localhost:5000{image['url']}" alt="{image['filename']}" style="max-width: 100px; max-height: 100px;" onerror="this.onerror=null; this.src='https://placehold.co/300x200?text=Image+Not+Found'; this.nextElementSibling.style.display='block';">
            <p class="error" style="display:none;">Error loading with standard URL!</p>

            <p>Direct URL: <a href="http://localhost:5000/api/uploads/direct/uploads/{image['filename']}" target="_blank">View Direct Image</a></p>
            <img src="http://localhost:5000/api/uploads/direct/uploads/{image['filename']}" alt="{image['filename']}" style="max-width: 100px; max-height: 100px;" onerror="this.onerror=null; this.src='https://placehold.co/300x200?text=Image+Not+Found'; this.nextElementSibling.style.display='block';">
            <p class="error" style="display:none;">Error loading with direct URL!</p>

            <p>Base64 Embedded:</p>
            <img src="data:image/jpeg;base64,{get_image_base64(image['full_path'])}" alt="{image['filename']}" style="max-width: 100px; max-height: 100px;">
        </div>
        """

    html += """
        </div>
    </body>
    </html>
    """

    return html

def get_image_base64(file_path):
    """Convert an image file to base64 for direct embedding."""
    try:
        import base64
        if os.path.exists(file_path) and os.access(file_path, os.R_OK):
            with open(file_path, 'rb') as f:
                image_data = f.read()
                return base64.b64encode(image_data).decode('utf-8')
        return ""
    except Exception as e:
        logger.error(f"Error reading image file {file_path}: {e}")
        return ""

@test_bp.route('/upload', methods=['GET', 'POST'])
def test_upload():
    """Test page for uploading images."""
    from flask import request

    upload_folder = current_app.config['UPLOAD_FOLDER']

    # Handle file upload
    message = ""
    if request.method == 'POST':
        if 'file' not in request.files:
            message = "No file part"
        else:
            file = request.files['file']
            if file.filename == '':
                message = "No selected file"
            else:
                # Ensure upload folder exists
                os.makedirs(upload_folder, exist_ok=True)

                # Save the file
                file_path = os.path.join(upload_folder, file.filename)
                file.save(file_path)
                message = f"File uploaded successfully to {file_path}"

    # Create a simple HTML page
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Upload</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1 {{ color: #333; }}
            .success {{ color: green; }}
            .error {{ color: red; }}
            form {{ margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <h1>Test Upload</h1>
        <p><strong>Upload folder:</strong> {upload_folder}</p>
        <p><strong>Upload folder exists:</strong> {os.path.exists(upload_folder)}</p>
        <p><strong>Upload folder is writable:</strong> {os.access(upload_folder, os.W_OK)}</p>

        {f'<p class="{"success" if "successfully" in message else "error"}">{message}</p>' if message else ''}

        <form method="post" enctype="multipart/form-data">
            <h2>Upload a new image</h2>
            <p><input type="file" name="file" accept="image/*"></p>
            <p><input type="submit" value="Upload"></p>
        </form>

        <p><a href="/api/test/images">View all images</a></p>
    </body>
    </html>
    """

    return html

@test_bp.route('/direct-image/<path:filename>', methods=['GET'])
def direct_image(filename):
    """Serve an image file directly."""
    try:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        file_path = os.path.join(upload_folder, filename)

        logger.info(f"Attempting to serve direct image: {file_path}")
        logger.info(f"File exists: {os.path.exists(file_path)}")
        logger.info(f"File is readable: {os.access(file_path, os.R_OK)}")

        if os.path.exists(file_path) and os.access(file_path, os.R_OK):
            with open(file_path, 'rb') as f:
                image_data = f.read()

            # Determine content type based on extension
            content_type = 'image/jpeg'  # Default
            if file_path.lower().endswith('.png'):
                content_type = 'image/png'
            elif file_path.lower().endswith('.gif'):
                content_type = 'image/gif'

            return Response(image_data, mimetype=content_type)
        else:
            return f"File not found or not readable: {file_path}", 404
    except Exception as e:
        logger.error(f"Error serving direct image {filename}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return f"Error: {str(e)}", 500