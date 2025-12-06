/**
 * Fluent VX CLI - Professional Type Definitions
 */

export interface Command {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  execute(args: string[]): Promise<void>;
}

export interface CLIOptions {
  verbose?: boolean;
  port?: number;
  host?: string;
  config?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors?: boolean;
  compression?: boolean;
  watch?: boolean;
  liveReload?: boolean;
}

export interface BuildConfig {
  outDir: string;
  minify?: boolean;
  sourcemap?: boolean;
  target?: 'browser' | 'node';
  format?: 'esm' | 'cjs';
}

export interface DevServerStats {
  startTime: number;
  requests: number;
  compilations: number;
  errors: number;
  routes: number;
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}