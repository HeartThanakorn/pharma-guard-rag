/**
 * Vector Store Manager for PharmaRAG
 * Implements Singleton pattern with HNSWLib for in-memory vector storage
 * 
 * CRITICAL: Both upload and chat routes MUST use the same instance
 */

import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { Document } from '@langchain/core/documents';
import { getEmbeddings } from './embeddingService';

// Singleton instance
let vectorStoreInstance: HNSWLib | null = null;

// Flag to track if initialization is in progress
let initializationPromise: Promise<HNSWLib> | null = null;

/**
 * Get the singleton vector store instance
 * Initializes on first call with empty store
 */
export async function getInstance(): Promise<HNSWLib> {
  // Return existing instance if available
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Initialize new instance
  initializationPromise = initializeVectorStore();
  vectorStoreInstance = await initializationPromise;
  initializationPromise = null;
  
  return vectorStoreInstance;
}

/**
 * Initialize a new empty vector store
 */
async function initializeVectorStore(): Promise<HNSWLib> {
  const embeddings = getEmbeddings();
  
  // Create an empty vector store
  // HNSWLib requires at least one document to initialize, so we create with a placeholder
  // and track actual documents separately
  const store = await HNSWLib.fromDocuments(
    [new Document({ pageContent: '__INIT__', metadata: { isPlaceholder: true } })],
    embeddings
  );
  
  console.log('✅ Vector store initialized');
  return store;
}

/**
 * Add documents to the vector store
 */
export async function addDocuments(docs: Document[]): Promise<void> {
  const store = await getInstance();
  await store.addDocuments(docs);
  console.log(`📄 Added ${docs.length} documents to vector store`);
}

/**
 * Perform similarity search
 * Returns top k most similar documents
 */
export async function similaritySearch(query: string, k: number = 4): Promise<Document[]> {
  const store = await getInstance();
  
  // Get k+1 results to account for potential placeholder
  const results = await store.similaritySearch(query, k + 1);
  
  // Filter out placeholder and limit to k results
  return results
    .filter(doc => !doc.metadata.isPlaceholder)
    .slice(0, k);
}

/**
 * Perform similarity search with scores
 * Returns documents with their similarity scores
 */
export async function similaritySearchWithScore(
  query: string, 
  k: number = 4
): Promise<[Document, number][]> {
  const store = await getInstance();
  
  const results = await store.similaritySearchWithScore(query, k + 1);
  
  // Filter out placeholder and limit to k results
  return results
    .filter(([doc]) => !doc.metadata.isPlaceholder)
    .slice(0, k);
}

/**
 * Delete all documents associated with a specific documentId
 * Note: HNSWLib doesn't support deletion directly, so we rebuild the store
 */
export async function deleteByDocumentId(documentId: string): Promise<number> {
  const store = await getInstance();
  const embeddings = getEmbeddings();
  
  // Get all documents from the current store
  // We need to search with a high k to get all documents
  const allDocs = await store.similaritySearch('', 10000);
  
  // Filter out documents with the target documentId and placeholders
  const remainingDocs = allDocs.filter(
    doc => doc.metadata.documentId !== documentId && !doc.metadata.isPlaceholder
  );
  
  const deletedCount = allDocs.length - remainingDocs.length - 1; // -1 for placeholder
  
  if (remainingDocs.length > 0) {
    // Rebuild store with remaining documents
    vectorStoreInstance = await HNSWLib.fromDocuments(remainingDocs, embeddings);
  } else {
    // Reset to empty store with placeholder
    vectorStoreInstance = await HNSWLib.fromDocuments(
      [new Document({ pageContent: '__INIT__', metadata: { isPlaceholder: true } })],
      embeddings
    );
  }
  
  console.log(`🗑️ Deleted ${deletedCount} documents for documentId: ${documentId}`);
  return deletedCount;
}

/**
 * Get the total number of documents (excluding placeholder)
 */
export async function getDocumentCount(): Promise<number> {
  const store = await getInstance();
  const allDocs = await store.similaritySearch('', 10000);
  return allDocs.filter(doc => !doc.metadata.isPlaceholder).length;
}

/**
 * Check if the vector store has any real documents
 */
export async function isEmpty(): Promise<boolean> {
  const count = await getDocumentCount();
  return count === 0;
}
