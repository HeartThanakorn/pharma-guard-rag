/**
 * PharmaRAG Server TypeScript Interfaces
 * Defines all data structures used throughout the application
 */

// ============================================
// Document Processing Types
// ============================================

/**
 * Represents a chunk of text extracted from a PDF document
 */
export interface DocumentChunk {
  content: string;
  metadata: {
    source: string;      // Original filename
    page: number;        // Page number in PDF
    chunkIndex: number;  // Position of chunk within document
    documentId: string;  // UUID for document identification
  };
}

/**
 * Represents a fully processed PDF document
 */
export interface ProcessedDocument {
  id: string;
  filename: string;
  chunks: DocumentChunk[];
  uploadedAt: Date;
  pageCount: number;
}

/**
 * Metadata stored for each uploaded document
 */
export interface DocumentMetadata {
  id: string;
  filename: string;
  uploadedAt: Date;
  chunkCount: number;
  pageCount: number;
}

// ============================================
// Chat & RAG Types
// ============================================

/**
 * Represents a single message in the conversation
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

/**
 * Source attribution for RAG responses
 */
export interface Source {
  document: string;  // Document filename
  page: number;      // Page number
}

/**
 * Request body for chat endpoint
 */
export interface ChatRequest {
  question: string;
  conversationHistory: Message[];
}

/**
 * Response from chat endpoint
 */
export interface ChatResponse {
  answer: string;
  sources: Source[];
  disclaimer: string;
}

// ============================================
// API Response Types
// ============================================

/**
 * Response for document upload
 */
export interface UploadResponse {
  success: boolean;
  documentId: string;
  filename: string;
  chunkCount: number;
}

/**
 * Response for document list
 */
export interface DocumentListResponse {
  documents: DocumentMetadata[];
  stats: {
    totalDocuments: number;
    totalChunks: number;
  };
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}
