/**
 * Professional Development Server for Fluent VX
 * Integrates HMR, caching, and manifest generation
 */

import express from 'express';
import compression from 'compression';
import serveStatic from 'serve-static';
import * as fs from 'fs';
import * as path from 'path';
import WebSocket from 'ws';
import { DevCache, BuildCache } from '../hmr/cache';
import { ManifestGenerator } from '../manifest/manifest';

export interface DevServerOptions {
  port: number;
  host: string;
  projectRoot: string;
  enableHMR: boolean;
  hmrPort?: number;
}

export class DevServer {
  private app: express.Application;
  private server?: any; // HTTP server instance
  private wss?: WebSocket.Server; // WebSocket server
  private port: number;
  private host: string;
  private projectRoot: string;
  private enableHMR: boolean;

  private devCache: DevCache;
  private buildCache: BuildCache;
  private manifestGenerator: ManifestGenerator;

  constructor(options: DevServerOptions) {
    this.port = options.port;
    this.host = options.host;
    this.projectRoot = options.projectRoot;
    this.enableHMR = options.enableHMR;

    this.app = express();
    this.devCache = new DevCache();
    this.buildCache = new BuildCache(this.projectRoot);
    this.manifestGenerator = new ManifestGenerator(this.projectRoot);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Compression
    this.app.use(compression());

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  private setupRoutes(): void {
    // API routes for development (before static files to avoid conflicts)
    this.app.get('/__dev__/manifest', (req, res) => {
      const manifest = this.manifestGenerator.loadManifest();
      res.json(manifest || { error: 'Manifest not generated' });
    });

    this.app.get('/__dev__/cache', (req, res) => {
      res.json({
        devCache: this.devCache.getStats(),
        buildCache: 'Available on disk'
      });
    });

    this.app.get('/__dev__/modules', (req, res) => {
      res.json(Object.fromEntries(this.devCache.getModuleGraph()));
    });

    // Serve static files from project root (before SPA fallback)
    this.app.use('/dist', express.static(path.join(this.projectRoot, 'dist'), {
      setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      }
    }));

    // SPA fallback - must be last
    this.app.get('*', async (req, res) => {
      try {
        const html = await this.generateDevHTML(req.path);
        res.send(html);
      } catch (error) {
        console.error('Error generating HTML:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  }

  private setupHMR(): void {
    if (!this.server) {
      console.warn('HTTP server not available for HMR setup');
      this.enableHMR = false;
      return;
    }

    try {
      console.log(`🔥 Setting up HMR WebSocket server on port ${this.port}...`);

      // Create WebSocket server attached to the HTTP server
      this.wss = new WebSocket.Server({
        server: this.server,
        path: '/__hmr__', // Use specific path for HMR
        perMessageDeflate: false,
        maxPayload: 1024 * 1024 // 1MB
      });

      console.log('🔥 HMR WebSocket server created successfully on path /__hmr__');

      this.wss.on('connection', (ws: WebSocket) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🔗 HMR client connected: ${clientId} on port ${this.port}`);

        ws.send(JSON.stringify({
          type: 'connected',
          clientId,
          timestamp: Date.now()
        }));

        ws.on('close', () => {
          console.log(`🔌 HMR client disconnected: ${clientId}`);
        });

        ws.on('error', (error) => {
          console.warn(`HMR client error ${clientId}:`, error.message);
        });

        // Handle HMR messages if needed
        ws.on('message', (data) => {
          console.log('HMR message received:', data.toString());
        });
      });

      this.wss.on('error', (error) => {
        console.error('HMR WebSocket server error:', error.message);
        this.enableHMR = false;
      });

      console.log('🔥 HMR WebSocket server initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize HMR WebSocket server:', error);
      console.error('❌ HMR will be disabled');
      this.enableHMR = false;
    }
  }


  private async generateDevHTML(route: string): Promise<string> {
    const manifest = this.manifestGenerator.loadManifest();

    // Try to find and compile .vx file for this route
    let compiledContent = '';
    let pageTitle = 'Fluent VX Dev';

    try {
      // Look for .vx file matching the route
      const vxFilePath = this.findVxFileForRoute(route);
      if (vxFilePath) {
        console.log(`📄 Compiling: ${vxFilePath}`);
        const source = fs.readFileSync(vxFilePath, 'utf-8');

        // Import compiler dynamically
        const { compileSource } = await import('../../compiler');

        const result = await compileSource(source, {
          dev: true,
          minify: false
        });

        console.log(`📊 Compilation result: HTML=${result.html?.length || 0}, CSS=${result.css?.length || 0}, JS=${result.js?.length || 0}`);

        // Combine HTML with inline CSS and JS for dev
        let fullContent = result.html || '';

        if (result.css) {
          fullContent = `<style>${result.css}</style>` + fullContent;
          console.log(`🎨 CSS inlined (${result.css.length} chars)`);
        }

        if (result.js) {
          fullContent += `<script>${result.js}</script>`;
          console.log(`⚡ JS inlined (${result.js.length} chars)`);
        }

        compiledContent = fullContent;
        pageTitle = 'Fluent VX App';

        console.log(`✅ Compiled successfully - Final content: ${compiledContent.length} chars`);
      } else {
        // Fallback to dev info page
        compiledContent = `
          <h1>Fluent VX Development Server</h1>
          <p>Route: ${route}</p>
          <p>HMR: ${this.enableHMR ? 'Enabled' : 'Disabled'}</p>
          <p>Manifest: ${manifest ? 'Generated' : 'Not generated'}</p>
          <p><em>No .vx file found for this route</em></p>
        `;
      }
    } catch (error) {
      console.error('❌ Compilation error:', error);
      compiledContent = `
      <h1>Compilation Error</h1>
      <p>Route: ${route}</p>
      <pre style="color: red;">${(error as Error).message}</pre>
    `;
    }

    let hmrScript = '';
    if (this.enableHMR && this.wss) {
      const wsHost = this.host === '127.0.0.1' ? 'localhost' : this.host;
      hmrScript = `
<script>
  // HMR Client with smart retry and backoff
  console.log('🔥 HMR enabled, attempting connection to ${wsHost}:${this.port}...');

  let retryCount = 0;
  let retryTimeout = null;
  const maxRetries = 5;
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  function connectHMR() {
    if (retryCount >= maxRetries) {
      console.warn('🔥 HMR: Max retries reached, giving up');
      return;
    }

    try {
      retryCount++;
      const hmrWs = new WebSocket('ws://${wsHost}:${this.port}/__hmr__');

      hmrWs.onopen = () => {
        console.log('🔥 HMR connected successfully');
        retryCount = 0; // Reset on success
      };

      hmrWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'reload') {
            console.log('🔥 HMR: Reloading page...');
            window.location.reload();
          }
        } catch (e) {
          console.warn('HMR: Failed to parse message:', e);
        }
      };

      hmrWs.onerror = (error) => {
        // Only log first few errors to avoid spam
        if (retryCount <= 3) {
          console.warn('HMR: Connection error (attempt ' + retryCount + '/' + maxRetries + ')');
        }

        // Schedule retry with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
        retryTimeout = setTimeout(connectHMR, delay);
      };

      hmrWs.onclose = (event) => {
        // Only log first few closes to avoid spam
        if (retryCount <= 3) {
          console.log('HMR: Connection closed, retrying... (attempt ' + retryCount + '/' + maxRetries + ')');
        }

        // Schedule retry with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
        retryTimeout = setTimeout(connectHMR, delay);
      };

      // Set a timeout for the connection attempt
      setTimeout(() => {
        if (hmrWs.readyState === WebSocket.CONNECTING) {
          hmrWs.close();
        }
      }, 5000); // 5 second timeout

    } catch (error) {
      if (retryCount <= 3) {
        console.warn('HMR: Failed to initialize (attempt ' + retryCount + '/' + maxRetries + '):', error);
      }

      // Schedule retry with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
      retryTimeout = setTimeout(connectHMR, delay);
    }
  }

  // Initial connection attempt after page load
  function initHMR() {
    setTimeout(connectHMR, 500); // Wait 500ms for server to be ready
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHMR);
  } else {
    initHMR();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
  });
</script>`;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0; padding: 0;
    }
    .dev-notice {
      position: fixed; bottom: 10px; right: 10px;
      background: #0070f3; color: white; padding: 8px 12px;
      border-radius: 4px; font-size: 12px; z-index: 9999;
    }
  </style>
</head>
<body>
  <div id="app">
    ${compiledContent}
  </div>
  <div class="dev-notice">
    DEV MODE - HMR ${this.enableHMR ? 'ON' : 'OFF'}
  </div>
  ${hmrScript}
</body>
</html>`;
  }

  private findVxFileForRoute(route: string): string | null {
    // Convert route to file path
    let filePath = route === '/' ? 'index.vx' : route.replace(/^\//, '') + '.vx';

    // Check in examples directory (for testing)
    const possiblePaths = [
      path.join(this.projectRoot, filePath),
      path.join(this.projectRoot, 'src', 'pages', filePath),
      path.join(this.projectRoot, 'pages', filePath),
      path.join(this.projectRoot, 'test.vx') // Fallback for test.vx
    ];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        return testPath;
      }
    }

    return null;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, this.host, () => {
          console.log(`🚀 Fluent VX Dev Server running on http://${this.host}:${this.port}`);

          // Setup HMR after server is listening
          if (this.enableHMR) {
            this.setupHMR();
          }

          console.log(`🔥 HMR: ${this.enableHMR ? 'Enabled' : 'Disabled'}`);
          console.log(`📋 Manifest: ${this.manifestGenerator.loadManifest() ? 'Loaded' : 'Generating...'}`);

          // Generate initial manifest
          const moduleGraph = this.devCache.getModuleGraph();
          this.manifestGenerator.generateDevManifest(moduleGraph);

          resolve();
        });

        this.server.on('error', (error: Error) => {
          console.error('Dev server error:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Failed to start dev server:', error);
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = undefined;
    }

    // Close HTTP server
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }

    // Clear caches
    this.devCache.clear();
    this.buildCache.clear();
  }
}