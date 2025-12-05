// Fluent VX CLI Commands
// Command definitions and handlers

import { createProject } from './create';
import { handleAddIntegration, handleRemoveIntegration, handleVerifyIntegrations } from './integration';

export interface CLICommand {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: (args: string[]) => Promise<void>;
}

/**
 * Initialize project in current directory
 */
async function handleInit(args: string[]): Promise<void> {
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
async function handleCreate(args: string[]): Promise<void> {
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
 * Start development server
 */
async function handleDev(args: string[]): Promise<void> {
  console.log('🚀 Starting Fluent VX development server...');

  const { findAvailablePort, DEFAULT_DEV_PORT } = await import('../utils/port-finder');
  const http = await import('http');
  const path = await import('path');
  const fs = await import('fs');
  const { VxRouter } = await import('../router');
  const { compileSource } = await import('../compiler');
  const { TargetPlatform } = await import('../compiler/types');

  try {
    const port = await findAvailablePort(DEFAULT_DEV_PORT);

    // Initialize router for the current project
    const router = new VxRouter({
      pagesDir: './src/pages'
    });
    await router.initialize();

    // Create .vx directory for dev assets
    const vxDir = './.vx';
    if (!fs.existsSync(vxDir)) {
      fs.mkdirSync(vxDir, { recursive: true });
    }

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`);
      const pathname = url.pathname;

      try {
        // Try to match route
        const match = router.match(pathname);

        if (match) {
          // Try to compile the .vx file
          const filePath = match.route.filePath;

          if (fs.existsSync(filePath)) {
            const source = fs.readFileSync(filePath, 'utf-8');

            try {
              // Compile .vx to HTML
              const result = await compileSource(source, {
                target: TargetPlatform.BROWSER,
                dev: true
              });

              // Save assets to .vx for dev
              if (result.files && result.files.size > 0) {
                for (const [filePath, content] of result.files) {
                  const fullPath = path.join(vxDir, filePath);
                  const dir = path.dirname(fullPath);
                  if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                  }
                  fs.writeFileSync(fullPath, content);
                }
              }

              // Return compiled HTML
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(result.html);

            } catch (compileError) {
              // Compilation error
              const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fluent VX - Compilation Error</title>
    <style>
      body { font-family: monospace; padding: 20px; background: #ffebee; }
      .error { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; }
      .content { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="error">
        <h2>❌ Compilation Error</h2>
        <p><strong>Route:</strong> ${match.route.path}</p>
        <p><strong>File:</strong> ${match.route.filePath}</p>
        <p><strong>Error:</strong> ${compileError instanceof Error ? compileError.message : String(compileError)}</p>
    </div>
    <div class="content">
        <h2>Raw .vx file content:</h2>
        <pre>${source.replace(/</g, '<').replace(/>/g, '>')}</pre>
    </div>
</body>
</html>`;

              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(errorHtml);
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Page file not found');
          }
        } else if (pathname.startsWith('/.vx/')) {
          // Serve static files from .vx
          const filePath = path.join('.', pathname);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const ext = path.extname(filePath);
            let contentType = 'text/plain';
            if (ext === '.js') contentType = 'application/javascript';
            else if (ext === '.css') contentType = 'text/css';
            else if (ext === '.html') contentType = 'text/html';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Route not found');
        }
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
      }
    });

    server.listen(port, () => {
      console.log('----------------------------------------------------');
      console.log(`🚀 Fluent VX Dev Server started!`);
      console.log(`Local: http://localhost:${port}/`);
      if (port !== DEFAULT_DEV_PORT) {
        console.log(`(Port ${DEFAULT_DEV_PORT} was in use, using available port ${port})`);
      }
      console.log(`📁 Pages directory: ./src/pages`);
      console.log(`🔍 Routes discovered: ${router.routes.length}`);
      console.log('----------------------------------------------------');
    });

  } catch (error) {
    console.error('Failed to start Fluent VX Dev Server:', error);
    process.exit(1);
  }
}

/**
 * Build for production
 */
