/**
 * Dev server routes for Fluent VX
 */

import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { VxRouter } from '../../router';
import { compileSource, TargetPlatform } from '../../compiler';
import serveStatic from 'serve-static';

export function setupDevRoutes(app: express.Application, router: VxRouter): void {
  // Health check
  app.get('/__dev__/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      routes: router.routes.length
    });
  });

  // Routes endpoint
  app.get('/__dev__/routes', (req, res) => {
    res.json({
      routes: router.routes.map(r => ({
        path: r.path,
        file: r.filePath
      }))
    });
  });

  // Static assets
  app.use('/.vx', serveStatic('./.vx', {
    maxAge: '1y',
    setHeaders: (res: any, filePath: any) => {
      if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
      else if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    }
  }));

  // SPA fallback
  app.get('*', async (req, res) => {
    const pathname = req.path;
    const match = router.match(pathname);

    if (match && fs.existsSync(match.route.filePath)) {
      try {
        const source = fs.readFileSync(match.route.filePath, 'utf-8');
        const result = await compileSource(source, { target: 'browser' as any, dev: true });
        res.set({
          'Content-Type': 'text/html',
          'X-Dev-Server': 'Fluent-VX',
          'Cache-Control': 'no-cache'
        });
        res.send(result.html);
      } catch (error) {
        res.status(500).send(generateErrorPage(match, error));
      }
    } else {
      // Serve index.html for SPA routing
      const indexPath = path.join('./.vx', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, { root: process.cwd() });
      } else {
        res.status(404).send('404 - Not Found');
      }
    }
  });
}

function generateErrorPage(match: any, error: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Fluent VX - Error</title>
  <style>body{font-family:monospace;padding:2rem;background:#f5f5f5}</style>
</head>
<body>
  <h1>🚨 Compilation Error</h1>
  <p><strong>File:</strong> ${match.route.filePath}</p>
  <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
  <button onclick="location.reload()">Reload</button>
</body>
</html>`;
}