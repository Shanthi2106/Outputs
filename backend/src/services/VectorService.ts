import { Pool } from 'pg';
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
  private pool?: Pool;
  private tableName: string = 'document_chunks';
  private isInitialized: boolean = false;
  private lastHealthCheck: Date | null = null;
  private healthStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
  private textColumnName: string = 'text'; // Will be detected during initialization

  constructor() {
    // Initialize PostgreSQL connection pool
    if (!config.databaseUrl) {
      logger.warn('DATABASE_URL not configured. Vector storage will be disabled.');
      this.healthStatus = 'unhealthy';
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle PostgreSQL client', err);
        this.healthStatus = 'unhealthy';
      });

      logger.info('VectorService initialized with PostgreSQL (pgvector)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize PostgreSQL pool:', errorMessage);
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
        errorCode === 'ETIMEDOUT' ||
        errorCode === '57P01' || // PostgreSQL: terminating connection due to administrator command
        errorCode === '57P02' || // PostgreSQL: terminating connection due to connection lost
        errorCode === '57P03') { // PostgreSQL: terminating connection due to idle-in-transaction timeout
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
   * Initialize the PostgreSQL database with pgvector extension and table
   */
  async initialize(): Promise<void> {
    if (!this.pool) {
      logger.warn('PostgreSQL pool not available. Skipping initialization.');
      this.healthStatus = 'unhealthy';
      return;
    }

    if (this.isInitialized) {
      return;
    }

    try {
      await this.retryOperation(async () => {
        const client = await this.pool!.connect();
        
        try {
          // Enable pgvector extension
          logger.info('Enabling pgvector extension...');
          await client.query('CREATE EXTENSION IF NOT EXISTS vector');
          logger.info('pgvector extension enabled');

          // Check if table exists and get its schema
          const tableExists = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            )
          `, [this.tableName]);

          if (!tableExists.rows[0].exists) {
            // Create document_chunks table with vector column
            logger.info(`Creating table: ${this.tableName}`);
            await client.query(`
              CREATE TABLE ${this.tableName} (
                id VARCHAR(255) PRIMARY KEY,
                document_id VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                embedding vector(${config.embeddingDimensions}),
                metadata JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
          } else {
            // Table exists, check and migrate schema if needed
            logger.info(`Table ${this.tableName} already exists, checking schema...`);
            
            // Get existing columns
            const existingColumns = await client.query(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = $1
            `, [this.tableName]);

            const columnNames = existingColumns.rows.map(row => row.column_name);
            
            // Check if we need to add created_at column
            if (!columnNames.includes('created_at')) {
              logger.info('Adding created_at column to existing table...');
              await client.query(`
                ALTER TABLE ${this.tableName} 
                ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              `);
            }

            // Detect text column name (chunk_text or text)
            if (columnNames.includes('chunk_text') && !columnNames.includes('text')) {
              this.textColumnName = 'chunk_text';
              logger.info('Using existing chunk_text column (will rename to text on next migration)');
            } else if (columnNames.includes('text')) {
              this.textColumnName = 'text';
            } else {
              // Neither exists, add text column
              logger.info('Adding text column...');
              await client.query(`
                ALTER TABLE ${this.tableName} 
                ADD COLUMN text TEXT
              `);
              this.textColumnName = 'text';
            }
          }

          // Create indexes (only if they don't exist)
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_${this.tableName}_document_id 
            ON ${this.tableName} (document_id)
          `);
          
          // Check if created_at column exists before creating index
          const createdAtCheck = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = $1 AND column_name = 'created_at'
            )
          `, [this.tableName]);

          if (createdAtCheck.rows[0].exists) {
            await client.query(`
              CREATE INDEX IF NOT EXISTS idx_${this.tableName}_created_at 
              ON ${this.tableName} (created_at)
            `);
          }

          // Create vector similarity search index (HNSW for better performance)
          logger.info('Creating vector similarity index...');
          try {
            await client.query(`
              CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_idx 
              ON ${this.tableName} 
              USING hnsw (embedding vector_cosine_ops)
            `);
            logger.info('HNSW index created');
          } catch (indexError: any) {
            // If HNSW is not available, fall back to ivfflat
            if (indexError.message?.includes('hnsw') || indexError.message?.includes('operator class')) {
              logger.warn('HNSW index not available, using ivfflat instead');
              await client.query(`
                CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_idx 
                ON ${this.tableName} 
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100)
              `);
            } else {
              throw indexError;
            }
          }

          logger.info(`Table ${this.tableName} ready`);
        } finally {
          client.release();
        }
      }, 'Database initialization');

      this.isInitialized = true;
      this.healthStatus = 'healthy';
      this.lastHealthCheck = new Date();
      logger.info('Vector service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Failed to initialize vector database (non-critical): ${errorMessage}`);
      
      // Provide specific guidance based on error type
      const errorString = String(error).toLowerCase();
      if (errorString.includes('extension') || errorString.includes('vector')) {
        logger.warn('pgvector extension may not be installed in your PostgreSQL database.');
        logger.warn('To install pgvector:');
        logger.warn('  1. For local PostgreSQL: Install pgvector extension');
        logger.warn('  2. For cloud providers: Ensure pgvector is enabled in your database');
        logger.warn('  3. For Neon/Supabase: pgvector is usually pre-installed');
      } else if (errorString.includes('econnrefused') || errorString.includes('connection')) {
        logger.warn('Connection failed. Please verify:');
        logger.warn(`  - DATABASE_URL is correct: ${config.databaseUrl?.replace(/:[^:@]+@/, ':****@')}`);
        logger.warn('  - PostgreSQL server is running and accessible');
      }
      
      logger.warn('Server will continue without vector database features.');
      this.healthStatus = 'unhealthy';
      this.isInitialized = false;
      // Don't throw - allow server to continue without vector database
    }
  }

  /**
   * Store document chunks as vectors in PostgreSQL
   * @param chunks Document chunks to store
   */
  async storeDocumentChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.pool) {
      logger.warn('PostgreSQL not configured. Skipping vector storage.');
      return;
    }

    if (chunks.length === 0) {
      logger.warn('No chunks to store');
      return;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

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

          const client = await this.pool!.connect();
          try {
            // Use a transaction for batch insert
            await client.query('BEGIN');

            // Prepare insert statements
            for (let i = 0; i < batch.length; i++) {
              const chunk = batch[i];
              const embedding = embeddingResults[i].embedding;
              
              // Convert embedding array to PostgreSQL vector format
              const vectorString = `[${embedding.join(',')}]`;

              await client.query(
                `INSERT INTO ${this.tableName} (id, document_id, ${this.textColumnName}, embedding, metadata)
                 VALUES ($1, $2, $3, $4::vector, $5::jsonb)
                 ON CONFLICT (id) DO UPDATE SET
                   ${this.textColumnName} = EXCLUDED.${this.textColumnName},
                   embedding = EXCLUDED.embedding,
                   metadata = EXCLUDED.metadata`,
                [
                  chunk.id,
                  chunk.metadata.documentId,
                  chunk.text,
                  vectorString,
                  JSON.stringify({
                    fileName: chunk.metadata.fileName,
                    chunkIndex: chunk.metadata.chunkIndex,
                    startChar: chunk.metadata.startChar,
                    endChar: chunk.metadata.endChar,
                    termCount: chunk.metadata.termCount || 0,
                    terms: chunk.metadata.terms || [],
                  }),
                ]
              );
            }

            await client.query('COMMIT');
            logger.debug(`Stored batch ${batchIndex + 1}/${batches.length}`);
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
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
    if (!this.pool) {
      logger.warn('PostgreSQL not configured. Returning empty search results.');
      return [];
    }

    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Generate embedding for the query
      logger.debug('Generating query embedding');
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const client = await this.pool.connect();
      try {
        // Build the query with vector similarity search
        let sqlQuery = `
          SELECT 
            id,
            document_id,
            ${this.textColumnName} as text,
            metadata,
            1 - (embedding <=> $1::vector) as similarity
          FROM ${this.tableName}
          WHERE embedding IS NOT NULL
        `;

        const queryParams: any[] = [`[${queryEmbedding.embedding.join(',')}]`];
        let paramIndex = 2;

        // Add metadata filters if provided
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            sqlQuery += ` AND metadata->>$${paramIndex} = $${paramIndex + 1}`;
            queryParams.push(key, value);
            paramIndex += 2;
          });
        }

        // Order by similarity and limit results
        sqlQuery += ` ORDER BY embedding <=> $1::vector LIMIT $${paramIndex}`;
        queryParams.push(topK);

        const result = await this.retryOperation(
          () => client.query(sqlQuery, queryParams),
          'Vector search'
        );

        // Transform results
        const results: SearchResult[] = [];
        for (const row of result.rows) {
          const score = parseFloat(row.similarity);
          
          // Filter by minimum score
          if (score < minScore) {
            continue;
          }

          const metadata = typeof row.metadata === 'string' 
            ? JSON.parse(row.metadata) 
            : row.metadata;

          results.push({
            id: row.id,
            score,
            text: row.text,
            metadata: {
              documentId: row.document_id,
              fileName: metadata.fileName || '',
              chunkIndex: metadata.chunkIndex || 0,
              startChar: metadata.startChar || 0,
              endChar: metadata.endChar || 0,
              termCount: metadata.termCount,
              terms: metadata.terms || [],
            },
          });
        }

        logger.debug(`Found ${results.length} similar chunks for query (minScore: ${minScore})`);
        this.healthStatus = 'healthy';
        this.lastHealthCheck = new Date();
        return results;
      } finally {
        client.release();
      }
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
    if (!this.pool) {
      logger.warn('PostgreSQL not configured. Skipping vector deletion.');
      return;
    }

    try {
      const client = await this.pool.connect();
      try {
        await this.retryOperation(async () => {
          await client.query(
            `DELETE FROM ${this.tableName} WHERE document_id = $1`,
            [documentId]
          );
        }, `Delete vectors for document ${documentId}`);

        logger.info(`Deleted vectors for document: ${documentId}`);
        this.healthStatus = 'healthy';
        this.lastHealthCheck = new Date();
      } finally {
        client.release();
      }
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
    return this.pool !== undefined && this.isInitialized;
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
    if (!this.pool) {
      return {
        status: 'unhealthy',
        initialized: false,
        lastCheck: null,
        collectionExists: false,
        error: 'PostgreSQL pool not initialized',
      };
    }

    try {
      const client = await this.pool.connect();
      try {
        // Check if table exists
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [this.tableName]);

        const tableExists = tableCheck.rows[0].exists;

        this.healthStatus = 'healthy';
        this.lastHealthCheck = new Date();

        return {
          status: 'healthy',
          initialized: this.isInitialized,
          lastCheck: this.lastHealthCheck,
          collectionExists: tableExists,
        };
      } finally {
        client.release();
      }
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
    if (!this.pool) {
      return {
        collectionName: this.tableName,
        error: 'PostgreSQL pool not initialized',
      };
    }

    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
        const count = parseInt(result.rows[0].count, 10);

        return {
          collectionName: this.tableName,
          count,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        collectionName: this.tableName,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default new VectorService();
