/**
 * PharmaRAG API Service
 * Handles all HTTP communication with the backend
 */

import axios from 'axios';
import type {
  Message,
  ChatResponse,
  UploadResponse,
  DocumentListResponse,
} from '../types';

// API base URL - uses Vite proxy in development
const API_BASE = '/api';

/**
 * Upload a PDF document for processing
 * @param file - PDF file to upload
 * @returns Upload response with documentId and chunk count
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<UploadResponse>(
    `${API_BASE}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

/**
 * Send a chat message and get RAG response
 * @param question - User's question
 * @param conversationHistory - Previous messages for context
 * @returns Chat response with answer, sources, and disclaimer
 */
export async function sendMessage(
  question: string,
  conversationHistory: Message[]
): Promise<ChatResponse> {
  const response = await axios.post<ChatResponse>(`${API_BASE}/chat`, {
    question,
    conversationHistory,
  });

  return response.data;
}

/**
 * Get list of all uploaded documents
 * @returns Document list with stats
 */
export async function getDocuments(): Promise<DocumentListResponse> {
  const response = await axios.get<DocumentListResponse>(`${API_BASE}/documents`);
  return response.data;
}

/**
 * Delete a document and its embeddings
 * @param id - Document ID to delete
 * @returns Success confirmation
 */
export async function deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
  const response = await axios.delete<{ success: boolean; message: string }>(
    `${API_BASE}/documents/${id}`
  );
  return response.data;
}

/**
 * Check API health status
 * @returns Health check response
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await axios.get<{ status: string; timestamp: string }>(
    `${API_BASE}/health`
  );
  return response.data;
}
