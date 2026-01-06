/**
 * useDocuments Hook
 * Manages document state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import type { DocumentInfo } from '../types';
import {
  getDocuments,
  uploadDocument as uploadDocumentApi,
  deleteDocument as deleteDocumentApi,
} from '../services/api';

interface UseDocumentsReturn {
  documents: DocumentInfo[];
  totalChunks: number;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<boolean>;
  removeDocument: (id: string) => Promise<boolean>;
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getDocuments();
      setDocuments(response.documents);
      setTotalChunks(response.stats.totalChunks);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(errorMsg);
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (file: File): Promise<boolean> => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadDocumentApi(file);

      // Add new document to the list
      const newDoc: DocumentInfo = {
        id: response.documentId,
        filename: response.filename,
        uploadedAt: new Date(),
        chunkCount: response.chunkCount,
        pageCount: 0, // Will be updated on next fetch
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setTotalChunks((prev) => prev + response.chunkCount);

      return true;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMsg);
      console.error('Failed to upload document:', err);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeDocument = useCallback(async (id: string): Promise<boolean> => {
    // Optimistic update - store for potential rollback
    const previousDocs = documents;
    const docToRemove = documents.find((d) => d.id === id);

    // Optimistically remove from UI
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (docToRemove) {
      setTotalChunks((prev) => prev - docToRemove.chunkCount);
    }

    try {
      await deleteDocumentApi(id);
      return true;
    } catch (err) {
      // Rollback on error
      setDocuments(previousDocs);
      if (docToRemove) {
        setTotalChunks((prev) => prev + docToRemove.chunkCount);
      }

      const errorMsg =
        err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMsg);
      console.error('Failed to delete document:', err);
      return false;
    }
  }, [documents]);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    totalChunks,
    isLoading,
    isUploading,
    error,
    fetchDocuments,
    uploadDocument,
    removeDocument,
  };
}
