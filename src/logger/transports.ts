/**
 * Fluent VX Logger - Transports
 */

import * as fs from 'fs';
import * as path from 'path';
import { LogEntry, Transport } from './types';

/**
 * Console Transport
 */
export class ConsoleTransport implements Transport {
  write(entry: LogEntry): void {
    const stream = entry.level >= 3 ? process.stderr : process.stdout;
    stream.write(entry.message + '\n');
  }
}

/**
 * File Transport
 */
export class FileTransport implements Transport {
  private stream!: fs.WriteStream;
  private maxFileSize: number;

  constructor(filePath: string, maxFileSize: number = 10 * 1024 * 1024) {
    this.maxFileSize = maxFileSize;
    this.setupFile(filePath);
  }

  private setupFile(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
  }

  write(entry: LogEntry): void {
    if (this.stream.writable) {
      this.stream.write(entry.message + '\n');
    }
  }

  async flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.stream.writable) {
        this.stream.end(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

/**
 * Rotating File Transport
 */
export class RotatingFileTransport implements Transport {
  private currentFile: string;
  private maxFileSize: number;
  private maxFiles: number;
  private stream!: fs.WriteStream;

  constructor(basePath: string, maxFileSize: number = 10 * 1024 * 1024, maxFiles: number = 5) {
    this.currentFile = basePath;
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.setupFile();
  }

  private setupFile(): void {
    const dir = path.dirname(this.currentFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.stream = fs.createWriteStream(this.currentFile, { flags: 'a' });
  }

  private rotateFile(): void {
    // Close current stream
    this.stream.end();

    // Rotate files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = `${this.currentFile}.${i}`;
      const newFile = `${this.currentFile}.${i + 1}`;

      if (fs.existsSync(oldFile)) {
        if (i === this.maxFiles - 1) {
          fs.unlinkSync(oldFile); // Remove oldest
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Move current to .1
    if (fs.existsSync(this.currentFile)) {
      fs.renameSync(this.currentFile, `${this.currentFile}.1`);
    }

    // Create new stream
    this.setupFile();
  }

  private shouldRotate(): boolean {
    try {
      const stats = fs.statSync(this.currentFile);
      return stats.size >= this.maxFileSize;
    } catch {
      return false;
    }
  }

  write(entry: LogEntry): void {
    if (this.shouldRotate()) {
      this.rotateFile();
    }

    if (this.stream.writable) {
      this.stream.write(entry.message + '\n');
    }
  }

  async flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.stream.writable) {
        this.stream.end(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

/**
 * Memory Transport (for testing/debugging)
 */
export class MemoryTransport implements Transport {
  private entries: LogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  write(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  search(query: string): LogEntry[] {
    return this.entries.filter(entry =>
      entry.message.toLowerCase().includes(query.toLowerCase()) ||
      (entry.context && entry.context.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

/**
 * Multi Transport (combines multiple transports)
 */
export class MultiTransport implements Transport {
  private transports: Transport[];

  constructor(transports: Transport[]) {
    this.transports = transports;
  }

  write(entry: LogEntry): void {
    this.transports.forEach(transport => {
      try {
        transport.write(entry);
      } catch (error) {
        console.error('Transport error:', error);
      }
    });
  }

  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map(transport =>
        transport.flush ? transport.flush() : Promise.resolve()
      )
    );
  }

  async close(): Promise<void> {
    await Promise.all(
      this.transports.map(transport =>
        transport.close ? transport.close() : Promise.resolve()
      )
    );
  }
}