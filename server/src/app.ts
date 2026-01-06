/**
 * PharmaRAG App Configuration
 * Separation of concerns for testing purposes
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/index';
import { errorHandler } from './middleware/errorHandler';
import uploadRouter from './routes/upload';
import chatRouter from './routes/chat';
import documentsRouter from './routes/documents';

// Initialize Express app
const app = express();

// ============================================
// Middleware Configuration
// ============================================

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Configure CORS for frontend communication
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDev ? true : config.clientUrl,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ============================================
// API Routes
// ============================================

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Upload route
app.use('/api/upload', uploadRouter);

// Chat route
app.use('/api/chat', chatRouter);

// Documents route
app.use('/api/documents', documentsRouter);

// ============================================
// Error Handling
// ============================================

// Global error handler
app.use(errorHandler);

export default app;
