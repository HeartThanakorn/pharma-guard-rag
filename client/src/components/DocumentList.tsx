/**
 * DocumentList Component
 * Displays uploaded documents with management options
 */

import { useState } from 'react';
import type { DocumentInfo } from '../types';
import { deleteDocument } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface DocumentListProps {
  documents: DocumentInfo[];
  totalChunks: number;
  isLoading: boolean;
  onDocumentDeleted: () => void;
}

const DocumentList = ({
  documents,
  totalChunks,
  isLoading,
  onDocumentDeleted,
}: DocumentListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);

    try {
      await deleteDocument(id);
      onDocumentDeleted();
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-4xl mb-3">📚</div>
        <p className="text-gray-500 font-medium">No documents uploaded</p>
        <p className="text-gray-400 text-sm mt-1">
          Upload a PDF to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats header */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-semibold text-gray-700">Uploaded Documents</h3>
        <div className="text-sm text-gray-500">
          {documents.length} doc{documents.length !== 1 ? 's' : ''} •{' '}
          {totalChunks} chunk{totalChunks !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center flex-1 min-w-0">
              <span className="text-2xl mr-3">📄</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 truncate">
                  {doc.filename}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(doc.uploadedAt)} • {doc.chunkCount} chunks •{' '}
                  {doc.pageCount} page{doc.pageCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Delete button / confirmation */}
            <div className="ml-3 flex-shrink-0">
              {confirmDeleteId === doc.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConfirmDelete(doc.id)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    disabled={deletingId === doc.id}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDeleteClick(doc.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete document"
                  disabled={deletingId !== null}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;
