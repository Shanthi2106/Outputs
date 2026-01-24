import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;

  // AI Service Configuration
  aiProvider: 'openai' | 'anthropic';
  openaiApiKey?: string;
  anthropicApiKey?: string;
  aiModel: string;

  // Database Configuration
  databaseUrl: string;
  redisUrl?: string;

  // Vector Database Configuration (ChromaDB - for document chunks)
  chromaUrl?: string;
  chromaHost?: string;
  chromaApiKey?: string;
  chromaTenant?: string;
  chromaDatabase?: string;
  chromaCollectionName?: string;

  // Vector Database Configuration (Pinecone - for term storage)
  pineconeApiKey?: string;
  pineconeIndex?: string;

  // Embedding Configuration
  embeddingModel: string;
  embeddingDimensions: number;

  // Document Chunking Configuration
  chunkSize: number;
  chunkOverlap: number;

  // Security
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // Logging
  logLevel: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // AI Service
  aiProvider: (process.env.AI_PROVIDER as 'openai' | 'anthropic') || 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  aiModel: process.env.AI_MODEL || 'gpt-4o',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/autism_assistant',
  redisUrl: process.env.REDIS_URL,

  // Vector Database (ChromaDB - for document chunks)
  // Set to empty string or omit to disable ChromaDB (embeddings will still work via EmbeddingService)
  // For local: use CHROMA_URL (e.g., http://localhost:8000)
  // For cloud: use CHROMA_HOST, CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE
  chromaUrl: process.env.CHROMA_URL || '',
  chromaHost: process.env.CHROMA_HOST,
  chromaApiKey: process.env.CHROMA_API_KEY,
  chromaTenant: process.env.CHROMA_TENANT,
  chromaDatabase: process.env.CHROMA_DATABASE,
  chromaCollectionName: process.env.CHROMA_COLLECTION_NAME || 'autism-documents',

  // Vector Database (Pinecone - for term storage)
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeIndex: process.env.PINECONE_INDEX || 'autism-terms',

  // Embedding Configuration
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10),

  // Document Chunking Configuration
  chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),

  // Security
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Valid OpenAI model names
const VALID_OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-4-turbo-preview',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
];

// Valid Anthropic model names
const VALID_ANTHROPIC_MODELS = [
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-3-5-sonnet-20241022',
];

/**
 * Validate AI model name based on provider
 */
function validateModelName(provider: string, model: string): boolean {
  if (provider === 'openai') {
    return VALID_OPENAI_MODELS.includes(model);
  } else if (provider === 'anthropic') {
    return VALID_ANTHROPIC_MODELS.some(validModel => model.startsWith(validModel.split('-2024')[0]));
  }
  return false;
}

