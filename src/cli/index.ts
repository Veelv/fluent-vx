#!/usr/bin/env node

// Fluent VX CLI
// Professional command-line interface with modular architecture

import { cli } from './cli';

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  try {
    // Remove 'node' and script path from arguments
    const args = process.argv.slice(2);

    // Run CLI with arguments
    await cli.run(args);

  } catch (error) {
    console.error('💥 Unexpected error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run CLI
main();