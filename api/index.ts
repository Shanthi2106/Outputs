// Vercel serverless function entry point
// This file is in the /api directory for Vercel to detect it as a serverless function

// Import the Express app from backend
import app from '../backend/src/index';

// Export the app for Vercel's serverless function handler
export default app;
