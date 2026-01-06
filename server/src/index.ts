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
import documentsRouter from './routes/documents';

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
// Allow all origins in development for testing
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDev ? true : config.clientUrl, // Allow all origins in dev
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

// ============================================
// Server Startup
// ============================================

const server = app.listen(config.port, '0.0.0.0', () => {
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

// Increase timeouts to avoid premature connection drops (common in Node 18+)
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000; // 120 seconds

export default app;
