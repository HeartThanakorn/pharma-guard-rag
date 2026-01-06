/**
 * PharmaRAG Server Entry Point
 * Starts the server binding to the configured port
 */

import { config, validateConfig } from './config/index';
import app from './app';

// Validate configuration on startup
validateConfig();

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
