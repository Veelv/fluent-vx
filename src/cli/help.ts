// Fluent VX CLI Help System
// Help and usage information

import { commands } from './commands';

export interface HelpOptions {
  command?: string;
}

/**
 * Show general help
 */
export function showGeneralHelp(): void {
  console.log(`
🤖 Fluent VX - Zero-config frontend framework

USAGE:
   vx <command>

COMMANDS:`);

  // Show all commands
  const maxNameLength = Math.max(...commands.map(cmd => cmd.name.length));
  const maxDescLength = Math.max(...commands.map(cmd => cmd.description.length));

  for (const cmd of commands) {
    const paddedName = cmd.name.padEnd(maxNameLength);
    console.log(`   ${paddedName} ${cmd.description}`);
  }

  console.log(`
EXAMPLES:`);
  for (const cmd of commands) {
    for (const example of cmd.examples) {
      console.log(`   ${example}`);
    }
  }

  console.log(`
INTEGRATIONS:
   vx add <name>     Add an integration (e.g., vx add tailwind)
   vx remove <name>  Remove an integration (e.g., vx remove tailwind)

FEATURES:
   ⚡ Zero-config: Just vx init && npm install && npm run dev
   🛣️ Auto-routing: Files in ./src/pages/ become routes
   🎨 Templates: .vx files with reactive syntax
   🚀 Auto-optimize: Detects dev/prod automatically
   🔌 Integrations: Add/remove plugins easily

For more information, visit: https://fluent-vx.dev
`);
}

/**
 * Show help for specific command
 */
export function showCommandHelp(commandName: string): void {
  const command = commands.find(cmd => cmd.name === commandName);

  if (!command) {
    console.error(`❌ Unknown command: ${commandName}`);
    console.log('\nRun "vx --help" to see available commands.');
    process.exit(1);
  }

  console.log(`
🤖 Fluent VX - ${command.name}

DESCRIPTION:
   ${command.description}

USAGE:
   ${command.usage}

EXAMPLES:`);

  for (const example of command.examples) {
    console.log(`   ${example}`);
  }

  console.log('');
}

/**
 * Show version information
 */
export function showVersion(): void {
  // Read version from package.json
  try {
    const packageJson = require('../../package.json');
    console.log(`Fluent VX v${packageJson.version}`);
  } catch {
    console.log('Fluent VX (version unknown)');
  }
}

/**
 * Main help function
 */
export function showHelp(options: HelpOptions = {}): void {
  const { command } = options;

  if (command) {
    showCommandHelp(command);
  } else {
    showGeneralHelp();
  }
}