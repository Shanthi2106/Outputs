// Vercel serverless function entry point
// This file imports the compiled Express app from backend/dist

const path = require('path');
const fs = require('fs');

// Log environment info for debugging
console.log('[Vercel Function] Environment:', {
  __dirname: __dirname,
  cwd: process.cwd(),
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

// Try multiple paths to find the backend dist
const possiblePaths = [
  // Standard Vercel structure (api/index.js looking for backend/dist)
  path.join(__dirname, '../backend/dist/index.js'),
  // Alternative Vercel structure
  path.join(process.cwd(), 'backend/dist/index.js'),
  // Root dist (if backend is at root)
  path.join(process.cwd(), 'dist/index.js'),
  // Relative paths
  './backend/dist/index.js',
  '../backend/dist/index.js',
  // Absolute paths
  path.resolve(__dirname, '../backend/dist/index.js'),
  path.resolve(process.cwd(), 'backend/dist/index.js'),
];

// Log all paths we'll try
console.log('[Vercel Function] Searching for backend in paths:');
possiblePaths.forEach((p, i) => {
  const exists = fs.existsSync(p);
  console.log(`  ${i + 1}. ${p} ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
});

let app;
let loadedPath = null;

// Try to load the Express app from various possible locations
for (const appPath of possiblePaths) {
  try {
    if (fs.existsSync(appPath)) {
      console.log(`[Vercel Function] Attempting to load from: ${appPath}`);
      app = require(appPath);
      loadedPath = appPath;
      console.log(`[Vercel Function] ✓ Successfully loaded Express app from: ${appPath}`);
      break;
    }
  } catch (error) {
    console.warn(`[Vercel Function] ✗ Failed to load from ${appPath}:`, {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
    continue;
  }
}

// If app still not loaded, try requiring without checking existence (might work with module resolution)
if (!app) {
  console.log('[Vercel Function] App not found via file system, trying module resolution...');
  
  // List directory contents for debugging
  try {
    const backendDir = path.join(__dirname, '../backend');
    const distDir = path.join(backendDir, 'dist');
    console.log('[Vercel Function] Checking directories:');
    console.log(`  backend dir exists: ${fs.existsSync(backendDir)}`);
    if (fs.existsSync(backendDir)) {
      console.log(`  backend dir contents: ${fs.readdirSync(backendDir).join(', ')}`);
    }
    console.log(`  dist dir exists: ${fs.existsSync(distDir)}`);
    if (fs.existsSync(distDir)) {
      console.log(`  dist dir contents: ${fs.readdirSync(distDir).join(', ')}`);
    }
  } catch (dirError) {
    console.warn('[Vercel Function] Could not list directories:', dirError.message);
  }
  
  // Try different require paths
  const requirePaths = [
    '../backend/dist/index.js',
    '../backend/dist',
    'backend/dist/index.js',
    'backend/dist',
    './backend/dist/index.js',
  ];
  
  for (const requirePath of requirePaths) {
    try {
      console.log(`[Vercel Function] Trying require('${requirePath}')...`);
      app = require(requirePath);
      loadedPath = requirePath;
      console.log(`[Vercel Function] ✓ Successfully loaded via require('${requirePath}')`);
      break;
    } catch (requireError) {
      console.warn(`[Vercel Function] ✗ require('${requirePath}') failed:`, requireError.message);
    }
  }
  
  if (!app) {
    console.error('[Vercel Function] ❌ All attempts to load Express app failed');
    console.error('[Vercel Function] Error summary:', {
      searchedPaths: possiblePaths,
      triedRequires: requirePaths,
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
            details: 'Express module not found. Backend may not have built correctly.',
            paths: possiblePaths,
            cwd: process.cwd(),
            __dirname: __dirname,
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
        details: 'Backend dist/index.js not found. Check build logs.',
        paths: possiblePaths,
        cwd: process.cwd(),
        __dirname: __dirname,
        troubleshooting: 'See FIX_VERCEL_BACKEND_LOADING.md for debugging steps',
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
  
  // When using rewrites, Vercel passes the full path including /api
  // But we need to ensure Express receives the correct path
  const incomingUrl = req.url || req.originalUrl || '';
  const incomingOriginalUrl = req.originalUrl || req.url || '';
  
  // If the URL doesn't start with /api, it means Vercel stripped it
  // We need to reconstruct the full path
  if (!incomingUrl.startsWith('/api') && !incomingOriginalUrl.startsWith('/api')) {
    // Vercel rewrite stripped /api, add it back
    // The rewrite pattern is /api/:path*, so the path after /api is what we get
    req.url = '/api' + (incomingUrl.startsWith('/') ? incomingUrl : '/' + incomingUrl);
    req.originalUrl = req.url;
    console.log(`[Vercel Function] Added /api prefix: ${req.url}`);
  } else {
    // URL already has /api, ensure originalUrl is set
    if (!req.originalUrl) {
      req.originalUrl = req.url;
    }
    // Ensure url and originalUrl match if they should
    if (req.url !== req.originalUrl && !req.originalUrl.startsWith('/api')) {
      req.originalUrl = req.url;
    }
  }
  
  console.log(`[Vercel Function] Final URL: ${req.url}`);
  console.log(`[Vercel Function] Final originalUrl: ${req.originalUrl}`);
  
  // Ensure the Express app handles the request
  try {
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Function] Error handling request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
};

module.exports = handler;
