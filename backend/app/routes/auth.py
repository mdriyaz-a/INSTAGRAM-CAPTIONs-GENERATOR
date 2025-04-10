from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing username or password'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({'message': 'Username already exists'}), 409
    
    # Create new user
    new_user = User(
        username=data['username'],
        password=data['password']
    )
    
    # Add user to database
    db.session.add(new_user)
    db.session.commit()
    
    # Generate access token with string identity
    access_token = create_access_token(identity=str(new_user.id))
    
    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'user': {
            'id': new_user.id,
            'username': new_user.username
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login an existing user."""
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing username or password'}), 400
    
    # Check if user exists
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    # Generate access token with string identity
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username
        }
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """Get the profile of the logged in user."""
    try:
        # Get the identity from the JWT token (should be a string)
        user_id_str = get_jwt_identity()
        print(f"JWT identity in profile: {user_id_str}, type: {type(user_id_str)}")

        # Convert to integer for database lookup
        user_id = int(user_id_str)
    except (ValueError, TypeError) as e:
        print(f"Error converting user ID to integer in profile: {e}")
        return jsonify({'message': f'Invalid user ID format'}), 401

    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'has_instagram_credentials': bool(user.instagram_username and user.instagram_password_hash),
        'created_at': user.created_at.isoformat(),
        'updated_at': user.updated_at.isoformat()
    }), 200

@auth_bp.route('/instagram-credentials', methods=['POST'])
@jwt_required()
def set_instagram_credentials():
    """Set Instagram credentials for the logged in user."""
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
    
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('instagram_username') or not data.get('instagram_password'):
        return jsonify({'message': 'Missing Instagram username or password'}), 400
    
    # Set Instagram credentials
    user.set_instagram_credentials(data['instagram_username'], data['instagram_password'])
    db.session.commit()
    
    return jsonify({
        'message': 'Instagram credentials set successfully',
        'has_instagram_credentials': True
    }), 200