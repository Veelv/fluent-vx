/**
 * Professional Development Server for Fluent VX
 * Integrates HMR, caching, and manifest generation
 */

import express from 'express';
import compression from 'compression';
import serveStatic from 'serve-static';
import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import { HMRServer } from '../hmr/hmr';
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
  private port: number;
  private host: string;
  private projectRoot: string;
  private enableHMR: boolean;
  private hmrPort: number;

  private hmrServer?: HMRServer;
  private devCache: DevCache;
  private buildCache: BuildCache;
  private manifestGenerator: ManifestGenerator;
  private watcher?: chokidar.FSWatcher;

  constructor(options: DevServerOptions) {
    this.port = options.port;
    this.host = options.host;
    this.projectRoot = options.projectRoot;
    this.enableHMR = options.enableHMR;
    this.hmrPort = options.hmrPort || this.port + 1;

    this.app = express();
    this.devCache = new DevCache();
    this.buildCache = new BuildCache(this.projectRoot);
    this.manifestGenerator = new ManifestGenerator(this.projectRoot);

    this.setupMiddleware();
    this.setupRoutes();

    if (this.enableHMR) {
      this.setupHMR();
    }

    this.setupFileWatcher();
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
    // API routes for development
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

    // SPA fallback
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
    try {
      this.hmrServer = new HMRServer(this.hmrPort, this.devCache);
      console.log(`🔥 HMR server initialized on port ${this.hmrPort}`);
    } catch (error) {
      console.warn('⚠️  Failed to initialize HMR server:', error);
      this.enableHMR = false;
    }
  }

  private setupFileWatcher(): void {
    const watchPaths = [
      'src/**/*.{vx,css}',
      'src/app.vx',
      'src/pages/**/*'
    ];

    this.watcher = chokidar.watch(watchPaths, {
      cwd: this.projectRoot,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async (filePath) => {
      console.log(`📝 File changed: ${filePath}`);

      try {
        // Update manifest if needed
        if (this.manifestGenerator.needsUpdate()) {
          const moduleGraph = this.devCache.getModuleGraph();
          this.manifestGenerator.generateDevManifest(moduleGraph);
        }

        // Handle HMR
        if (this.enableHMR && this.hmrServer) {
          const fullPath = path.join(this.projectRoot, filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          await this.hmrServer.handleFileChange(filePath, content);
        }

      } catch (error) {
        console.error('Error handling file change:', error);
      }
    });

    this.watcher.on('add', (filePath) => {
      console.log(`➕ File added: ${filePath}`);
      // Trigger manifest update for new files
      if (this.manifestGenerator.needsUpdate()) {
        const moduleGraph = this.devCache.getModuleGraph();
        this.manifestGenerator.generateDevManifest(moduleGraph);
      }
    });
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
    if (this.enableHMR) {
      hmrScript = `
<script>
  // HMR Client with error handling
  try {
    const hmrWs = new WebSocket('ws://localhost:${this.hmrPort}');
    
    hmrWs.onopen = () => {
      console.log('🔥 HMR connected');
    };
    
    hmrWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('🔥 HMR:', msg.type, msg.moduleId);
        if (msg.type === 'reload') {
          window.location.reload();
        }
      } catch (e) {
        console.warn('HMR: Failed to parse message:', e);
      }
    };
    
    hmrWs.onerror = (error) => {
      console.warn('HMR: Connection error (this is normal if HMR is disabled):', error);
    };
    
    hmrWs.onclose = () => {
      console.log('HMR: Connection closed');
    };
  } catch (error) {
    console.warn('HMR: Failed to initialize (this is normal if HMR is disabled):', error);
  }
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
    return new Promise((resolve) => {
      this.app.listen(this.port, this.host, () => {
        console.log(`🚀 Fluent VX Dev Server running on http://${this.host}:${this.port}`);
        console.log(`🔥 HMR: ${this.enableHMR ? 'Enabled' : 'Disabled'}`);
        console.log(`📋 Manifest: ${this.manifestGenerator.loadManifest() ? 'Loaded' : 'Generating...'}`);

        // Generate initial manifest
        const moduleGraph = this.devCache.getModuleGraph();
        this.manifestGenerator.generateDevManifest(moduleGraph);

        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
    }

    if (this.hmrServer) {
      this.hmrServer.close();
    }

    // Clear caches
    this.devCache.clear();
    this.buildCache.clear();
  }
}