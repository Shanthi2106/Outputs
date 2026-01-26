// Vercel serverless function entry point
// This file imports the compiled Express app from backend/dist

const app = require('../backend/dist/index.js');

// Export the Express app for Vercel
// Vercel will automatically handle routing when using rewrites
module.exports = app;
