/**
 * Global Error Handling Middleware for PharmaRAG
 * Handles all errors and returns consistent JSON responses
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/index';

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for not found errors
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Custom error class for LLM/AI service errors
 */
export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * Global error handler middleware
 * Catches all errors and returns appropriate HTTP status codes
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err.message);

  let statusCode = 500;
  const response: ErrorResponse = {
    error: 'Internal server error',
  };

  if (err instanceof ValidationError) {
    statusCode = 400;
    response.error = 'Validation error';
    response.details = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    response.error = 'Not found';
    response.details = err.message;
  } else if (err instanceof LLMError) {
    statusCode = 503;
    response.error = 'AI service unavailable';
    response.details = err.message;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    response.error = 'File upload error';
    response.details = err.message;
  } else {
    response.details = err.message;
  }

  res.status(statusCode).json(response);
}
