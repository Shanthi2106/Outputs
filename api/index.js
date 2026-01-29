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

// Check for critical dependencies before loading the app
function checkDependencies() {
  const criticalDeps = ['express', 'cors', 'helmet'];
  const missingDeps = [];
  const foundDeps = [];
  
  for (const dep of criticalDeps) {
    try {
      require.resolve(dep);
      foundDeps.push(dep);
    } catch (e) {
      // Try to find in backend node_modules
      try {
        require.resolve(`../backend/node_modules/${dep}`);
        foundDeps.push(`${dep} (from backend/node_modules)`);
      } catch (e2) {
        missingDeps.push(dep);
      }
    }
  }
  
  if (foundDeps.length > 0) {
    console.log('[Vercel Function] ✓ Found dependencies:', foundDeps.join(', '));
  }
  
  if (missingDeps.length > 0) {
    console.warn('[Vercel Function] ⚠ Missing dependencies:', missingDeps.join(', '));
    console.warn('[Vercel Function] This may cause module loading to fail');
  }
  
  return { foundDeps, missingDeps };
}

// Check dependencies early
const depCheck = checkDependencies();

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
      
      // Check if it's a valid file
      const stats = fs.statSync(appPath);
      if (!stats.isFile()) {
        console.warn(`[Vercel Function] Path exists but is not a file: ${appPath}`);
        continue;
      }
      
      // Try to require the module
      try {
        app = require(appPath);
        
        // Verify that we got an Express app (should have use, get, post methods)
        if (app && typeof app === 'function') {
          // Check if it looks like an Express app
          if (app.use || app.get || app.post || app.listen) {
            loadedPath = appPath;
            console.log(`[Vercel Function] ✓ Successfully loaded Express app from: ${appPath}`);
            console.log(`[Vercel Function] App type: ${typeof app}, has use: ${!!app.use}, has get: ${!!app.get}`);
            break;
          } else {
            console.warn(`[Vercel Function] ⚠ Loaded module from ${appPath} but doesn't look like Express app`);
            console.warn(`[Vercel Function] Module type: ${typeof app}, keys: ${Object.keys(app || {}).join(', ')}`);
          }
        } else {
          console.warn(`[Vercel Function] ⚠ Loaded module from ${appPath} but it's not a function`);
          console.warn(`[Vercel Function] Module type: ${typeof app}`);
        }
      } catch (requireError) {
        // More detailed error information
        console.error(`[Vercel Function] ✗ Failed to require ${appPath}:`, {
          message: requireError.message,
          code: requireError.code,
          name: requireError.name,
          stack: requireError.stack?.split('\n').slice(0, 10).join('\n'),
        });
        
        // Check if it's a module resolution error
        if (requireError.code === 'MODULE_NOT_FOUND') {
          const missingModule = requireError.message.match(/Cannot find module ['"]([^'"]+)['"]/);
          if (missingModule) {
            console.error(`[Vercel Function] Missing module: ${missingModule[1]}`);
            console.error(`[Vercel Function] This suggests a dependency is not available in the serverless function`);
          }
        }
        continue;
      }
    }
  } catch (error) {
    console.warn(`[Vercel Function] ✗ Error checking path ${appPath}:`, {
      message: error.message,
      code: error.code,
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
      missingDependencies: depCheck.missingDeps,
      foundDependencies: depCheck.foundDeps,
    });
    
    // Additional diagnostics
    console.error('[Vercel Function] Diagnostic information:');
    try {
      const backendDir = path.join(__dirname, '../backend');
      const distDir = path.join(backendDir, 'dist');
      const nodeModulesDir = path.join(backendDir, 'node_modules');
      
      console.error(`  Backend dir exists: ${fs.existsSync(backendDir)}`);
      console.error(`  Dist dir exists: ${fs.existsSync(distDir)}`);
      console.error(`  Node modules dir exists: ${fs.existsSync(nodeModulesDir)}`);
      
      if (fs.existsSync(distDir)) {
        const distFiles = fs.readdirSync(distDir);
        console.error(`  Dist dir contents: ${distFiles.slice(0, 10).join(', ')}${distFiles.length > 10 ? '...' : ''}`);
      }
      
      if (fs.existsSync(nodeModulesDir)) {
        const nodeModules = fs.readdirSync(nodeModulesDir);
        console.error(`  Node modules count: ${nodeModules.length}`);
        console.error(`  Has express: ${nodeModules.includes('express')}`);
        console.error(`  Has cors: ${nodeModules.includes('cors')}`);
      }
    } catch (diagError) {
      console.error(`  Could not run diagnostics: ${diagError.message}`);
    }
    
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
