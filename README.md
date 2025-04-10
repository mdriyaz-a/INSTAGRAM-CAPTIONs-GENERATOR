# Instagram Caption Generator and Poster

A full-stack application that generates creative Instagram captions using AI and allows users to post directly to Instagram.

## Features

- User registration and login
- Image upload with preview
- AI-powered image description extraction using BLIP model
- Creative caption generation using Cohere API
- Multiple caption styles (casual, formal, poetic, humorous, inspirational)
- Hashtag recommendations
- Emoji suggestions
- Direct posting to Instagram
- Scheduled posting
- Post history management

## Tech Stack

### Backend
- Flask (Python web framework)
- SQLAlchemy (ORM for PostgreSQL)
- Flask-JWT-Extended (Authentication)
- BLIP (Image captioning model)
- Cohere API (Text generation)
- Instabot (Instagram posting)

### Frontend
- React
- Material-UI (Component library)
- React Router (Navigation)
- Axios (API requests)

## Setup Instructions

### Quick Start
For a quick start, you can use the provided scripts:
- Windows: Run `run_app.bat`
- macOS/Linux: Run `chmod +x run_app.sh && ./run_app.sh`

These scripts will set up the environment and start both the backend and frontend servers.

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL
- Redis

### Database Setup
The application uses a PostgreSQL database named "genai" with two tables:
- `users`: Stores user information and credentials
- `posts`: Stores post details and history

The tables will be created automatically by SQLAlchemy when the application starts.

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the backend directory with the following variables:
   ```
   FLASK_ENV=development
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret-key
   DATABASE_URI=postgresql://username:password@localhost/genai
   UPLOAD_FOLDER=uploads
   COHERE_API_KEY=l8IhCmwkYHXCdwRBsDmxArV282nxz2U0KgviiEaj
   ```

6. Create the uploads directory:
   ```
   mkdir uploads
   ```

7. Update the database schema (if you encounter NOT NULL constraint errors):
   ```
   python update_schema.py
   ```

8. **Important Note about AI Models**: The application uses the BLIP image captioning model from Hugging Face. The model files are large (>900MB) and are not included in the Git repository. When you first run the application, it will automatically download the model files to the `backend/model_cache` directory. This may take some time depending on your internet connection.

9. Run the Flask application:
   ```
   python run.py
   ```

   **Note**: The Flask application includes an integrated scheduler for Instagram posting and scheduled posts.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create logo files:
   - Open `public/logo-placeholder.html` in a browser
   - Take screenshots of the logo and save them as:
     - `public/logo192.png` (192x192 pixels)
     - `public/logo512.png` (512x512 pixels)
   - Alternatively, you can use any image editing software to create these logo files

4. Start the development server:
   ```
   npm start
   ```

5. The application will be available at http://localhost:3000

## Usage

1. Register a new account or log in with existing credentials
2. Upload an image or enter text to generate captions
3. Select from multiple caption options
4. Edit the caption if needed
5. Post directly to Instagram or schedule for later
6. View your post history

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/profile`: Get user profile
- `POST /api/auth/instagram-credentials`: Set Instagram credentials

### Captions
- `POST /api/captions/generate`: Generate captions from image or text
- `GET /api/captions/styles`: Get available caption styles

### Posts
- `GET /api/posts`: Get all posts for the user
- `GET /api/posts/<post_id>`: Get a specific post
- `POST /api/posts`: Create a new post
- `PUT /api/posts/<post_id>`: Update a post
- `DELETE /api/posts/<post_id>`: Delete a post
- `POST /api/posts/<post_id>/post-to-instagram`: Post to Instagram

## Troubleshooting

If you encounter any issues while setting up or running the application, please refer to the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide.

## License

This project is licensed under the MIT License.