// Validation
function validateConfig(): void {
  // Show validation banner
  if (process.env.NODE_ENV !== 'test') {
    console.log('Validating configuration...');
  }
  
  const errors: Array<{ message: string; fix: string }> = [];

  if (config.aiProvider === 'openai' && !config.openaiApiKey) {
    errors.push({
      message: 'OPENAI_API_KEY is required when AI_PROVIDER is "openai"',
      fix: 'Add your OpenAI API key to the .env file: OPENAI_API_KEY=sk-your-key-here\n   Get your key from: https://platform.openai.com/api-keys'
    });
  }

  if (config.aiProvider === 'anthropic' && !config.anthropicApiKey) {
    errors.push({
      message: 'ANTHROPIC_API_KEY is required when AI_PROVIDER is "anthropic"',
      fix: 'Add your Anthropic API key to the .env file: ANTHROPIC_API_KEY=sk-ant-your-key-here\n   Get your key from: https://console.anthropic.com/'
    });
  }

  // Check if API key looks like a placeholder
  if (config.aiProvider === 'openai' && config.openaiApiKey) {
    if (config.openaiApiKey.startsWith('sk-proj-') && config.openaiApiKey.length < 50) {
      errors.push({
        message: 'OPENAI_API_KEY appears to be invalid or incomplete',
        fix: 'Please verify your OpenAI API key is correct and complete in the .env file'
      });
    }
  }

  // Validate model name
  if (!validateModelName(config.aiProvider, config.aiModel)) {
    const validModels = config.aiProvider === 'openai' 
      ? VALID_OPENAI_MODELS.join(', ')
      : VALID_ANTHROPIC_MODELS.join(', ');
    errors.push({
      message: `Invalid AI model "${config.aiModel}" for provider "${config.aiProvider}"`,
      fix: `Update AI_MODEL in your .env file to one of: ${validModels}\n   Example: AI_MODEL=gpt-4o`
    });
  }

  // Validate chunking configuration
  if (config.chunkSize <= 0) {
    errors.push({
      message: `CHUNK_SIZE must be greater than 0 (current: ${config.chunkSize})`,
      fix: 'Set CHUNK_SIZE in your .env file to a positive number (e.g., CHUNK_SIZE=1000)'
    });
  }
  if (config.chunkOverlap < 0) {
    errors.push({
      message: `CHUNK_OVERLAP must be 0 or greater (current: ${config.chunkOverlap})`,
      fix: 'Set CHUNK_OVERLAP in your .env file to 0 or a positive number (e.g., CHUNK_OVERLAP=200)'
    });
  }
  if (config.chunkOverlap >= config.chunkSize) {
    errors.push({
      message: `CHUNK_OVERLAP (${config.chunkOverlap}) must be less than CHUNK_SIZE (${config.chunkSize})`,
      fix: `Reduce CHUNK_OVERLAP or increase CHUNK_SIZE in your .env file\n   Recommended: CHUNK_SIZE=1000, CHUNK_OVERLAP=200`
    });
  }

  // Validate embedding dimensions
  const validDimensions = [1536, 3072]; // text-embedding-3-small and text-embedding-3-large
  if (!validDimensions.includes(config.embeddingDimensions)) {
    console.warn(`⚠️  EMBEDDING_DIMENSIONS is ${config.embeddingDimensions}. Expected values: ${validDimensions.join(', ')}`);
    console.warn(`   Using ${config.embeddingModel} which may have different dimensions.`);
    console.warn(`   If you encounter issues, set EMBEDDING_DIMENSIONS to match your model.`);
  }

  // Validate vector database configuration (warnings, not errors - RAG is optional)
  const hasLocalChroma = config.chromaUrl && config.chromaUrl.trim() !== '';
  const hasCloudChroma = config.chromaHost && config.chromaApiKey;
  
  if (!hasLocalChroma && !hasCloudChroma) {
    console.warn('⚠️  ChromaDB not configured. Document RAG features will be disabled.');
    console.warn('   (This is optional - server will work without it)');
    console.warn('   To enable local ChromaDB: Set CHROMA_URL in your .env file (e.g., CHROMA_URL=http://localhost:8000)');
    console.warn('   To enable ChromaDB Cloud: Set CHROMA_HOST, CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE');
  } else if (hasCloudChroma && !config.chromaTenant) {
    console.warn('⚠️  CHROMA_TENANT not set. Using default tenant.');
  } else if (hasCloudChroma && !config.chromaDatabase) {
    console.warn('⚠️  CHROMA_DATABASE not set. Using default database.');
  }

  if (!config.pineconeApiKey || config.pineconeApiKey === 'your_pinecone_api_key_here') {
    console.warn('⚠️  PINECONE_API_KEY not configured. Term vector search will be disabled.');
    console.warn('   (This is optional - server will work without it)');
    console.warn('   To enable: Set PINECONE_API_KEY in your .env file');
    console.warn('   Get your key from: https://app.pinecone.io/');
  }

  if (errors.length > 0) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('  ❌ Configuration Validation Failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Found the following errors:');
    console.error('');
    
    errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error.message}`);
      console.error(`     Fix: ${error.fix}`);
      console.error('');
    });
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('To fix these errors:');
    console.error('  1. Open the backend/.env file');
    console.error('  2. Update the configuration values as shown above');
    console.error('  3. Save the file and restart the server');
    console.error('');
    console.error('You can also run:');
    console.error('  - diagnose-backend.bat (to check configuration)');
    console.error('  - fix-backend-issues.bat (to auto-fix some issues)');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    
    process.exit(1);
  } else {
    if (process.env.NODE_ENV !== 'test') {
      console.log('✓ Configuration validated successfully');
    }
  }
}

validateConfig();

export default config;
