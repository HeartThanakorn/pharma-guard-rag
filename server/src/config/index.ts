/**
 * Configuration loader for PharmaRAG Server
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Supported AI providers
 */
export type AIProvider = 'gemini' | 'deepseek';

/**
 * Application configuration object
 */
export const config = {
  /**
   * AI Provider selection: 'gemini' or 'deepseek'
   */
  aiProvider: (process.env.AI_PROVIDER || 'gemini') as AIProvider,

  /**
   * Google API key for Gemini LLM and embeddings
   */
  googleApiKey: process.env.GOOGLE_API_KEY || '',

  /**
   * Deepseek API key for Deepseek LLM
   */
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',

  /**
   * OpenAI API key (optional, for embeddings with Deepseek since it doesn't have embeddings)
   * If using Deepseek for LLM, you can still use Google embeddings or OpenAI embeddings
   */
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  /**
   * Embedding provider: 'gemini' or 'openai'
   * Deepseek doesn't have embedding API, so we need to use another provider
   */
  embeddingProvider: (process.env.EMBEDDING_PROVIDER || 'gemini') as 'gemini' | 'openai',

  /**
   * Server port
   */
  port: parseInt(process.env.PORT || '3001', 10),

  /**
   * Client URL for CORS configuration
   */
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  /**
   * Upload directory for temporary PDF files
   */
  uploadDir: process.env.UPLOAD_DIR || 'uploads',

  /**
   * Maximum file size for uploads (in bytes) - default 10MB
   */
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  console.log(`🤖 AI Provider: ${config.aiProvider.toUpperCase()}`);
  console.log(`📊 Embedding Provider: ${config.embeddingProvider.toUpperCase()}`);
  
  if (config.aiProvider === 'gemini' && !config.googleApiKey) {
    console.warn('⚠️  WARNING: GOOGLE_API_KEY is not set. Gemini LLM will not work.');
  }
  
  if (config.aiProvider === 'deepseek' && !config.deepseekApiKey) {
    console.warn('⚠️  WARNING: DEEPSEEK_API_KEY is not set. Deepseek LLM will not work.');
  }
  
  if (config.embeddingProvider === 'gemini' && !config.googleApiKey) {
    console.warn('⚠️  WARNING: GOOGLE_API_KEY is not set. Google embeddings will not work.');
  }
  
  if (config.embeddingProvider === 'openai' && !config.openaiApiKey) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set. OpenAI embeddings will not work.');
  }
}

export default config;
