/**
 * In-Memory Document Metadata Store
 * Stores metadata about uploaded PDF documents
 */

import { DocumentMetadata } from '../types/index';

// In-memory storage using Map for O(1) access
const documentStore = new Map<string, DocumentMetadata>();

/**
 * Add a new document to the store
 */
export function addDocument(metadata: DocumentMetadata): void {
  documentStore.set(metadata.id, metadata);
}

/**
 * Get a document by its ID
 */
export function getDocument(id: string): DocumentMetadata | undefined {
  return documentStore.get(id);
}

/**
 * Get all documents in the store
 */
export function getAllDocuments(): DocumentMetadata[] {
  return Array.from(documentStore.values());
}

/**
 * Delete a document by its ID
 * Returns true if document was deleted, false if not found
 */
export function deleteDocument(id: string): boolean {
  return documentStore.delete(id);
}

/**
 * Check if a document exists
 */
export function hasDocument(id: string): boolean {
  return documentStore.has(id);
}

/**
 * Get statistics about the document store
 */
export function getStats(): { totalDocuments: number; totalChunks: number } {
  const documents = getAllDocuments();
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunkCount, 0);
  
  return {
    totalDocuments: documents.length,
    totalChunks,
  };
}

/**
 * Clear all documents (useful for testing)
 */
export function clearAll(): void {
  documentStore.clear();
}
