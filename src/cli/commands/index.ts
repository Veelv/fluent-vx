/**
 * Fluent VX CLI Commands - Index
 * Professional command exports
 */

import { createProject } from '../create';
import { handleAddIntegration, handleRemoveIntegration, handleVerifyIntegrations } from '../integration';

export { handleDev as dev } from './dev';
export { handleBuild as build } from './build';

/**
 * Initialize project in current directory
 */
export async function init(args: string[]): Promise<void> {
  console.log('🚀 Initializing Fluent VX project in current directory...');

  // Create project in current directory
  await createProject('.', {
    template: 'basic',
    typescript: false
  });

  console.log('\n✅ Project initialized successfully!');
  console.log('\n🎯 Zero-config setup complete!');
  console.log('   npm install');
  console.log('   npm run dev');
  console.log('\n📁 Pages: ./src/pages/ (automatic routing)');
  console.log('📄 App: ./src/app.vx (main layout)');
  console.log('🎨 Styles: ./src/styles/global.css');
}

/**
 * Create new project
 */
export async function create(args: string[]): Promise<void> {
  const projectName = args[0];

  if (!projectName) {
    console.error('❌ Project name is required');
    console.log('Usage: vx create <project-name>');
    process.exit(1);
  }

  console.log(`🚀 Creating Fluent VX project: ${projectName}`);
  console.log('📦 Setting up project structure...');

  await createProject(projectName, {
    template: 'basic',
    typescript: false
  });

  console.log('\n✅ Project created successfully!');
  console.log('\n🎯 Next steps:');
  console.log(`   cd ${projectName}`);
  console.log('   npm install');
  console.log('   npm run dev');
  console.log('\n🎉 Happy coding with Fluent VX!');
  console.log('   https://fluent-vx.dev');
}

/**
 * Preview production build
 */
export async function preview(args: string[]): Promise<void> {
  console.log('🚀 Starting professional preview server...');

  const express = await import('express');
  const compression = await import('compression');
  const serveStatic = await import('serve-static');
  const fs = await import('fs');
  const path = await import('path');
  const { findAvailablePort, DEFAULT_PREVIEW_PORT } = await import('../../utils/port-finder');

  try {
    const vxDir = './.vx';

    if (!fs.existsSync(vxDir)) {
      console.error('❌ No build found. Run "vx build" first.');
      process.exit(1);
    }

    const port = await findAvailablePort(DEFAULT_PREVIEW_PORT);
    const app = express.default();

    // Enable gzip compression
    app.use(compression.default());

    // Security headers
    app.use((req: any, res: any, next: any) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Serve static files with proper caching
    app.use('/.vx', serveStatic.default(vxDir, {
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
      const indexPath = path.join(vxDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, { root: process.cwd() });
      } else {
        res.status(404).send('404 - Not Found');
      }
    });

    // Start server
    const server = app.listen(port, () => {
      console.log('----------------------------------------------------');
      console.log('🎉 Professional Preview Server started!');
      console.log(`Local: http://localhost:${port}/`);
      console.log('📁 Serving: ./.vx');
      console.log('✨ Features:');
      console.log('   • Gzip compression enabled');
      console.log('   • Static asset caching (1 year)');
      console.log('   • SPA routing support');
      console.log('   • Security headers');
      console.log('----------------------------------------------------');

      // Open browser
      const { exec } = require('child_process');
      exec(`start http://localhost:${port}`);
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
        console.log(`Port ${port} in use, trying ${port + 1}...`);
        server.listen(port + 1);
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

export { handleAddIntegration as add } from '../integration';
export { handleRemoveIntegration as remove } from '../integration';
export { handleVerifyIntegrations as iv } from '../integration';