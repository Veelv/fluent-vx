/**
 * Fluent VX CLI - Professional CLI Runner
 */

import { Command } from './types/cli.types';
import { CLILogger } from './utils/logger';
import { dev, build, create, preview, init, add, remove, iv } from './commands/index';

export class CLIRunner {
  private logger: CLILogger;
  private availableCommands: Map<string, Command>;

  constructor() {
    this.logger = new CLILogger();
    this.availableCommands = new Map();
    this.registerCommands();
  }

  private registerCommands(): void {
    // Register available commands
    this.availableCommands.set('dev', {
      name: 'dev',
      description: 'Start development server with hot reload',
      usage: 'vx dev [options]',
      examples: ['vx dev', 'vx dev --port 3000'],
      execute: dev
    });

    this.availableCommands.set('build', {
      name: 'build',
      description: 'Build for production with optimizations',
      usage: 'vx build [options]',
      examples: ['vx build', 'vx build --minify'],
      execute: build
    });

    // Placeholder commands
    this.availableCommands.set('create', {
      name: 'create',
      description: 'Create a new Fluent VX project',
      usage: 'vx create <name>',
      examples: ['vx create my-app'],
      execute: create
    });

    this.availableCommands.set('preview', {
      name: 'preview',
      description: 'Preview production build',
      usage: 'vx preview [options]',
      examples: ['vx preview', 'vx preview --port 3000'],
      execute: preview
    });

    this.availableCommands.set('init', {
      name: 'init',
      description: 'Initialize Fluent VX in current directory',
      usage: 'vx init',
      examples: ['vx init'],
      execute: init
    });
  }

  async run(args: string[]): Promise<void> {
    const [commandName, ...commandArgs] = args;

    if (!commandName) {
      this.showHelp();
      return;
    }

    if (commandName === '--help' || commandName === '-h') {
      this.showHelp();
      return;
    }

    if (commandName === '--version' || commandName === '-v') {
      this.showVersion();
      return;
    }

    const command = this.availableCommands.get(commandName);
    if (!command) {
      this.logger.error(`Unknown command: ${commandName}`);
      this.showHelp();
      return;
    }

    try {
      this.logger.info(`Executing: vx ${commandName}`);
      await command.execute(commandArgs);
    } catch (error) {
      this.logger.error(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  private showHelp(): void {
    console.log(`
🚀 Fluent VX - Zero-config frontend framework

Usage:
  vx <command> [options]

Available Commands:
${Array.from(this.availableCommands.values()).map(cmd =>
  `  ${cmd.name.padEnd(10)} ${cmd.description}`
).join('\n')}

Global Options:
  --help, -h     Show help
  --version, -v  Show version

Examples:
  vx create my-app    Create a new project
  vx dev              Start development server
  vx build            Build for production
  vx preview          Preview production build

Learn more: https://fluent-vx.dev
`);
  }

  private showVersion(): void {
    const packageJson = require('../../package.json');
    console.log(`Fluent VX v${packageJson.version}`);
  }

  /**
   * Get available commands for programmatic access
   */
  getCommands(): Map<string, Command> {
    return new Map(this.availableCommands);
  }

  /**
   * Add a custom command
   */
  addCommand(command: Command): void {
    this.availableCommands.set(command.name, command);
  }

  /**
   * Remove a command
   */
  removeCommand(name: string): void {
    this.availableCommands.delete(name);
  }
}

// Export singleton instance
export const cli = new CLIRunner();