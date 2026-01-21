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

  // Vector Database Configuration
  pineconeApiKey?: string;
  pineconeEnvironment?: string;
  pineconeIndex?: string;

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
  aiModel: process.env.AI_MODEL || 'gpt-4-turbo-preview',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/autism_assistant',
  redisUrl: process.env.REDIS_URL,

  // Vector Database
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeEnvironment: process.env.PINECONE_ENVIRONMENT,
  pineconeIndex: process.env.PINECONE_INDEX || 'autism-terms',

  // Security
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validation
function validateConfig(): void {
  const errors: string[] = [];

  if (config.aiProvider === 'openai' && !config.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required when AI_PROVIDER is "openai"');
  }

  if (config.aiProvider === 'anthropic' && !config.anthropicApiKey) {
    errors.push('ANTHROPIC_API_KEY is required when AI_PROVIDER is "anthropic"');
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

validateConfig();

export default config;
