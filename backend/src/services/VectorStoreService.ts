import { Pinecone } from '@pinecone-database/pinecone';
import config from '../config';
import { logger } from '../utils/logger';
import { Term } from './KnowledgeBaseService';

export interface VectorSearchResult {
  term: Term;
  score: number;
}

export class VectorStoreService {
  private pineconeClient?: Pinecone;
  private indexName: string;
  private isEnabled: boolean;

  constructor() {
    this.indexName = config.pineconeIndex || 'autism-terms';
    this.isEnabled = !!config.pineconeApiKey;

    if (this.isEnabled && config.pineconeApiKey) {
      try {
        this.pineconeClient = new Pinecone({
          apiKey: config.pineconeApiKey,
        });
        logger.info('VectorStoreService initialized with Pinecone');
      } catch (error) {
        logger.error('Failed to initialize Pinecone:', error);
        this.isEnabled = false;
      }
    } else {
      logger.warn('Pinecone not configured - RAG features will be disabled');
      this.isEnabled = false;
    }
  }

  /**
   * Check if vector store is enabled
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }

  /**
   * Upsert a term into the vector store
   */
  async upsertTerm(term: Term, embedding: number[]): Promise<void> {
    if (!this.isEnabled || !this.pineconeClient) {
      return;
    }

    try {
      const index = this.pineconeClient.index(this.indexName);
      
      // Create text representation of the term for metadata
      const textContent = `${term.term} ${term.fullName} ${term.plainLanguage} ${term.definition} ${term.examples.join(' ')}`;
      
      await index.upsert([
        {
          id: `term-${term.term.toLowerCase()}`,
          values: embedding,
          metadata: {
            term: term.term,
            fullName: term.fullName,
            category: term.category,
            plainLanguage: term.plainLanguage.substring(0, 500), // Limit metadata size
            definition: term.definition.substring(0, 500),
            examples: term.examples.join(' | ').substring(0, 500),
            relatedTerms: term.relatedTerms.join(', '),
            documentTypes: term.documentTypes.join(', '),
          },
        },
      ]);

      logger.debug(`Upserted term: ${term.term}`);
    } catch (error) {
      logger.error(`Error upserting term ${term.term}:`, error);
      throw error;
    }
  }

  /**
   * Search for similar terms using a query embedding
   */
  async searchSimilarTerms(
    queryEmbedding: number[],
    topK: number = 5
  ): Promise<VectorSearchResult[]> {
    if (!this.isEnabled || !this.pineconeClient) {
      return [];
    }

    try {
      const index = this.pineconeClient.index(this.indexName);
      
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      const results: VectorSearchResult[] = queryResponse.matches
        .filter(match => match.metadata)
        .map(match => {
          const metadata = match.metadata as any;
          return {
            term: {
              term: metadata.term,
              fullName: metadata.fullName,
              category: metadata.category,
              definition: metadata.definition || '',
              plainLanguage: metadata.plainLanguage || '',
              examples: metadata.examples ? metadata.examples.split(' | ') : [],
              relatedTerms: metadata.relatedTerms ? metadata.relatedTerms.split(', ') : [],
              documentTypes: metadata.documentTypes ? metadata.documentTypes.split(', ') : [],
            } as Term,
            score: match.score || 0,
          };
        });

      logger.debug(`Found ${results.length} similar terms`);
      return results;
    } catch (error) {
      logger.error('Error searching vector store:', error);
      return [];
    }
  }

  /**
   * Initialize or create the Pinecone index
   */
  async initializeIndex(): Promise<void> {
    if (!this.isEnabled || !this.pineconeClient) {
      return;
    }

    try {
      const existingIndexes = await this.pineconeClient.listIndexes();
      const indexExists = existingIndexes.indexes?.some(
        idx => idx.name === this.indexName
      );

      if (!indexExists) {
        logger.info(`Creating Pinecone index: ${this.indexName}`);
        await this.pineconeClient.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-3-small dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });
        logger.info(`Index ${this.indexName} created`);
      } else {
        logger.info(`Index ${this.indexName} already exists`);
      }
    } catch (error) {
      logger.error('Error initializing index:', error);
      throw error;
    }
  }
}

export default new VectorStoreService();
