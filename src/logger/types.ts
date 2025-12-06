/**
 * Fluent VX Logger - Type Definitions
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SUCCESS = 4,
  SILENT = 5
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  duration?: number;
  memory?: NodeJS.MemoryUsage;
  stack?: string;
  requestId?: string;
}

export interface LoggerOptions {
  level: LogLevel;
  colors: boolean;
  timestamps: boolean;
  file?: string;
  maxFileSize: number;
  format: 'text' | 'json' | 'pretty';
  trackMemory: boolean;
  trackPerformance: boolean;
  requestId?: string;
}

export interface Transport {
  write(entry: LogEntry): void;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

export interface Formatter {
  format(entry: LogEntry): string;
}

export interface PerformanceTimer {
  start(): void;
  end(): number;
  log(message?: string): void;
}

export type LogMethod = (message: string, context?: string, data?: any) => void;