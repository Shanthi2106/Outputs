import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { logger } from './utils/logger';
import rateLimitMiddleware from './api/middleware/rateLimit.middleware';
import vectorService from './services/VectorService';

// Startup banner
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Backend Server Starting...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

logger.info('Initializing backend server...');
logger.info('Step 1: Loading configuration');

// Import routes
logger.info('Step 2: Loading route modules...');
import queryRoutes from './api/routes/query.routes';
import conversationRoutes from './api/routes/conversation.routes';
import feedbackRoutes from './api/routes/feedback.routes';
import healthRoutes from './api/routes/health.routes';
import documentRoutes from './api/routes/document.routes';
logger.info('Step 2: Route modules loaded');

logger.info('Step 3: Initializing Express application...');
const app: Application = express();

// Middleware
logger.info('Step 4: Configuring middleware...');
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
logger.info('Step 4: Middleware configured');

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Rate limiting (apply to API routes only)
app.use('/api/v1', rateLimitMiddleware);

// Health check endpoint (no rate limiting)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API root - info endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'AI-Powered Parent Assistant for Autism API',
    version: '1.0.0',
    endpoints: {
      queryTerm: 'POST /api/v1/query/term',
      queryContext: 'POST /api/v1/query/context',
      conversation: 'POST /api/v1/conversation',
      feedback: 'POST /api/v1/feedback',
      health: 'GET /health',
      healthReady: 'GET /api/v1/health/ready',
      healthLive: 'GET /api/v1/health/live',
    },
    documentation: 'See README.md for full API documentation',
  });
});

// API Routes
app.use('/api/v1/query', queryRoutes);
app.use('/api/v1/conversation', conversationRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/document', documentRoutes);
app.use('/api/v1', healthRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Initialize vector service (non-blocking - server will work without it)
logger.info('Step 6: Initializing vector service...');
vectorService.initialize().catch((error) => {
  // This should not happen now since initialize() handles errors internally,
  // but keeping as a safety net
  logger.error('Unexpected error in vector service initialization:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

logger.info('Step 6: Vector service initialization started (non-blocking)');

// Start server with error handling
logger.info('Step 7: Starting HTTP server...');
let server;
try {
  server = app.listen(config.port, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✓ Server Started Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    logger.info(`AI Provider: ${config.aiProvider}`);
    logger.info(`CORS Origin: ${config.corsOrigin}`);
    logger.info(`Health check: http://localhost:${config.port}/health`);
    logger.info(`API base URL: http://localhost:${config.port}/api/v1`);
    console.log(`  Server URL: http://localhost:${config.port}`);
    console.log(`  Health Check: http://localhost:${config.port}/health`);
    console.log(`  API Base: http://localhost:${config.port}/api/v1`);
    console.log('');
    
    // Check vector service status
    if (vectorService.isAvailable()) {
      logger.info('Vector database (Chroma RAG) is available');
    } else {
      logger.warn('Vector database (Chroma RAG) is not available - configure CHROMA_URL to enable');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  });

  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${config.port} is already in use!`);
      logger.error('This usually means:');
      logger.error('  1. Another instance of the server is already running');
      logger.error('  2. Another application is using port ' + config.port);
      logger.error('');
      logger.error('To fix this:');
      logger.error('  - Close other terminal windows running the server');
      logger.error('  - Or change PORT in your .env file to a different port');
      logger.error('  - Or find and stop the process using: netstat -ano | findstr :' + config.port);
      process.exit(1);
    } else if (error.code === 'EACCES') {
      logger.error(`Permission denied: Cannot bind to port ${config.port}`);
      logger.error('This usually means you need administrator privileges or the port is restricted');
      logger.error('Try running with administrator privileges or use a port above 1024');
      process.exit(1);
    } else {
      logger.error('Server error:', error);
      process.exit(1);
    }
  });
} catch (error) {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✗ Server Startup Failed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  logger.error('Failed to start server:', error);
  if (error instanceof Error) {
    console.error('Error:', error.message);
    logger.error('Error message:', error.message);
    logger.error('Stack trace:', error.stack);
  }
  console.log('');
  console.log('Check the error messages above for details.');
  console.log('Run diagnose-backend.bat or test-backend-startup.bat for help.');
  console.log('');
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
