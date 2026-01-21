import { Router, Request, Response } from 'express';
import config from '../../config';
import knowledgeBaseService from '../../services/KnowledgeBaseService';

const router = Router();

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '1.0.0',
    services: {
      ai: {
        provider: config.aiProvider,
        configured: !!(
          config.aiProvider === 'openai'
            ? config.openaiApiKey
            : config.anthropicApiKey
        ),
      },
      knowledgeBase: {
        termsLoaded: knowledgeBaseService.getAllTerms().length,
      },
    },
  };

  res.json(health);
});

/**
 * GET /api/v1/health/ready
 * Readiness check (for Kubernetes/load balancers)
 */
router.get('/ready', (req: Request, res: Response) => {
  // Check if all critical services are ready
  const termsLoaded = knowledgeBaseService.getAllTerms().length > 0;
  const aiConfigured = !!(
    config.aiProvider === 'openai'
      ? config.openaiApiKey
      : config.anthropicApiKey
  );

  const isReady = termsLoaded && aiConfigured;

  if (isReady) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      issues: {
        termsLoaded,
        aiConfigured,
      },
    });
  }
});

/**
 * GET /api/v1/health/live
 * Liveness check (for Kubernetes)
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;
