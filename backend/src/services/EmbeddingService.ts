import OpenAI from 'openai';
import crypto from 'crypto';
import config from '../config';
import { logger } from '../utils/logger';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

interface CacheEntry {
  embedding: number[];
  model: string;
  timestamp: number;
}

// Cache configuration
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000; // Maximum number of cached embeddings

export class EmbeddingService {
  private openaiClient?: OpenAI;
  private cache: Map<string, CacheEntry> = new Map();
  private defaultModel: string;

  // Expected dimensions for different models
  private readonly MODEL_DIMENSIONS: Record<string, number> = {
    'text-embedding-3-small': 1536,
    'text-embedding-3-large': 3072,
    'text-embedding-ada-002': 1536,
  };

  constructor() {
    if (!config.openaiApiKey) {
      logger.warn('OpenAI API key not configured. Embedding generation will fail.');
      return;
    }

    this.openaiClient = new OpenAI({
      apiKey: config.openaiApiKey,
    });

    this.defaultModel = config.embeddingModel || 'text-embedding-3-small';
    logger.info('EmbeddingService initialized', {
      model: this.defaultModel,
      expectedDimensions: this.MODEL_DIMENSIONS[this.defaultModel] || 'unknown',
    });
  }

  /**
   * Generate a cache key from text and model
   */
  private getCacheKey(text: string, model: string): string {
    const hash = crypto.createHash('sha256').update(`${model}:${text.trim()}`).digest('hex');
    return hash;
  }

  /**
   * Get cached embedding if available and not expired
   */
  private getCached(text: string, model: string): EmbeddingResult | null {
    const key = this.getCacheKey(text, model);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry is expired
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    logger.debug('Using cached embedding', { key: key.substring(0, 8) });
    return {
      embedding: entry.embedding,
      model: entry.model,
    };
  }

  /**
   * Store embedding in cache
   */
  private setCache(text: string, model: string, embedding: number[]): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.getCacheKey(text, model);
    this.cache.set(key, {
      embedding,
      model,
      timestamp: Date.now(),
    });
  }

  /**
   * Validate embedding dimensions match expected model dimensions
   */
  private validateDimensions(embedding: number[], model: string): void {
    const expectedDim = this.MODEL_DIMENSIONS[model];
    if (expectedDim && embedding.length !== expectedDim) {
      logger.warn(`Embedding dimensions mismatch: expected ${expectedDim}, got ${embedding.length} for model ${model}`);
    }
  }

  /**
   * Generate embedding for a text string
   * @param text Text to embed
   * @param model Embedding model to use (default: from config)
   * @param useCache Whether to use cache (default: true)
   * @returns Embedding vector
   */
  async generateEmbedding(
    text: string,
    model?: string,
    useCache: boolean = true
  ): Promise<EmbeddingResult> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const embeddingModel = model || this.defaultModel;

    // Check cache first
    if (useCache) {
      const cached = this.getCached(text, embeddingModel);
      if (cached) {
        return cached;
      }
    }

    try {
      logger.debug('Generating embedding', {
        textLength: text.length,
        model: embeddingModel,
        cached: false,
      });

      const response = await this.openaiClient.embeddings.create({
        model: embeddingModel,
        input: text.trim(),
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI');
      }

      // Validate dimensions
      this.validateDimensions(embedding, response.model);

      // Cache the result
      if (useCache) {
        this.setCache(text, response.model, embedding);
      }

      logger.debug('Embedding generated successfully', {
        dimensions: embedding.length,
        model: response.model,
      });

      return {
        embedding,
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      logger.error('Error generating embedding:', error);
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (error.status === 429) {
          throw new Error('Rate limit exceeded for embeddings API');
        }
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param texts Array of texts to embed
   * @param model Embedding model to use (default: from config)
   * @param useCache Whether to use cache (default: true)
   * @param batchSize Maximum batch size for API calls (default: 100)
   * @returns Array of embedding results
   */
  async generateEmbeddings(
    texts: string[],
    model?: string,
    useCache: boolean = true,
    batchSize: number = 100
  ): Promise<EmbeddingResult[]> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }

    if (texts.length === 0) {
      return [];
    }

    // Filter out empty texts
    const validTexts = texts.filter((text) => text && text.trim().length > 0);
    if (validTexts.length === 0) {
      throw new Error('No valid texts to embed');
    }

    const embeddingModel = model || this.defaultModel;
    const results: EmbeddingResult[] = [];
    const textsToEmbed: string[] = [];
    const indicesToEmbed: number[] = [];

    // Check cache for each text
    for (let i = 0; i < validTexts.length; i++) {
      const text = validTexts[i];
      if (useCache) {
        const cached = this.getCached(text, embeddingModel);
        if (cached) {
          results[i] = cached;
          continue;
        }
      }
      textsToEmbed.push(text);
      indicesToEmbed.push(i);
    }

    // If all were cached, return early
    if (textsToEmbed.length === 0) {
      return results;
    }

    try {
      logger.debug('Generating batch embeddings', {
        total: validTexts.length,
        cached: results.length,
        toGenerate: textsToEmbed.length,
        model: embeddingModel,
      });

      // Process in batches to respect API limits
      for (let i = 0; i < textsToEmbed.length; i += batchSize) {
        const batch = textsToEmbed.slice(i, i + batchSize);
        const batchIndices = indicesToEmbed.slice(i, i + batchSize);

        const response = await this.openaiClient.embeddings.create({
          model: embeddingModel,
          input: batch.map((text) => text.trim()),
        });

        // Process batch results
        for (let j = 0; j < response.data.length; j++) {
          const item = response.data[j];
          const originalIndex = batchIndices[j];
          const originalText = batch[j];

          // Validate dimensions
          this.validateDimensions(item.embedding, response.model);

          // Cache the result
          if (useCache) {
            this.setCache(originalText, response.model, item.embedding);
          }

          results[originalIndex] = {
            embedding: item.embedding,
            model: response.model,
          };
        }
      }

      logger.debug('Batch embeddings generated successfully', {
        total: results.length,
        dimensions: results[0]?.embedding.length || 0,
      });

      return results;
    } catch (error) {
      logger.error('Error generating batch embeddings:', error);
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (error.status === 429) {
          throw new Error('Rate limit exceeded for embeddings API');
        }
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Embedding cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttlMs: number;
  } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      ttlMs: CACHE_TTL_MS,
    };
  }

  /**
   * Get the default embedding model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Get expected dimensions for a model
   */
  getExpectedDimensions(model?: string): number | undefined {
    const modelName = model || this.defaultModel;
    return this.MODEL_DIMENSIONS[modelName];
  }
}

export default new EmbeddingService();
