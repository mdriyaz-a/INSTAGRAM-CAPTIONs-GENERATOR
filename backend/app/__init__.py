import os
import logging
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class=None):
    """Create and configure the Flask application."""
    app = Flask(__name__, static_folder='../static')
    
    # Load configuration
    if config_class is None:
        # Import here to avoid circular imports
        from config import get_config
        app.config.from_object(get_config())
    else:
        app.config.from_object(config_class)
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)

    # Configure JWT
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1 hour
    app.config['JWT_ERROR_MESSAGE_KEY'] = 'msg'  # Key for error messages

    # Initialize JWT
    jwt.init_app(app)

    # Add JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        # Log the error
        print(f"JWT unauthorized: No token provided or token is invalid")
        return jsonify({
            'msg': 'Missing Authorization Header',
            'error': 'authorization_required'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        # Log the error
        print(f"JWT invalid token: {callback}")
        return jsonify({
            'msg': 'Invalid token',
            'error': 'invalid_token'
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        # Log the error
        print(f"JWT expired token: {jwt_payload}")
        return jsonify({
            'msg': 'Token has expired',
            'error': 'token_expired'
        }), 401

    # Configure CORS with more options
    CORS(app,
         resources={r"/api/*": {
             "origins": ["http://localhost:3000"],
             "supports_credentials": True,
             "allow_headers": ["Content-Type", "Authorization"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
         }},
         expose_headers=["Content-Type", "Authorization"])

    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # No scheduler initialization needed
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.posts import posts_bp
    from app.routes.captions import captions_bp
    from app.routes.health import health_bp
    from app.routes.uploads import uploads_bp
    from app.routes.test import test_bp

    # Import simple_captions blueprint with error handling
    try:
        from app.routes.simple_captions import simple_captions_bp
        has_simple_captions = True
    except ImportError as e:
        print(f"Warning: Could not import simple_captions_bp: {e}")
        has_simple_captions = False

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(captions_bp, url_prefix='/api/captions')
    app.register_blueprint(uploads_bp, url_prefix='/api/uploads')
    app.register_blueprint(test_bp, url_prefix='/api/test')

    # Register simple_captions blueprint if available
    if has_simple_captions:
        app.register_blueprint(simple_captions_bp, url_prefix='/api/simple-captions')

    app.register_blueprint(health_bp, url_prefix='/api/health')

    # Print registered blueprints for debugging
    print("Registered blueprints:")
    for blueprint in app.blueprints:
        print(f"  {blueprint} -> {app.blueprints[blueprint].url_prefix}")
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    return app