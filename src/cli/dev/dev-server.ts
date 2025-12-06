/**
 * Fluent VX Professional Development Server
 * Modular dev server using separated concerns
 */

import express from 'express';
import compression from 'compression';
import { exec } from 'child_process';
import { VxRouter } from '../../router';
import { findAvailablePort, DEFAULT_DEV_PORT } from '../../utils/port-finder';
import { logger } from '../../logger';
import { setupSecurityMiddleware, setupCompressionMiddleware } from './middleware';
import { setupDevRoutes } from './routes';
import { DevWatcher } from './watcher';

export interface DevServerOptions {
  port?: number;
  host?: string;
  open?: boolean;
}

export class DevServer {
  private options: Required<DevServerOptions>;
  private app: express.Application;
  private server: any;
  private router!: VxRouter;
  private watcher!: DevWatcher;
  private startTime: number;

  constructor(options: DevServerOptions = {}) {
    this.options = {
      port: options.port || DEFAULT_DEV_PORT,
      host: options.host || '127.0.0.1',
      open: options.open !== false
    };

    this.app = express();
    this.startTime = Date.now();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    // Compression
    this.app.use(compression());

    // Security headers
    setupSecurityMiddleware(this.app);
  }

  async start(): Promise<void> {
    try {
      const port = await findAvailablePort(this.options.port);

      // Initialize router
      this.router = new VxRouter({ pagesDir: './src/pages' });
      await this.router.initialize();

      // Setup routes
      setupDevRoutes(this.app, this.router);

      // Setup file watcher
      this.watcher = new DevWatcher(this.router);

      // Start server
      this.server = this.app.listen(port, this.options.host, () => {
        this.logStartup(port);
        if (this.options.open) {
          exec(`start http://localhost:${port}`);
        }
      });

    } catch (error) {
      logger.error(`Failed to start dev server: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }


  private logStartup(port: number): void {
    console.log('='.repeat(50));
    console.log('🚀 Fluent VX Professional Dev Server');
    console.log('='.repeat(50));
    console.log(`🌐 Local: http://localhost:${port}`);
    console.log(`🔍 Dev Tools: http://localhost:${port}/__dev__/routes`);
    console.log(`💓 Health: http://localhost:${port}/__dev__/health`);
    console.log('');
    console.log('⚡ Features: Hot reload, compression, PWA-ready');
    console.log('='.repeat(50));
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.watcher.stop();
      this.server.close(() => {
        logger.info('Dev server stopped', 'shutdown');
        resolve();
      });
    });
  }
}

export async function startDevServer(options: DevServerOptions = {}): Promise<DevServer> {
  const server = new DevServer(options);
  await server.start();
  return server;
}