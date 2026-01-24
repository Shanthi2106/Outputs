import dotenv from 'dotenv';
import { join } from 'path';
import embeddingService from '../src/services/EmbeddingService';
import vectorStoreService from '../src/services/VectorStoreService';
import knowledgeBaseService from '../src/services/KnowledgeBaseService';
import { logger } from '../src/utils/logger';

dotenv.config({ path: join(__dirname, '../.env') });

async function populateVectors() {
  try {
    logger.info('Starting vector database population...');

    // Check if vector store is available
    if (!vectorStoreService.isAvailable()) {
      logger.error('Vector store is not available. Please configure Pinecone in .env');
      logger.error('Required: PINECONE_API_KEY');
      process.exit(1);
    }

    // Initialize index
    logger.info('Initializing Pinecone index...');
    await vectorStoreService.initializeIndex();
    
    // Wait a moment for index to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get all terms from knowledge base
    const terms = knowledgeBaseService.getAllTerms();
    logger.info(`Found ${terms.length} terms to index`);

    if (terms.length === 0) {
      logger.warn('No terms found in knowledge base');
      process.exit(0);
    }

    // Process terms in batches
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < terms.length; i += batchSize) {
      const batch = terms.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(terms.length / batchSize);
      
      logger.info(`Processing batch ${batchNum}/${totalBatches} (${batch.length} terms)`);

      for (const term of batch) {
        try {
          // Create text representation for embedding
          const textForEmbedding = `${term.term} ${term.fullName} ${term.plainLanguage} ${term.definition} ${term.examples.join(' ')}`;
          
          // Generate embedding
          const embeddingResult = await embeddingService.generateEmbedding(textForEmbedding);
          
          // Upsert to vector store
          await vectorStoreService.upsertTerm(term, embeddingResult.embedding);
          
          successCount++;
          logger.info(`✓ Indexed: ${term.term} (${successCount}/${terms.length})`);
        } catch (error) {
          failCount++;
          logger.error(`✗ Failed to index term ${term.term}:`, error);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < terms.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('='.repeat(50));
    logger.info(`Vector database population complete!`);
    logger.info(`Successfully indexed: ${successCount} terms`);
    if (failCount > 0) {
      logger.warn(`Failed to index: ${failCount} terms`);
    }
    logger.info('='.repeat(50));
    process.exit(0);
  } catch (error) {
    logger.error('Error populating vector database:', error);
    process.exit(1);
  }
}

populateVectors();
