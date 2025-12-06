// Fluent VX CLI Commands
// Command definitions and handlers

import { handleAddIntegration, handleRemoveIntegration, handleVerifyIntegrations } from './integration';
import { handleInit } from './commands/init';
import { handleCreate } from './commands/create';
import { handleDev } from './commands/dev';
import { handleBuild } from './commands/build';
import { handlePreview } from './commands/preview';


export interface CLICommand {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: (args: string[]) => Promise<void>;
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