from datetime import datetime, timezone
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

# Helper function to get current time with timezone
def get_current_time():
    return datetime.now(timezone.utc)

class User(db.Model):
    """User model for storing user related details."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    instagram_username = db.Column(db.String(64), nullable=True)
    instagram_password_hash = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=get_current_time)
    updated_at = db.Column(db.DateTime, default=get_current_time, onupdate=get_current_time)
    
    # Relationship with posts
    posts = db.relationship('Post', backref='user', lazy='dynamic')
    
    def __init__(self, username, password, instagram_username=None, instagram_password=None):
        self.username = username
        self.password_hash = generate_password_hash(password)
        if instagram_username:
            self.instagram_username = instagram_username
        if instagram_password:
            self.instagram_password_hash = generate_password_hash(instagram_password)
    
    def set_password(self, password):
        """Set user password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if password is correct."""
        return check_password_hash(self.password_hash, password)
    
    def set_instagram_credentials(self, username, password):
        """Set Instagram credentials."""
        self.instagram_username = username
        self.instagram_password_hash = generate_password_hash(password)
    
    def get_instagram_password(self):
        """Get Instagram password (for internal use only)."""
        return self.instagram_password_hash
    
    def __repr__(self):
        return f'<User {self.username}>'

class Post(db.Model):
    """Post model for storing post related details."""
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    image_path = db.Column(db.String(256), nullable=True)
    image_description = db.Column(db.Text, nullable=True)
    caption = db.Column(db.Text, nullable=False)
    post_type = db.Column(db.String(10), nullable=False, default='post')  # 'post' or 'story'
    is_posted = db.Column(db.Boolean, default=False)
    scheduled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=get_current_time)
    updated_at = db.Column(db.DateTime, default=get_current_time, onupdate=get_current_time)
    
    def __repr__(self):
        return f'<Post {self.id}>'
    
    def to_dict(self):
        """Convert post to dictionary."""
        # Process image path to make it compatible with frontend
        image_path = self.image_path
        if image_path:
            # Extract just the filename from the path
            import os
            # Replace backslashes with forward slashes for consistency
            image_path = image_path.replace('\\', '/')
            # Just use the basename to avoid path issues
            image_path = os.path.basename(image_path)

        return {
            'id': self.id,
            'user_id': self.user_id,
            'image_path': image_path,
            'image_description': self.image_description,
            'caption': self.caption,
            'post_type': self.post_type,
            'is_posted': self.is_posted,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }