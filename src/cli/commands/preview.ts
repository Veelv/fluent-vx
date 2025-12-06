/**
 * Preview command handler
 * Uses Express server for professional preview
 */

import express from 'express';
import compression from 'compression';
import serveStatic from 'serve-static';
import * as fs from 'fs';
import * as path from 'path';
import { findAvailablePort, DEFAULT_PREVIEW_PORT } from '../../utils/port-finder';
import { exec } from 'child_process';

export async function handlePreview(args: string[]): Promise<void> {
  console.log('🚀 Starting professional preview server...');

  try {
    // Check for new build structure first, fallback to old
    let distDir = './.vx/.dist';
    let vxDir = './.vx';

    if (!fs.existsSync(distDir)) {
      console.log('⚠️  New build structure not found, checking legacy build...');
      distDir = vxDir;

      if (!fs.existsSync(vxDir)) {
        console.error('❌ No build found. Run "vx build" first.');
        process.exit(1);
      }
    }

    // Parse command line arguments
    let port = DEFAULT_PREVIEW_PORT;
    let host = '127.0.0.1';
    let open = true;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '--port':
        case '-p':
          port = parseInt(args[++i]);
          break;
        case '--host':
        case '-h':
          host = args[++i];
          break;
        case '--no-open':
          open = false;
          break;
      }
    }

    const availablePort = await findAvailablePort(port);
    const app = express();

    // Enable gzip compression
    app.use(compression());

    // Security headers
    app.use((req: any, res: any, next: any) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Serve static files with proper caching
    app.use('/', serveStatic(distDir, {
      maxAge: '1y', // Cache static assets for 1 year
      setHeaders: (res: any, filePath: any) => {
        // Set correct content types
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.json')) {
          res.setHeader('Content-Type', 'application/json');
        }
      }
    }));

    // SPA fallback: serve index.html for all non-asset routes
    app.get('*', (req: any, res: any) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, { root: process.cwd() });
      } else {
        res.status(404).send('404 - Not Found');
      }
    });

    // Start server
    const server = app.listen(availablePort, host, () => {
      console.log('----------------------------------------------------');
      console.log('🎉 Professional Preview Server started!');
      console.log(`Local: http://localhost:${availablePort}/`);
      console.log(`📁 Serving: ${distDir}`);
      console.log('✨ Features:');
      console.log('   • Gzip compression enabled');
      console.log('   • Static asset caching (1 year)');
      console.log('   • SPA routing support');
      console.log('   • Security headers');
      console.log('   • Production-ready build structure');
      console.log('----------------------------------------------------');

      // Open browser
      if (open) {
        exec(`start http://localhost:${availablePort}`);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down preview server...');
      server.close(() => {
        console.log('✅ Preview server stopped.');
        process.exit(0);
      });
    });

    // Handle server errors
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${availablePort} in use, trying ${availablePort + 1}...`);
        server.listen(availablePort + 1);
      } else {
        console.error('❌ Preview server error:', err.message);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start preview server:', error);
    process.exit(1);
  }
}