async function handleBuild(args: string[]): Promise<void> {
  console.log('🔨 Building Fluent VX project...');

  const fs = await import('fs');
  const path = await import('path');
  const { compileSource } = await import('../compiler');
  const { TargetPlatform } = await import('../compiler/types');

  try {
    const distDir = './.vx';

    // Clean and create dist directory
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // Check if app.vx exists
    const appFile = './src/app.vx';
    if (!fs.existsSync(appFile)) {
      console.error('❌ No app.vx found. Make sure you have a main application file.');
      process.exit(1);
    }

    console.log('📦 Building main application...');

    // Read and compile the main app
    const appSource = fs.readFileSync(appFile, 'utf-8');

    const result = await compileSource(appSource, {
      target: TargetPlatform.BROWSER,
      dev: false,
      minify: true
    });

    // For production, always generate single HTML file with inline assets
    const outputFile = path.join(distDir, 'index.html');
    fs.writeFileSync(outputFile, result.html);
    console.log(`   ✓ Generated index.html with inline CSS and JS`);

    console.log('✅ Build completed!');
    console.log(`📁 Output directory: ${path.resolve(distDir)}`);
    console.log('\n🎯 Next steps:');
    console.log('   npm run preview  - Preview the production build');
    console.log('   Deploy the .vx/ folder to your hosting provider');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

/**
 * Preview production build
 */
async function handlePreview(args: string[]): Promise<void> {
  console.log('🚀 Starting preview server...');

  const http = await import('http');
  const fs = await import('fs');
  const path = await import('path');
  const { findAvailablePort, DEFAULT_PREVIEW_PORT } = await import('../utils/port-finder');

  try {
    const distDir = './.vx';

    if (!fs.existsSync(distDir)) {
      console.error('❌ No build found. Run "vx build" first.');
      process.exit(1);
    }

    const port = await findAvailablePort(DEFAULT_PREVIEW_PORT);

    const server = http.createServer((req, res) => {
      let filePath = req.url === '/' ? '/index.html' : req.url;
      filePath = path.join(distDir, filePath!);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Not Found');
      }
    });

    server.listen(port, () => {
      console.log('----------------------------------------------------');
      console.log('🎉 Preview Server started!');
      console.log(`Local: http://localhost:${port}/`);
      console.log('📁 Serving: ./.vx');
      console.log('----------------------------------------------------');
    });

  } catch (error) {
    console.error('Failed to start preview server:', error);
    process.exit(1);
  }
}


// Command definitions
export const commands: CLICommand[] = [
  {
    name: 'init',
    description: 'Initialize Fluent VX in current directory (zero-config)',
    usage: 'vx init',
    examples: ['vx init'],
    handler: handleInit
  },
  {
    name: 'create',
    description: 'Create a new Fluent VX project',
    usage: 'vx create <project-name>',
    examples: ['vx create my-app'],
    handler: handleCreate
  },
  {
    name: 'dev',
    description: 'Start development server (auto-discovers routes)',
    usage: 'vx dev',
    examples: ['vx dev'],
    handler: handleDev
  },
  {
    name: 'build',
    description: 'Build for production (auto-optimizes)',
    usage: 'vx build',
    examples: ['vx build'],
    handler: handleBuild
  },
  {
    name: 'preview',
    description: 'Preview production build',
    usage: 'vx preview',
    examples: ['vx preview'],
    handler: handlePreview
  },
  {
    name: 'add',
    description: 'Add an integration to the project',
    usage: 'vx add <integration-name>',
    examples: ['vx add tailwind'],
    handler: handleAddIntegration
  },
  {
    name: 'remove',
    description: 'Remove an integration from the project',
    usage: 'vx remove <integration-name>',
    examples: ['vx remove tailwind'],
    handler: handleRemoveIntegration
  },
  {
    name: 'iv',
    description: 'Verify and fix integrations (auto-configure installed packages)',
    usage: 'vx iv [--yes]',
    examples: ['vx iv', 'vx iv --yes'],
    handler: handleVerifyIntegrations
  }
];