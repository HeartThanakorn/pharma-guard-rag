/**
 * Documents Route for PharmaRAG
 * Handles document listing and deletion
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getAllDocuments, getDocument, deleteDocument, getStats } from '../store/documentStore';
import { deleteByDocumentId } from '../services/vectorStore';
import { NotFoundError } from '../middleware/errorHandler';
import { DocumentListResponse } from '../types/index';

const router = Router();

/**
 * GET /api/documents
 * Return all documents with stats
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = getAllDocuments();
    const stats = getStats();
    
    const response: DocumentListResponse = {
      documents,
      stats,
    };
    
    console.log(`📋 Documents list: ${documents.length} documents, ${stats.totalChunks} chunks`);
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document and its embeddings
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if document exists
    const document = getDocument(id);
    if (!document) {
      throw new NotFoundError(`Document with ID ${id} not found`);
    }
    
    console.log(`🗑️ Deleting document: ${document.filename} (${id})`);
    
    // Delete embeddings from vector store
    const deletedChunks = await deleteByDocumentId(id);
    
    // Delete from document store
    deleteDocument(id);
    
    res.json({
      success: true,
      message: `Document "${document.filename}" deleted successfully`,
      deletedChunks,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
