/**
 * Embedding Service for PharmaRAG
 * Uses Google Generative AI Embeddings via LangChain
 */

import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { config } from '../config/index';

/**
 * Singleton instance of Google Generative AI Embeddings
 * Model: text-embedding-004
 */
let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null;

/**
 * Get the singleton embeddings instance
 * Initializes on first call
 */
export function getEmbeddings(): GoogleGenerativeAIEmbeddings {
  if (!embeddingsInstance) {
    if (!config.googleApiKey) {
      throw new Error('GOOGLE_API_KEY is not configured. Please set it in your .env file.');
    }
    
    embeddingsInstance = new GoogleGenerativeAIEmbeddings({
      apiKey: config.googleApiKey,
      modelName: 'text-embedding-004',
    });
  }
  
  return embeddingsInstance;
}

/**
 * Generate embeddings for an array of texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = getEmbeddings();
  return await embeddings.embedDocuments(texts);
}

/**
 * Generate embedding for a single query text
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const embeddings = getEmbeddings();
  return await embeddings.embedQuery(text);
}
