/**
 * PharmaRAG Client TypeScript Interfaces
 * Matches backend types for API communication
 */

// ============================================
// Chat & Message Types
// ============================================

/**
 * Source attribution for RAG responses
 */
export interface Source {
  document: string;  // Document filename
  page: number;      // Page number
}

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
 * Response from chat endpoint
 */
export interface ChatResponse {
  answer: string;
  sources: Source[];
  disclaimer: string;
}

// ============================================
// Document Types
// ============================================

/**
 * Document information for display in DocumentList
 */
export interface DocumentInfo {
  id: string;
  filename: string;
  uploadedAt: Date;
  chunkCount: number;
  pageCount: number;
}

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
  documents: DocumentInfo[];
  stats: {
    totalDocuments: number;
    totalChunks: number;
  };
}

// ============================================
// API Error Types
// ============================================

/**
 * Standard error response from API
 */
export interface ApiError {
  error: string;
  details?: string;
}
