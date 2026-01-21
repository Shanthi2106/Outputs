import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { logger } from './utils/logger';
import rateLimitMiddleware from './api/middleware/rateLimit.middleware';

// Import routes
import queryRoutes from './api/routes/query.routes';
import conversationRoutes from './api/routes/conversation.routes';
import feedbackRoutes from './api/routes/feedback.routes';
import healthRoutes from './api/routes/health.routes';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  logger.info(`AI Provider: ${config.aiProvider}`);
  logger.info(`CORS Origin: ${config.corsOrigin}`);
});

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
