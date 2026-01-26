// Vercel serverless function entry point
// This file imports the compiled Express app from backend/dist

const app = require('../backend/dist/index.js');

// Export the default export from the compiled backend
module.exports = app.default || app;
