// Vercel serverless function entry point
// This file imports the compiled Express app from backend/dist

const path = require('path');
const fs = require('fs');

// Try multiple paths to find the backend dist
const possiblePaths = [
  path.join(__dirname, '../backend/dist/index.js'),
  path.join(process.cwd(), 'backend/dist/index.js'),
  path.join(process.cwd(), 'dist/index.js'),
  './backend/dist/index.js',
];

let app;
let loadedPath = null;

// Try to load the Express app from various possible locations
for (const appPath of possiblePaths) {
  try {
    if (fs.existsSync(appPath)) {
      console.log(`[Vercel Function] Loading Express app from: ${appPath}`);
      app = require(appPath);
      loadedPath = appPath;
      break;
    }
  } catch (error) {
    console.warn(`[Vercel Function] Failed to load from ${appPath}:`, error.message);
    continue;
  }
}

// If app still not loaded, try requiring without checking existence (might work with module resolution)
if (!app) {
  try {
    console.log('[Vercel Function] Attempting to require backend/dist/index.js');
    app = require('../backend/dist/index.js');
    loadedPath = '../backend/dist/index.js';
  } catch (error) {
    console.error('[Vercel Function] Failed to load Express app:', error);
    console.error('[Vercel Function] Error details:', {
      message: error.message,
      stack: error.stack,
      cwd: process.cwd(),
      __dirname: __dirname,
    });
    
    // Create a minimal error handler app
    // Try to require express from backend node_modules or root
    let express;
    try {
      express = require('express');
    } catch (e) {
      try {
        express = require('../backend/node_modules/express');
      } catch (e2) {
        console.error('[Vercel Function] Express not available, using basic handler');
        // Fallback: return a basic handler function
        app = (req, res) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Backend not available',
            message: 'Failed to load Express app in serverless function',
            details: error.message,
            paths: possiblePaths,
          }));
        };
        return;
      }
    }
    
    const errorApp = express();
    errorApp.use((req, res) => {
      res.status(500).json({
        error: 'Backend not available',
        message: 'Failed to load Express app in serverless function',
        details: error.message,
        paths: possiblePaths,
        cwd: process.cwd(),
        __dirname: __dirname,
      });
    });
    app = errorApp;
  }
}

if (loadedPath) {
  console.log(`[Vercel Function] Successfully loaded Express app from: ${loadedPath}`);
} else {
  console.error('[Vercel Function] Using error handler app - backend not found');
}

// Export the Express app for Vercel
// Vercel will automatically handle routing when using rewrites
// Wrap in a handler function to ensure proper request handling
const handler = (req, res) => {
  // Log the incoming request for debugging
  console.log(`[Vercel Function] Incoming request: ${req.method} ${req.url}`);
  console.log(`[Vercel Function] Original URL: ${req.originalUrl || req.url}`);
  console.log(`[Vercel Function] Path: ${req.path || req.url}`);
  
  // When using rewrites, Vercel might strip the /api prefix
  // We need to ensure the path includes /api for Express routing
  const originalUrl = req.originalUrl || req.url;
  if (!originalUrl.startsWith('/api')) {
    // If the path doesn't start with /api, add it back
    req.url = '/api' + originalUrl;
    req.originalUrl = '/api' + originalUrl;
  } else {
    // Ensure req.originalUrl is set
    if (!req.originalUrl) {
      req.originalUrl = req.url;
    }
  }
  
  console.log(`[Vercel Function] Adjusted URL: ${req.url}`);
  console.log(`[Vercel Function] Adjusted originalUrl: ${req.originalUrl}`);
  
  // Ensure the Express app handles the request
  return app(req, res);
};

module.exports = handler;
