"""
Health check routes for the application.
"""
from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import psycopg2
import redis
import cohere

health_bp = Blueprint('health', __name__)

@health_bp.route('', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify the application is running.
    """
    return jsonify({
        'status': 'ok',
        'message': 'API is running'
    }), 200

@health_bp.route('/jwt', methods=['GET'])
@jwt_required()
def jwt_check():
    """
    JWT check endpoint to verify the JWT token.
    """
    from flask import request

    # Print all headers for debugging
    print("Request headers in JWT check:")
    for header, value in request.headers.items():
        # Don't print the full token for security reasons
        if header.lower() == 'authorization':
            print(f"  {header}: {value[:20]}...")
        else:
            print(f"  {header}: {value}")

    try:
        # Get the identity from the JWT token
        user_id = get_jwt_identity()
        print(f"JWT identity in health check: {user_id}, type: {type(user_id)}")

        # Get detailed information about the token
        from flask_jwt_extended import get_jwt
        jwt_data = get_jwt()
        print(f"JWT data: {jwt_data}")

        # Return detailed information
        return jsonify({
            'status': 'ok',
            'message': 'JWT token is valid',
            'user_id': user_id,
            'user_id_type': type(user_id).__name__,
            'jwt_data': {
                'type': jwt_data.get('type'),
                'fresh': jwt_data.get('fresh'),
                'iat': jwt_data.get('iat'),
                'exp': jwt_data.get('exp'),
                'nbf': jwt_data.get('nbf'),
                'jti': jwt_data.get('jti'),
            },
            'headers': {k: v for k, v in request.headers.items() if k.lower() != 'authorization'}
        }), 200
    except Exception as e:
        import traceback
        print(f"Error in JWT check: {e}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'JWT token is invalid: {str(e)}',
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc(),
            'headers': {k: v for k, v in request.headers.items() if k.lower() != 'authorization'}
        }), 401

@health_bp.route('/system', methods=['GET'])
def system_check():
    """
    System check endpoint to verify system resources.
    """
    import platform
    import psutil
    
    # Get system information
    system_info = {
        'platform': platform.platform(),
        'python_version': platform.python_version(),
        'cpu_count': os.cpu_count(),
        'memory_total': psutil.virtual_memory().total / (1024 * 1024 * 1024),  # GB
        'memory_available': psutil.virtual_memory().available / (1024 * 1024 * 1024),  # GB
        'disk_total': psutil.disk_usage('/').total / (1024 * 1024 * 1024),  # GB
        'disk_free': psutil.disk_usage('/').free / (1024 * 1024 * 1024),  # GB
    }
    
    return jsonify({
        'status': 'ok',
        'system_info': system_info
    }), 200

@health_bp.route('/database', methods=['GET'])
def database_check():
    """
    Database check endpoint to verify the database connection.
    """
    try:
        # Get database URI from config
        database_uri = current_app.config['SQLALCHEMY_DATABASE_URI']
        
        # Parse the database URI
        if '://' in database_uri:
            # Format: postgresql://username:password@host:port/dbname
            uri_parts = database_uri.split('://', 1)[1]
            user_pass, host_db = uri_parts.split('@', 1)
            
            if ':' in user_pass:
                username, password = user_pass.split(':', 1)
            else:
                username, password = user_pass, ''
            
            if '/' in host_db:
                host_port, dbname = host_db.split('/', 1)
            else:
                host_port, dbname = host_db, 'postgres'
            
            if ':' in host_port:
                host, port = host_port.split(':', 1)
            else:
                host, port = host_port, '5432'
        else:
            # Default values if parsing fails
            username = 'postgres'
            password = 'root'
            host = 'localhost'
            port = '5432'
            dbname = 'genai'
        
        # Connect to the database
        conn = psycopg2.connect(
            dbname=dbname,
            user=username,
            password=password,
            host=host,
            port=port
        )
        
        # Create a cursor
        cur = conn.cursor()
        
        # Execute a simple query
        cur.execute('SELECT 1')
        
        # Close the cursor and connection
        cur.close()
        conn.close()
        
        return jsonify({
            'status': 'ok',
            'message': 'Database connection successful'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database connection failed: {str(e)}'
        }), 500

# Redis check endpoint removed as Redis is no longer used

@health_bp.route('/cohere', methods=['GET'])
def cohere_check():
    """
    Cohere check endpoint to verify the Cohere API connection.
    """
    try:
        # Get Cohere API key from config
        cohere_api_key = current_app.config['COHERE_API_KEY']
        
        # Initialize Cohere client
        client = cohere.Client(cohere_api_key)
        
        # Generate a simple response
        response = client.generate(
            model="command-light",
            prompt="Write a short greeting",
            max_tokens=10,
            temperature=0.7,
        )
        
        return jsonify({
            'status': 'ok',
            'message': 'Cohere API connection successful',
            'response': response.generations[0].text
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Cohere API connection failed: {str(e)}'
        }), 500

@health_bp.route('/uploads', methods=['GET'])
def uploads_check():
    """
    Uploads check endpoint to verify the uploads directory.
    """
    try:
        # Get uploads directory from config
        uploads_dir = current_app.config['UPLOAD_FOLDER']
        
        # Check if the directory exists
        if not os.path.exists(uploads_dir):
            os.makedirs(uploads_dir)
            return jsonify({
                'status': 'warning',
                'message': f'Uploads directory created: {uploads_dir}'
            }), 200
        
        # Check if the directory is writable
        test_file = os.path.join(uploads_dir, 'test.txt')
        try:
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            is_writable = True
        except Exception:
            is_writable = False
        
        # Get directory stats
        dir_stats = {
            'path': os.path.abspath(uploads_dir),
            'exists': os.path.exists(uploads_dir),
            'is_dir': os.path.isdir(uploads_dir),
            'is_writable': is_writable,
            'file_count': len([f for f in os.listdir(uploads_dir) if os.path.isfile(os.path.join(uploads_dir, f))]),
        }
        
        return jsonify({
            'status': 'ok',
            'message': 'Uploads directory check successful',
            'directory': dir_stats
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Uploads directory check failed: {str(e)}'
        }), 500