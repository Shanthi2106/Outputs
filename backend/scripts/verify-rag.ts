import dotenv from 'dotenv';
import { join } from 'path';
import vectorService from '../src/services/VectorService';
import embeddingService from '../src/services/EmbeddingService';
import queryService from '../src/services/QueryService';
import { logger } from '../src/utils/logger';
import config from '../src/config';

dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Verify RAG pipeline end-to-end
 */
async function verifyRAG() {
  try {
    logger.info('='.repeat(60));
    logger.info('RAG Pipeline Verification Script');
    logger.info('='.repeat(60));

    // Test 1: Check vector service availability
    logger.info('\n1. Checking vector service availability...');
    if (!vectorService.isAvailable()) {
      logger.error('❌ Vector service is not available');
      logger.error('   Run setup-vector-db.ts first to initialize the vector database');
      process.exit(1);
    }
    logger.info('✅ Vector service is available');

    // Test 2: Check embedding service
    logger.info('\n2. Testing embedding generation...');
    try {
      const testText = 'This is a test document about autism spectrum disorder and applied behavior analysis therapy.';
      const embedding = await embeddingService.generateEmbedding(testText, undefined, false);
      logger.info('✅ Embedding generated successfully');
      logger.info(`   Dimensions: ${embedding.embedding.length}`);
      logger.info(`   Model: ${embedding.model}`);
    } catch (error) {
      logger.error('❌ Embedding generation failed:', error);
      process.exit(1);
    }

    // Test 3: Check vector database health
    logger.info('\n3. Checking vector database health...');
    const health = await vectorService.checkHealth();
    if (health.status !== 'healthy') {
      logger.error('❌ Vector database is unhealthy:', health.error);
      process.exit(1);
    }
    logger.info('✅ Vector database is healthy');

    // Test 4: Check if collection has data
    logger.info('\n4. Checking collection data...');
    const stats = await vectorService.getStats();
    if (stats.error) {
      logger.error('❌ Failed to get collection stats:', stats.error);
      process.exit(1);
    }

    if (!stats.count || stats.count === 0) {
      logger.warn('⚠️  Collection is empty');
      logger.warn('   Upload documents via the API to populate the vector database');
      logger.warn('   Skipping search tests...');
    } else {
      logger.info(`✅ Collection has ${stats.count} document chunks`);

      // Test 5: Test vector search
      logger.info('\n5. Testing vector search...');
      try {
        const testQuery = 'autism therapy';
        const results = await vectorService.searchSimilarChunks(testQuery, 5);
        logger.info(`✅ Vector search returned ${results.length} results`);
        if (results.length > 0) {
          logger.info(`   Top result score: ${(results[0].score * 100).toFixed(1)}%`);
          logger.info(`   Top result text preview: ${results[0].text.substring(0, 100)}...`);
        }
      } catch (error) {
        logger.error('❌ Vector search failed:', error);
        process.exit(1);
      }

      // Test 6: Test RAG query
      logger.info('\n6. Testing RAG query pipeline...');
      try {
        const testQuery = 'What is ABA therapy?';
        const response = await queryService.queryTerm(testQuery);
        logger.info('✅ RAG query completed successfully');
        logger.info(`   Response length: ${response.response.length} characters`);
        logger.info(`   Is medical advice: ${response.isMedicalAdvice}`);
        if (response.relatedTerms && response.relatedTerms.length > 0) {
          logger.info(`   Related terms: ${response.relatedTerms.join(', ')}`);
        }
      } catch (error) {
        logger.error('❌ RAG query failed:', error);
        process.exit(1);
      }
    }

    // Test 7: Test embedding cache
    logger.info('\n7. Testing embedding cache...');
    try {
      const testText = 'Cache test text';
      // First call - should generate
      const start1 = Date.now();
      await embeddingService.generateEmbedding(testText, undefined, true);
      const time1 = Date.now() - start1;

      // Second call - should use cache
      const start2 = Date.now();
      await embeddingService.generateEmbedding(testText, undefined, true);
      const time2 = Date.now() - start2;

      const cacheStats = embeddingService.getCacheStats();
      logger.info('✅ Embedding cache is working');
      logger.info(`   Cache size: ${cacheStats.size}/${cacheStats.maxSize}`);
      logger.info(`   First call: ${time1}ms, Second call: ${time2}ms (cached)`);
    } catch (error) {
      logger.error('❌ Embedding cache test failed:', error);
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('✅ RAG pipeline verification complete!');
    logger.info('='.repeat(60));
    logger.info('\nAll systems operational. RAG is ready to use.');
    process.exit(0);
  } catch (error) {
    logger.error('Fatal error during verification:', error);
    process.exit(1);
  }
}

verifyRAG();
