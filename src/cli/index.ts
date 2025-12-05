#!/usr/bin/env node

// Fluent VX CLI
// Professional command-line interface with modular architecture

import { parseArgs, validateArgs } from './parser';
import { showHelp, showVersion } from './help';
import { commands } from './commands';

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const parsed = parseArgs(process.argv);

    // Handle special flags
    if (parsed.version) {
      showVersion();
      return;
    }

    if (parsed.help) {
      showHelp({ command: parsed.command });
      return;
    }

    // Validate arguments
    const validation = validateArgs(parsed);
    if (!validation.valid) {
      console.error(`❌ ${validation.error}`);
      process.exit(1);
    }

    // Find and execute command
    const command = commands.find(cmd => cmd.name === parsed.command);

    if (!command) {
      console.error(`❌ Unknown command: ${parsed.command}`);
      console.log('\nRun "vx --help" to see available commands.');
      process.exit(1);
    }

    // Execute command
    await command.handler(parsed.args);

  } catch (error) {
    console.error('💥 Unexpected error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run CLI
main();