/**
 * Configuration loader for PharmaRAG Server
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Application configuration object
 */
export const config = {
  /**
   * Google API key for Gemini LLM and embeddings
   */
  googleApiKey: process.env.GOOGLE_API_KEY || '',

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
  if (!config.googleApiKey) {
    console.warn('⚠️  WARNING: GOOGLE_API_KEY is not set. LLM features will not work.');
  }
}

export default config;
