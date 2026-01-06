/**
 * FileUpload Component
 * Drag-and-drop PDF upload with progress and feedback
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { uploadDocument } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResult {
  filename: string;
  chunkCount: number;
}

interface FileUploadProps {
  onUploadComplete?: () => void;
}

const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setStatus('error');
      setErrorMessage('Please upload a PDF file only.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error');
      setErrorMessage('File size must be less than 10MB.');
      return;
    }

    setStatus('uploading');
    setErrorMessage('');
    setUploadResult(null);

    try {
      const result = await uploadDocument(file);
      setStatus('success');
      setUploadResult({
        filename: result.filename,
        chunkCount: result.chunkCount,
      });
      onUploadComplete?.();
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Upload failed. Please try again.'
      );
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setStatus('idle');
    setUploadResult(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${status === 'uploading' ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        {status === 'uploading' ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Uploading and processing...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">📄</div>
            <p className="text-gray-600 font-medium">
              Drag & drop a PDF file here
            </p>
            <p className="text-gray-400 text-sm mt-1">
              or click to browse (max 10MB)
            </p>
          </>
        )}
      </div>

      {/* Success message */}
      {status === 'success' && uploadResult && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-green-500 text-xl mr-3">✅</span>
            <div className="flex-1">
              <p className="text-green-800 font-medium">Upload successful!</p>
              <p className="text-green-700 text-sm mt-1">
                <strong>{uploadResult.filename}</strong> processed into{' '}
                <strong>{uploadResult.chunkCount}</strong> searchable chunks.
              </p>
            </div>
            <button
              onClick={resetUpload}
              className="text-green-600 hover:text-green-800 text-sm underline"
            >
              Upload another
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-red-500 text-xl mr-3">❌</span>
            <div className="flex-1">
              <p className="text-red-800 font-medium">Upload failed</p>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={resetUpload}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
