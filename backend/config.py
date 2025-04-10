import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a4b92b1b5a7e91c96e2f4b0facc8b37c9c3e5a49d2f45758cb8cc49b1729832a')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'a4b92b1b5a7e91d76e2f4b0facc8b37c9c3e5a49d2f45758cb8cc49b1729832a')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI', 'postgresql://postgres:root@localhost:5432/genai')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Use an absolute path for the upload folder
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.abspath(os.path.join(os.path.dirname(__file__), 'uploads')))
    COHERE_API_KEY = os.environ.get('COHERE_API_KEY', '')

    # Instagram Configuration
    INSTAGRAM_USERNAME = os.environ.get('INSTAGRAM_USERNAME', '')
    INSTAGRAM_PASSWORD = os.environ.get('INSTAGRAM_PASSWORD', '')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    
    # In production, ensure these are set in environment variables
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI')

# Set the configuration based on the environment
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Return the appropriate configuration object based on the environment."""
    config_name = os.environ.get('FLASK_ENV', 'default')
    return config.get(config_name, config['default'])