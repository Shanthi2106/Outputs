import { Router, Request, Response } from 'express';
import config from '../../config';
import knowledgeBaseService from '../../services/KnowledgeBaseService';
import vectorService from '../../services/VectorService';
import vectorStoreService from '../../services/VectorStoreService';
import embeddingService from '../../services/EmbeddingService';
import { logger } from '../../utils/logger';

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
      vectorDatabase: {
        postgresAvailable: vectorService.isAvailable(),
        pineconeAvailable: vectorStoreService.isAvailable(),
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

/**
 * GET /api/v1/health/vector-db
 * Vector database health check
 */
router.get('/vector-db', async (req: Request, res: Response) => {
  try {
    // Check PostgreSQL vector storage (for document chunks)
    const postgresHealth = await vectorService.checkHealth();
    const postgresStats = await vectorService.getStats();

    // Check Pinecone (for term storage)
    const pineconeAvailable = vectorStoreService.isAvailable();

    // Check embedding service
    const embeddingModel = embeddingService.getDefaultModel();
    const embeddingDimensions = embeddingService.getExpectedDimensions();
    const cacheStats = embeddingService.getCacheStats();

    const health = {
      status: postgresHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      postgres: {
        configured: !!config.databaseUrl,
        available: vectorService.isAvailable(),
        status: postgresHealth.status,
        initialized: postgresHealth.initialized,
        tableExists: postgresHealth.collectionExists,
        tableName: postgresStats.collectionName,
        documentChunks: postgresStats.count,
        error: postgresHealth.error,
      },
      pinecone: {
        configured: !!config.pineconeApiKey,
        available: pineconeAvailable,
      },
      embeddings: {
        model: embeddingModel,
        expectedDimensions: embeddingDimensions,
        cacheSize: cacheStats.size,
        cacheMaxSize: cacheStats.maxSize,
      },
    };

    // Return 200 if healthy, 503 if degraded
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Error checking vector database health:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
