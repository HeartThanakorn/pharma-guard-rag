/**
 * PharmaRAG Server Entry Point
 * Express.js server with CORS configuration
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/index';
import { errorHandler } from './middleware/errorHandler';
import uploadRouter from './routes/upload';
import chatRouter from './routes/chat';

// Validate configuration on startup
validateConfig();

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
app.use(cors({
  origin: config.clientUrl,
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

app.get('/api/documents', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.delete('/api/documents/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// ============================================
// Error Handling
// ============================================

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================

app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    PharmaRAG Server                        ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server running on: http://localhost:${config.port}              ║
║  🌐 Client URL: ${config.clientUrl}                    ║
║  📋 Health check: http://localhost:${config.port}/api/health        ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
