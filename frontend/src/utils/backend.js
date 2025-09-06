// Utility to get backend URL and port from environment variables
export const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '8000';
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://localhost:${BACKEND_PORT}`;
