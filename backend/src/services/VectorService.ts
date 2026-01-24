import { ChromaClient } from 'chromadb';
import config from '../config';
import { logger } from '../utils/logger';
import embeddingService from './EmbeddingService';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const BATCH_SIZE = 100; // Process chunks in batches to avoid memory issues

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    documentId: string;
    fileName: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    termCount?: number;
    terms?: string[];
  };
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata: DocumentChunk['metadata'];
}

export class VectorService {
  private chromaClient?: ChromaClient;
  private collectionName: string;
  private isInitialized: boolean = false;
  private lastHealthCheck: Date | null = null;
  private healthStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';

  constructor() {
    this.collectionName = config.chromaCollectionName || 'autism-documents';

    // Check if ChromaDB is configured (cloud or local)
    const hasLocalChroma = config.chromaUrl && config.chromaUrl.trim() !== '';
    const hasValidApiKey = config.chromaApiKey && 
                           config.chromaApiKey.trim() !== '' && 
                           !config.chromaApiKey.toLowerCase().includes('your_api_key') &&
                           !config.chromaApiKey.toLowerCase().includes('placeholder');
    const hasCloudChroma = config.chromaHost && hasValidApiKey;

    if (!hasLocalChroma && !hasCloudChroma) {
      if (config.chromaHost && !hasValidApiKey) {
        logger.warn('ChromaDB Cloud host configured but API key is missing or invalid.');
        logger.warn('Please set CHROMA_API_KEY to a valid API key, or use local ChromaDB with CHROMA_URL.');
      }
      logger.info('ChromaDB disabled. Vector embeddings will be generated but not stored in ChromaDB.');
      logger.info('EmbeddingService is still available for generating embeddings.');
      this.healthStatus = 'unhealthy';
      return;
    }

    try {
      // Prioritize cloud configuration over local
      if (hasCloudChroma) {
        // ChromaDB Cloud configuration
        const clientConfig: any = {
          host: config.chromaHost,
          port: 443,
          ssl: true,
          headers: {
            'Authorization': `Bearer ${config.chromaApiKey}`,
            'X-Chroma-Token': config.chromaApiKey, // Also include for compatibility
          },
        };

        // Add tenant and database if provided
        if (config.chromaTenant) {
          clientConfig.tenant = config.chromaTenant;
        }
        if (config.chromaDatabase) {
          clientConfig.database = config.chromaDatabase;
        }

        this.chromaClient = new ChromaClient(clientConfig);
        logger.info('VectorService initialized with ChromaDB Cloud', {
          host: config.chromaHost,
          tenant: config.chromaTenant || 'default',
          database: config.chromaDatabase || 'default',
          collection: this.collectionName,
        });
      } else if (hasLocalChroma) {
        // Local ChromaDB configuration
        this.chromaClient = new ChromaClient({
          path: config.chromaUrl,
        });
        logger.info('VectorService initialized with ChromaDB (local)', {
          url: config.chromaUrl,
          collection: this.collectionName,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize Chroma client:', errorMessage);
      if (hasCloudChroma) {
        logger.error('ChromaDB Cloud connection failed. Please verify:');
        logger.error(`  - CHROMA_HOST: ${config.chromaHost}`);
        logger.error(`  - CHROMA_API_KEY: ${config.chromaApiKey ? '***' + config.chromaApiKey.slice(-4) : 'NOT SET'}`);
        logger.error(`  - CHROMA_TENANT: ${config.chromaTenant || 'NOT SET'}`);
        logger.error(`  - CHROMA_DATABASE: ${config.chromaDatabase || 'NOT SET'}`);
      }
      this.healthStatus = 'unhealthy';
    }
  }

  /**
   * Retry wrapper for operations that may fail transiently
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isTransientError = this.isTransientError(error);

        if (!isTransientError || attempt === retries) {
          logger.error(`${operationName} failed after ${attempt} attempts:`, lastError);
          throw lastError;
        }

        const delay = RETRY_DELAY_MS * attempt;
        logger.warn(`${operationName} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error(`${operationName} failed after ${retries} attempts`);
  }

  /**
   * Check if an error is transient and worth retrying
   */
  private isTransientError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.status;

    // Network errors
    if (errorMessage.includes('econnrefused') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ETIMEDOUT') {
      return true;
    }

    // Rate limiting
    if (errorCode === 429 || errorMessage.includes('rate limit')) {
      return true;
    }

    // Server errors (5xx)
    if (errorCode >= 500 && errorCode < 600) {
      return true;
    }

    return false;
  }

  /**
   * Initialize the Chroma collection (get or create)
   */
  async initialize(): Promise<void> {
    if (!this.chromaClient) {
      logger.warn('Chroma client not available. Skipping initialization.');
      this.healthStatus = 'unhealthy';
      return;
    }

    if (this.isInitialized) {
      return;
    }

    try {
      await this.retryOperation(async () => {
        // Use getOrCreateCollection to avoid race conditions and duplicate errors
        // This method will return existing collection or create a new one
        logger.info(`Getting or creating Chroma collection: ${this.collectionName}`);
        try {
          const collection = await this.chromaClient!.getOrCreateCollection({
            name: this.collectionName,
            metadata: {
              description: 'Document chunks for autism-related documents',
              created: new Date().toISOString(),
            },
          });
          logger.info(`Chroma collection ${this.collectionName} ready`);
        } catch (error: any) {
          // Handle ChromaUniqueError or similar errors if collection already exists
          const errorMessage = error?.message || String(error);
          const errorName = error?.name || '';
          
          // Check if it's a unique constraint error (collection already exists)
          if (errorName.includes('Unique') || 
              errorName.includes('ChromaUniqueError') ||
              errorMessage.toLowerCase().includes('already exists') ||
              errorMessage.toLowerCase().includes('unique constraint') ||
              errorMessage.toLowerCase().includes('duplicate')) {
            // Collection already exists, try to get it instead
            logger.info(`Collection ${this.collectionName} already exists, retrieving it...`);
            const collection = await this.chromaClient!.getCollection({ name: this.collectionName });
            logger.info(`Retrieved existing Chroma collection: ${this.collectionName}`);
          } else {
            // Different error, re-throw it
            throw error;
          }
        }
      }, 'Collection initialization');

      this.isInitialized = true;
      this.healthStatus = 'healthy';
      this.lastHealthCheck = new Date();
      logger.info('Vector service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorString = String(error).toLowerCase();
      
      logger.warn(`Failed to initialize vector database (non-critical): ${errorMessage}`);
      
      // Provide specific guidance based on error type
      if (errorString.includes('unauthorized') || errorString.includes('401') || errorString.includes('authentication')) {
        logger.warn('Authentication failed. Please verify your CHROMA_API_KEY is correct.');
        if (config.chromaHost) {
          logger.warn('For ChromaDB Cloud, ensure your API key is valid and has access to the specified tenant/database.');
        }
      } else if (errorString.includes('econnrefused') || errorString.includes('connection') || errorString.includes('network')) {
        logger.warn('Connection failed. Please verify:');
        if (config.chromaHost) {
          logger.warn(`  - ChromaDB Cloud host is reachable: ${config.chromaHost}`);
          logger.warn('  - Your network allows HTTPS connections to ChromaDB Cloud');
        } else {
          logger.warn('  - ChromaDB server is running (for local: docker run -p 8000:8000 chromadb/chroma)');
          logger.warn(`  - CHROMA_URL is correct: ${config.chromaUrl}`);
        }
      }
      
      logger.warn('Server will continue without vector database features.');
      logger.warn('To enable vector database features:');
      logger.warn('  Local: Start ChromaDB server: docker run -p 8000:8000 chromadb/chroma');
      logger.warn('         Then set CHROMA_URL=http://localhost:8000 in your .env file');
      logger.warn('  Cloud: Set CHROMA_HOST, CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE in your .env file');
      logger.warn('  If using ChromaDB in browser, set CHROMA_SERVER_CORS_ALLOW_ORIGINS environment variable');
      this.healthStatus = 'unhealthy';
      this.isInitialized = false;
      // Don't throw - allow server to continue without vector database
    }
  }

  /**
   * Get the Chroma collection with retry logic
   * Falls back to getOrCreateCollection if collection doesn't exist
   */
  private async getCollection() {
    if (!this.chromaClient) {
      throw new Error('Chroma client not initialized. Please configure CHROMA_URL.');
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    return await this.retryOperation(async () => {
      try {
        return await this.chromaClient!.getCollection({ name: this.collectionName });
      } catch (error: any) {
        // If collection doesn't exist, try to get or create it
        const errorMessage = error?.message || String(error);
        if (errorMessage.toLowerCase().includes('not found') || 
            errorMessage.toLowerCase().includes('does not exist')) {
          logger.warn(`Collection ${this.collectionName} not found, creating it...`);
          return await this.chromaClient!.getOrCreateCollection({
            name: this.collectionName,
            metadata: {
              description: 'Document chunks for autism-related documents',
              created: new Date().toISOString(),
            },
          });
        }
        throw error;
      }
    }, 'Get collection');
  }

  /**
   * Store document chunks as vectors in Chroma
   * @param chunks Document chunks to store
   */
  async storeDocumentChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.chromaClient) {
      logger.warn('Chroma not configured. Skipping vector storage.');
      return;
    }

    if (chunks.length === 0) {
      logger.warn('No chunks to store');
      return;
    }

    try {
      const collection = await this.getCollection();

      // Process chunks in batches to avoid memory issues
      const batches = [];
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        batches.push(chunks.slice(i, i + BATCH_SIZE));
      }

      logger.info(`Storing ${chunks.length} chunks in ${batches.length} batch(es)`);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        logger.debug(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} chunks)`);

        await this.retryOperation(async () => {
          // Generate embeddings for batch
          const texts = batch.map((chunk) => chunk.text);
          const embeddingResults = await embeddingService.generateEmbeddings(texts);

          // Prepare data for Chroma
          const ids = batch.map((chunk) => chunk.id);
          const embeddings = embeddingResults.map((result) => result.embedding);
          const documents = batch.map((chunk) => chunk.text);
          const metadatas = batch.map((chunk) => ({
            documentId: chunk.metadata.documentId,
            fileName: chunk.metadata.fileName,
            chunkIndex: chunk.metadata.chunkIndex.toString(),
            startChar: chunk.metadata.startChar.toString(),
            endChar: chunk.metadata.endChar.toString(),
            termCount: chunk.metadata.termCount?.toString() || '0',
            terms: chunk.metadata.terms?.join(',') || '',
          }));

          // Add vectors to collection
          await collection.add({
            ids,
            embeddings,
            documents,
            metadatas,
          });

          logger.debug(`Stored batch ${batchIndex + 1}/${batches.length}`);
        }, `Store batch ${batchIndex + 1}`);
      }

      logger.info(`Successfully stored ${chunks.length} document chunks in vector database`);
      this.healthStatus = 'healthy';
      this.lastHealthCheck = new Date();
    } catch (error) {
      logger.error('Error storing document chunks:', error);
      this.healthStatus = 'unhealthy';
      throw new Error(`Failed to store document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for relevant document chunks using semantic similarity
   * @param query Search query text
   * @param topK Number of results to return (default: 5)
   * @param filter Optional metadata filter
   * @param minScore Optional minimum similarity score threshold (0-1)
   * @returns Array of search results sorted by relevance
   */
  async searchSimilarChunks(
    query: string,
    topK: number = 5,
    filter?: Record<string, any>,
    minScore: number = 0.0
  ): Promise<SearchResult[]> {
    if (!this.chromaClient) {
      logger.warn('Chroma not configured. Returning empty search results.');
      return [];
    }

    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const collection = await this.getCollection();

      // Generate embedding for the query
      logger.debug('Generating query embedding');
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Build query request
      const queryRequest: any = {
        queryEmbeddings: [queryEmbedding.embedding],
        nResults: topK,
        include: ['documents', 'metadatas', 'distances'],
      };

      if (filter) {
        queryRequest.where = filter;
      }

      // Search Chroma with retry
      const searchResponse = await this.retryOperation(
        () => collection.query(queryRequest),
        'Vector search'
      );

      // Transform results
      const results: SearchResult[] = [];
      const documents = searchResponse.documents?.[0] || [];
      const metadatas = searchResponse.metadatas?.[0] || [];
      const distances = searchResponse.distances?.[0] || [];
      const ids = searchResponse.ids?.[0] || [];

      for (let i = 0; i < documents.length; i++) {
        const metadata = metadatas[i] || {};
        const distance = distances[i] || 0;
        // Convert distance to similarity score (1 - distance for cosine similarity)
        const score = 1 - distance;

        // Filter by minimum score
        if (score < minScore) {
          continue;
        }

        results.push({
          id: ids[i] || '',
          score,
          text: documents[i] || '',
          metadata: {
            documentId: metadata.documentId as string || '',
            fileName: metadata.fileName as string || '',
            chunkIndex: parseInt(metadata.chunkIndex as string || '0', 10),
            startChar: parseInt(metadata.startChar as string || '0', 10),
            endChar: parseInt(metadata.endChar as string || '0', 10),
            termCount: metadata.termCount ? parseInt(metadata.termCount as string, 10) : undefined,
            terms: metadata.terms ? (metadata.terms as string).split(',').filter((t) => t.length > 0) : undefined,
          },
        });
      }

      logger.debug(`Found ${results.length} similar chunks for query (minScore: ${minScore})`);
      this.healthStatus = 'healthy';
      this.lastHealthCheck = new Date();
      return results;
    } catch (error) {
      logger.error('Error searching similar chunks:', error);
      this.healthStatus = 'unhealthy';
      // Don't throw - return empty results to allow fallback
      return [];
    }
  }

  /**
   * Delete all vectors for a specific document
   * @param documentId Document ID to delete
   */
  async deleteDocumentVectors(documentId: string): Promise<void> {
    if (!this.chromaClient) {
      logger.warn('Chroma not configured. Skipping vector deletion.');
      return;
    }

    try {
      const collection = await this.getCollection();

      await this.retryOperation(async () => {
        // Delete by metadata filter
        await collection.delete({
          where: {
            documentId: { $eq: documentId },
          },
        });
      }, `Delete vectors for document ${documentId}`);

      logger.info(`Deleted vectors for document: ${documentId}`);
      this.healthStatus = 'healthy';
      this.lastHealthCheck = new Date();
    } catch (error) {
      logger.error(`Error deleting vectors for document ${documentId}:`, error);
      this.healthStatus = 'unhealthy';
      // Don't throw - allow operation to continue
    }
  }

  /**
   * Check if vector service is available
   */
  isAvailable(): boolean {
    return this.chromaClient !== undefined && this.isInitialized;
  }

  /**
   * Check the health of the vector database connection
   * @returns Health status information
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'unknown';
    initialized: boolean;
    lastCheck: Date | null;
    collectionExists: boolean;
    error?: string;
  }> {
    if (!this.chromaClient) {
      return {
        status: 'unhealthy',
        initialized: false,
        lastCheck: null,
        collectionExists: false,
        error: 'Chroma client not initialized',
      };
    }

    try {
      const collections = await this.chromaClient.listCollections();
      const collectionExists = collections.some((col) => col.name === this.collectionName);

      this.healthStatus = 'healthy';
      this.lastHealthCheck = new Date();

      return {
        status: 'healthy',
        initialized: this.isInitialized,
        lastCheck: this.lastHealthCheck,
        collectionExists,
      };
    } catch (error) {
      this.healthStatus = 'unhealthy';
      return {
        status: 'unhealthy',
        initialized: this.isInitialized,
        lastCheck: this.lastHealthCheck,
        collectionExists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    collectionName: string;
    count?: number;
    error?: string;
  }> {
    if (!this.chromaClient) {
      return {
        collectionName: this.collectionName,
        error: 'Chroma client not initialized',
      };
    }

    try {
      const collection = await this.getCollection();
      const count = await collection.count();

      return {
        collectionName: this.collectionName,
        count,
      };
    } catch (error) {
      return {
        collectionName: this.collectionName,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default new VectorService();
