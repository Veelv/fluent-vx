/**
 * Fluent VX Logger - Main Logger Class
 */

import { LogEntry, LogLevel, LoggerOptions, PerformanceTimer, Transport } from './types';
import { TextFormatter } from './formatters';
import { ConsoleTransport } from './transports';

export class Logger {
  private options: LoggerOptions;
  private transports: Transport[];
  private buffer: LogEntry[] = [];
  private timers: Map<string, { start: bigint; context?: string }> = new Map();

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      level: LogLevel.INFO,
      colors: true,
      timestamps: true,
      maxFileSize: 10 * 1024 * 1024,
      format: 'text',
      trackMemory: false,
      trackPerformance: false,
      ...options
    };

    this.transports = [new ConsoleTransport()];
  }

  /**
   * Add a transport
   */
  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  /**
   * Remove all transports
   */
  clearTransports(): void {
    this.transports = [];
  }

  /**
   * Create log entry
   */
  private createEntry(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
      requestId: this.options.requestId
    };

    if (this.options.trackMemory) {
      entry.memory = process.memoryUsage();
    }

    return entry;
  }

  /**
   * Format and write entry
   */
  private writeEntry(entry: LogEntry): void {
    if (entry.level < this.options.level) return;

    // Format message
    const formatter = new TextFormatter(this.options.colors, this.options.timestamps);
    entry.message = formatter.format(entry);

    // Add to buffer
    this.buffer.push(entry);
    if (this.buffer.length > 1000) {
      this.buffer.shift();
    }

    // Write to transports
    this.transports.forEach(transport => {
      try {
        transport.write(entry);
      } catch (error) {
        console.error('Logger transport error:', error);
      }
    });
  }

  // Logging methods
  debug(message: string, context?: string, data?: any): void {
    this.writeEntry(this.createEntry(LogLevel.DEBUG, message, context, data));
  }

  info(message: string, context?: string, data?: any): void {
    this.writeEntry(this.createEntry(LogLevel.INFO, message, context, data));
  }

  warn(message: string, context?: string, data?: any): void {
    this.writeEntry(this.createEntry(LogLevel.WARN, message, context, data));
  }

  error(message: string, context?: string, data?: any): void {
    this.writeEntry(this.createEntry(LogLevel.ERROR, message, context, data));
  }

  success(message: string, context?: string, data?: any): void {
    this.writeEntry(this.createEntry(LogLevel.SUCCESS, message, context, data));
  }

  /**
   * Performance timing
   */
  time(label: string): PerformanceTimer {
    const start = process.hrtime.bigint();

    return {
      start: () => {
        this.timers.set(label, { start, context: undefined });
      },

      end: (): number => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000;
        return Math.round(duration * 100) / 100;
      },

      log: (message?: string) => {
        const duration = this.time(label).end();
        const msg = message || `${label} completed`;
        this.info(`${msg} in ${duration}ms`, 'perf', { duration, label });
        this.timers.delete(label);
      }
    };
  }

  /**
   * Request logging
   */
  request(id: number, method: string, url: string, status?: number, duration?: number): void {
    const statusStr = status ? ` ${status}` : '';
    const durationStr = duration ? ` ${duration}ms` : '';
    const level = status && status >= 400 ? LogLevel.ERROR : LogLevel.INFO;

    this.writeEntry(this.createEntry(level, `[${id}] ${method} ${url}${statusStr}${durationStr}`, 'http'));
  }

  /**
   * Memory usage logging
   */
  memory(context?: string): void {
    if (!this.options.trackMemory) return;

    const usage = process.memoryUsage();
    const rss = Math.round(usage.rss / 1024 / 1024);
    const heapUsed = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(usage.heapTotal / 1024 / 1024);

    this.debug(`Memory: RSS ${rss}MB, Heap ${heapUsed}/${heapTotal}MB`, context, {
      rss: usage.rss,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external
    });
  }

  /**
   * Search logs
   */
  search(query: string, level?: LogLevel): LogEntry[] {
    return this.buffer.filter(entry => {
      const matchesQuery = entry.message.toLowerCase().includes(query.toLowerCase()) ||
                          (entry.context && entry.context.toLowerCase().includes(query.toLowerCase()));
      const matchesLevel = level === undefined || entry.level === level;
      return matchesQuery && matchesLevel;
    });
  }

  /**
   * Get recent logs
   */
  recent(count: number = 10): LogEntry[] {
    return this.buffer.slice(-count);
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Flush all transports
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map(transport =>
        transport.flush ? transport.flush() : Promise.resolve()
      )
    );
  }

  /**
   * Close all transports
   */
  async close(): Promise<void> {
    await Promise.all(
      this.transports.map(transport =>
        transport.close ? transport.close() : Promise.resolve()
      )
    );
  }

  /**
   * Create child logger with context
   */
  child(context: string): Logger {
    const childLogger = new Logger({
      ...this.options,
      requestId: context
    });

    // Copy transports
    childLogger.clearTransports();
    this.transports.forEach(transport => childLogger.addTransport(transport));

    return childLogger;
  }

  /**
   * Get logger stats
   */
  getStats() {
    const levelCounts = this.buffer.reduce((acc, entry) => {
      acc[entry.level] = (acc[entry.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalEntries: this.buffer.length,
      levelCounts,
      transports: this.transports.length,
      options: this.options
    };
  }
}