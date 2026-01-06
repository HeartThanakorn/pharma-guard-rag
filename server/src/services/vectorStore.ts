/**
 * Vector Store Manager for PharmaRAG
 * Implements Singleton pattern with HNSWLib for in-memory vector storage
 * 
 * CRITICAL: Both upload and chat routes MUST use the same instance
 * 
 * FIX: Uses lazy initialization - no embedding API call until first document added
 */

import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { Document } from '@langchain/core/documents';
import { getEmbeddings } from './embeddingService';

// Singleton instance
let vectorStoreInstance: HNSWLib | null = null;

// Flag to track if vector store has been properly initialized with real documents
let isInitialized = false;



/**
 * Initialize vector store with documents (called on first addDocuments)
 */
async function initializeWithDocuments(docs: Document[]): Promise<HNSWLib> {
  const embeddings = getEmbeddings();
  
  console.log(`✅ Initializing vector store with ${docs.length} documents...`);
  
  const store = await HNSWLib.fromDocuments(docs, embeddings);
  
  console.log('✅ Vector store initialized');
  return store;
}

/**
 * Add documents to the vector store
 * This is the main entry point - handles lazy initialization
 */
export async function addDocuments(docs: Document[]): Promise<void> {
  if (!isInitialized || !vectorStoreInstance) {
    // First time: initialize with these documents (no placeholder needed!)
    vectorStoreInstance = await initializeWithDocuments(docs);
    isInitialized = true;
    console.log(`📄 Added ${docs.length} documents to vector store`);
  } else {
    // Already initialized: just add to existing store
    await vectorStoreInstance.addDocuments(docs);
    console.log(`📄 Added ${docs.length} documents to vector store`);
  }
}

/**
 * Perform similarity search
 * Returns top k most similar documents
 */
export async function similaritySearch(query: string, k: number = 4): Promise<Document[]> {
  if (!isInitialized || !vectorStoreInstance) {
    console.log('⚠️ Vector store is empty - no documents uploaded yet');
    return [];
  }
  
  const results = await vectorStoreInstance.similaritySearch(query, k);
  return results;
}

/**
 * Perform similarity search with scores
 * Returns documents with their similarity scores
 */
export async function similaritySearchWithScore(
  query: string, 
  k: number = 4
): Promise<[Document, number][]> {
  if (!isInitialized || !vectorStoreInstance) {
    console.log('⚠️ Vector store is empty - no documents uploaded yet');
    return [];
  }
  
  return await vectorStoreInstance.similaritySearchWithScore(query, k);
}

/**
 * Delete all documents associated with a specific documentId
 * Note: HNSWLib doesn't support deletion directly, so we rebuild the store
 */
export async function deleteByDocumentId(documentId: string): Promise<number> {
  if (!isInitialized || !vectorStoreInstance) {
    console.log('⚠️ Vector store is empty - nothing to delete');
    return 0;
  }
  
  const embeddings = getEmbeddings();
  
  // Get all documents from the current store
  const allDocs = await vectorStoreInstance.similaritySearch('', 10000);
  
  // Filter out documents with the target documentId
  const remainingDocs = allDocs.filter(
    doc => doc.metadata.documentId !== documentId
  );
  
  const deletedCount = allDocs.length - remainingDocs.length;
  
  if (remainingDocs.length > 0) {
    // Rebuild store with remaining documents
    vectorStoreInstance = await HNSWLib.fromDocuments(remainingDocs, embeddings);
  } else {
    // No documents left - reset to uninitialized state
    vectorStoreInstance = null;
    isInitialized = false;
  }
  
  console.log(`🗑️ Deleted ${deletedCount} chunks for documentId: ${documentId}`);
  return deletedCount;
}

/**
 * Get the total number of documents
 */
export async function getDocumentCount(): Promise<number> {
  if (!isInitialized || !vectorStoreInstance) {
    return 0;
  }
  
  const allDocs = await vectorStoreInstance.similaritySearch('', 10000);
  return allDocs.length;
}

/**
 * Check if the vector store has any documents
 */
export async function isEmpty(): Promise<boolean> {
  return !isInitialized || !vectorStoreInstance;
}

/**
 * Reset vector store (useful for testing)
 */
export function reset(): void {
  vectorStoreInstance = null;
  isInitialized = false;

  console.log('🔄 Vector store reset');
}
