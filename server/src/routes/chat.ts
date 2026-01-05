/**
 * Chat Route for PharmaRAG
 * Handles Q&A requests using RAG engine
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../services/ragEngine';
import { ValidationError, LLMError } from '../middleware/errorHandler';
import { ChatRequest, ChatResponse } from '../types/index';

const router = Router();

/**
 * POST /api/chat
 * Send a question and get a RAG-powered response
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, conversationHistory = [] } = req.body as ChatRequest;
    
    // Validate question
    if (!question || typeof question !== 'string' || question.trim() === '') {
      throw new ValidationError('Question is required and must be a non-empty string');
    }
    
    console.log(`💬 Chat request: "${question.substring(0, 50)}..."`);
    
    // Query RAG engine
    const response: ChatResponse = await query(question.trim(), conversationHistory);
    
    res.json(response);
  } catch (error) {
    // Handle specific error types
    if (error instanceof ValidationError) {
      next(error);
    } else if (error instanceof Error && error.message.includes('AI service')) {
      next(new LLMError(error.message));
    } else {
      next(error);
    }
  }
});

export default router;
