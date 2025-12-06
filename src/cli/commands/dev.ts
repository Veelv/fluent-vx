/**
 * Professional development server command
 * Uses the new HMR-enabled dev server architecture
 */

import { DevServer } from '../../core/dev/dev-server';
import { findAvailablePort } from '../../utils/port-finder';

const DEFAULT_DEV_PORT = 5002;

export async function handleDev(args: string[]): Promise<void> {
  console.log('🚀 Starting Fluent VX Professional Dev Server...');

  // Parse command line arguments
  let port = DEFAULT_DEV_PORT;
  let host = '127.0.0.1';
  let enableHMR = true; // HMR enabled by default

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
      case '--no-hmr':
        enableHMR = false;
        break;
      case '--hmr':
        enableHMR = true;
        break;
    }
  }

  // Find available port
  const availablePort = await findAvailablePort(port);

  if (availablePort !== port) {
    console.log(`⚠️  Port ${port} in use, using ${availablePort} instead`);
  }

  // Create and start professional dev server
  const devServer = new DevServer({
    port: availablePort,
    host,
    projectRoot: process.cwd(),
    enableHMR
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down dev server...');
    await devServer.stop();
    process.exit(0);
  });

  // Start server
  await devServer.start();
}