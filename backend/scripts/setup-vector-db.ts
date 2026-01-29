import dotenv from 'dotenv';
import { join } from 'path';
import vectorService from '../src/services/VectorService';
import embeddingService from '../src/services/EmbeddingService';
import { logger } from '../src/utils/logger';
import config from '../src/config';

dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Setup and verify vector database connection
 */
async function setupVectorDatabase() {
  try {
    logger.info('='.repeat(60));
    logger.info('Vector Database Setup Script');
    logger.info('='.repeat(60));

    // Check if PostgreSQL (vector DB) is configured
    if (!config.databaseUrl) {
      logger.error('❌ DATABASE_URL not configured in .env file');
      logger.error('   Please set DATABASE_URL (e.g., postgresql://localhost:5432/autism_assistant)');
      process.exit(1);
    }

    logger.info(`Database URL: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

    // Check if vector service is available
    if (!vectorService.isAvailable()) {
      logger.warn('⚠️  Vector service not initialized. Attempting to initialize...');
    }

    // Initialize vector service
    logger.info('\n1. Initializing vector database...');
    try {
      await vectorService.initialize();
      logger.info('✅ Vector database initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize vector database:', error);
      logger.error('\nTroubleshooting:');
      logger.error('  - Ensure PostgreSQL is running and pgvector extension is installed');
      logger.error('  - Check your DATABASE_URL configuration in .env');
      logger.error('  - Run: CREATE EXTENSION IF NOT EXISTS vector; in your database');
      process.exit(1);
    }

    // Check health
    logger.info('\n2. Checking vector database health...');
    const health = await vectorService.checkHealth();
    if (health.status === 'healthy') {
      logger.info('✅ Vector database is healthy');
      logger.info(`   Collection exists: ${health.collectionExists}`);
      logger.info(`   Initialized: ${health.initialized}`);
    } else {
      logger.error('❌ Vector database health check failed:', health.error);
      process.exit(1);
    }

    // Get statistics
    logger.info('\n3. Getting collection statistics...');
    const stats = await vectorService.getStats();
    if (stats.error) {
      logger.warn('⚠️  Could not get statistics:', stats.error);
    } else {
      logger.info(`✅ Collection: ${stats.collectionName}`);
      logger.info(`   Document chunks: ${stats.count || 0}`);
    }

    // Verify embedding service
    logger.info('\n4. Verifying embedding service...');
    if (!config.openaiApiKey) {
      logger.error('❌ OPENAI_API_KEY not configured');
      logger.error('   Embeddings cannot be generated without OpenAI API key');
      process.exit(1);
    }

    try {
      const testEmbedding = await embeddingService.generateEmbedding('test', undefined, false);
      const expectedDim = embeddingService.getExpectedDimensions();
      logger.info('✅ Embedding service is working');
      logger.info(`   Model: ${embeddingService.getDefaultModel()}`);
      logger.info(`   Dimensions: ${testEmbedding.embedding.length}`);
      if (expectedDim && testEmbedding.embedding.length !== expectedDim) {
        logger.warn(`⚠️  Dimension mismatch: expected ${expectedDim}, got ${testEmbedding.embedding.length}`);
      }
    } catch (error) {
      logger.error('❌ Embedding service test failed:', error);
      process.exit(1);
    }

    // Verify embedding dimensions match config
    logger.info('\n5. Verifying configuration...');
    const embeddingDim = config.embeddingDimensions;
    const expectedDim = embeddingService.getExpectedDimensions();
    if (expectedDim && embeddingDim !== expectedDim) {
      logger.warn(`⚠️  EMBEDDING_DIMENSIONS in config (${embeddingDim}) doesn't match model (${expectedDim})`);
      logger.warn(`   Consider updating EMBEDDING_DIMENSIONS to ${expectedDim}`);
    } else {
      logger.info('✅ Configuration is valid');
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('✅ Vector database setup complete!');
    logger.info('='.repeat(60));
    logger.info('\nNext steps:');
    logger.info('  - Upload documents via the API to populate the vector database');
    logger.info('  - Use the verify-rag.ts script to test the RAG pipeline');
    process.exit(0);
  } catch (error) {
    logger.error('Fatal error during setup:', error);
    process.exit(1);
  }
}

setupVectorDatabase();
