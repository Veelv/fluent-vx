/**
 * Fluent VX Logger - Formatters
 */

import { LogEntry, LogLevel, Formatter } from './types';

const LOG_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m',   // Cyan
  [LogLevel.INFO]: '\x1b[37m',    // White
  [LogLevel.WARN]: '\x1b[33m',    // Yellow
  [LogLevel.ERROR]: '\x1b[31m',   // Red
  [LogLevel.SUCCESS]: '\x1b[32m', // Green
  [LogLevel.SILENT]: '\x1b[0m',   // Reset
};

const LOG_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SUCCESS]: 'SUCCESS',
  [LogLevel.SILENT]: 'SILENT',
};

const RESET_COLOR = '\x1b[0m';

/**
 * Text Formatter
 */
export class TextFormatter implements Formatter {
  private colors: boolean;
  private timestamps: boolean;

  constructor(colors: boolean = true, timestamps: boolean = true) {
    this.colors = colors;
    this.timestamps = timestamps;
  }

  format(entry: LogEntry): string {
    const timestamp = this.timestamps ? entry.timestamp.toISOString() : '';
    const level = LOG_LABELS[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const duration = entry.duration ? ` (${entry.duration}ms)` : '';
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';

    if (!this.colors) {
      return `${timestamp} ${level}${context}${requestId}: ${entry.message}${duration}`;
    }

    const color = LOG_COLORS[entry.level];
    const coloredLevel = `${color}${level}${RESET_COLOR}`;
    const coloredContext = context ? `${color}${context}${RESET_COLOR}` : '';
    const coloredRequestId = requestId ? `${color}${requestId}${RESET_COLOR}` : '';

    return `${timestamp} ${coloredLevel}${coloredContext}${coloredRequestId}: ${entry.message}${duration}`;
  }
}

/**
 * JSON Formatter
 */
export class JSONFormatter implements Formatter {
  format(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: LOG_LABELS[entry.level],
      message: entry.message,
      context: entry.context,
      requestId: entry.requestId,
      data: entry.data,
      duration: entry.duration,
      memory: entry.memory,
      stack: entry.stack
    });
  }
}

/**
 * Pretty Formatter (with emojis and better formatting)
 */
export class PrettyFormatter implements Formatter {
  private colors: boolean;

  constructor(colors: boolean = true) {
    this.colors = colors;
  }

  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toLocaleTimeString();
    const level = LOG_LABELS[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const duration = entry.duration ? ` (${entry.duration}ms)` : '';
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';

    const emoji = this.getEmoji(entry.level);
    const color = this.colors ? LOG_COLORS[entry.level] : '';
    const reset = this.colors ? RESET_COLOR : '';

    return `${emoji} ${timestamp} ${color}${level}${reset}${context}${requestId}: ${entry.message}${duration}`;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      case LogLevel.SUCCESS: return '✅';
      default: return '📝';
    }
  }
}

/**
 * Create formatter by name
 */
export function createFormatter(name: 'text' | 'json' | 'pretty', options: { colors?: boolean; timestamps?: boolean } = {}): Formatter {
  switch (name) {
    case 'json':
      return new JSONFormatter();
    case 'pretty':
      return new PrettyFormatter(options.colors);
    case 'text':
    default:
      return new TextFormatter(options.colors, options.timestamps);
  }
}