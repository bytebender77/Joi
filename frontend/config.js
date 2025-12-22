// Configuration for Joi Frontend
// Update BACKEND_URL to your deployed backend URL

const CONFIG = {
    // For local development
    // BACKEND_URL: 'ws://localhost:8000'

    // For production - UPDATE THIS after deploying backend to Render
    BACKEND_URL: 'wss://your-backend-name.onrender.com'
};

// Don't modify below this line
window.JOI_CONFIG = CONFIG;
