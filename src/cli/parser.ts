// Fluent VX CLI Argument Parser
// Parse command line arguments

export interface ParsedArgs {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  help: boolean;
  version: boolean;
}

/**
 * Parse command line arguments
 */
export function parseArgs(rawArgs: string[]): ParsedArgs {
  const args = [...rawArgs];
  const flags: Record<string, string | boolean> = {};
  let help = false;
  let version = false;

  // Remove node and script path
  if (args[0]?.endsWith('node') || args[0]?.endsWith('node.exe')) {
    args.shift();
  }
  if (args[0]?.includes('cli/index.js') || args[0]?.includes('vx')) {
    args.shift();
  }

  // Parse flags
  const filteredArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--version' || arg === '-v') {
      version = true;
    } else if (arg.startsWith('--')) {
      // Long flag
      const flagName = arg.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('-')) {
        flags[flagName] = nextArg;
        i++; // Skip next arg
      } else {
        flags[flagName] = true;
      }
    } else if (arg.startsWith('-')) {
      // Short flag
      const flagName = arg.slice(1);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('-')) {
        flags[flagName] = nextArg;
        i++; // Skip next arg
      } else {
        flags[flagName] = true;
      }
    } else {
      // Regular argument
      filteredArgs.push(arg);
    }
  }

  const command = filteredArgs[0] || '';
  const commandArgs = filteredArgs.slice(1);

  return {
    command,
    args: commandArgs,
    flags,
    help,
    version
  };
}

/**
 * Validate parsed arguments
 */
export function validateArgs(parsed: ParsedArgs): { valid: boolean; error?: string } {
  // Version and help don't need validation
  if (parsed.version || parsed.help) {
    return { valid: true };
  }

  // Must have a command
  if (!parsed.command) {
    return {
      valid: false,
      error: 'No command specified. Run "vx --help" to see available commands.'
    };
  }

  return { valid: true };
}