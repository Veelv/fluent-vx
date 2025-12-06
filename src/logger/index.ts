/**
 * Fluent VX Logger - Main Exports
 */

// Types
export type {
  LogEntry,
  LoggerOptions,
  Transport,
  Formatter,
  PerformanceTimer,
  LogMethod
} from './types';

export { LogLevel } from './types';

// Logger class
export { Logger } from './logger';

// Formatters
export {
  TextFormatter,
  JSONFormatter,
  PrettyFormatter,
  createFormatter
} from './formatters';

// Transports
export {
  ConsoleTransport,
  FileTransport,
  RotatingFileTransport,
  MemoryTransport,
  MultiTransport
} from './transports';

// Global instances
import { Logger } from './logger';
import { LogLevel } from './types';
import { FileTransport } from './transports';

/**
 * Global logger instance
 */
export const logger = new Logger({
  level: LogLevel.INFO,
  colors: true,
  timestamps: true
});

/**
 * Debug logger with more verbose output
 */
export const debugLogger = new Logger({
  level: LogLevel.DEBUG,
  colors: true,
  timestamps: true,
  trackMemory: true,
  trackPerformance: true
});

/**
 * Create a logger with file output
 */
export function createFileLogger(filePath: string, options: Partial<import('./types').LoggerOptions> = {}): Logger {
  const logger = new Logger(options);
  logger.addTransport(new FileTransport(filePath));
  return logger;
}

/**
 * Create a logger with custom options
 */
export function createLogger(options: Partial<import('./types').LoggerOptions> = {}): Logger {
  return new Logger(options);
}

/**
 * Set global log level
 */
export function setLogLevel(level: LogLevel): void {
  logger['options'].level = level;
  debugLogger['options'].level = level;
}

/**
 * Enable/disable colors globally
 */
export function setColors(enabled: boolean): void {
  logger['options'].colors = enabled;
  debugLogger['options'].colors = enabled;
}

/**
 * Enable/disable timestamps globally
 */
export function setTimestamps(enabled: boolean): void {
  logger['options'].timestamps = enabled;
  debugLogger['options'].timestamps = enabled;
}

// Convenience logging functions
export const log = {
  debug: (message: string, context?: string, data?: any) => logger.debug(message, context, data),
  info: (message: string, context?: string, data?: any) => logger.info(message, context, data),
  warn: (message: string, context?: string, data?: any) => logger.warn(message, context, data),
  error: (message: string, context?: string, data?: any) => logger.error(message, context, data),
  success: (message: string, context?: string, data?: any) => logger.success(message, context, data)
};

// Export everything as default
export default {
  Logger,
  logger,
  debugLogger,
  createLogger,
  createFileLogger,
  setLogLevel,
  setColors,
  setTimestamps,
  log,
  LogLevel
};