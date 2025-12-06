/**
 * File watcher for dev server hot reload
 * Professional implementation using Node.js fs.watch
 */

import * as fs from 'fs';
import * as path from 'path';
import { VxRouter } from '../../router';
import { logger } from '../../logger';

export interface WatcherOptions {
  onFileChange?: (filePath: string) => void;
  onFileAdd?: (filePath: string) => void;
  onFileRemove?: (filePath: string) => void;
}

interface WatchedFile {
  path: string;
  watcher: fs.FSWatcher;
  lastModified?: number;
}

export class DevWatcher {
  private watchers: Map<string, WatchedFile> = new Map();
  private router: VxRouter;
  private options: WatcherOptions;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 100; // ms

  constructor(router: VxRouter, options: WatcherOptions = {}) {
    this.router = router;
    this.options = options;
    this.setupWatcher();
  }

  private setupWatcher(): void {
    const watchPatterns = [
      './src/pages/**/*.vx',
      './src/app.vx',
      './src/styles/**/*.css'
    ];

    // Convert glob patterns to actual file paths
    for (const pattern of watchPatterns) {
      this.watchPattern(pattern);
    }

    logger.info('File watcher initialized with custom fs.watch implementation', 'watcher');
  }

  private watchPattern(pattern: string): void {
    // Simple glob resolution - for production, consider using a proper glob library
    const baseDir = path.dirname(pattern.replace(/\*\*.*$/, ''));
    const extension = pattern.includes('**') ? pattern.split('.').pop() : null;

    try {
      // Watch the directory
      const watcher = fs.watch(baseDir, { persistent: true, recursive: pattern.includes('**') }, (eventType, filename) => {
        if (!filename) return;

        const fullPath = path.join(baseDir, filename);

        // Check if file matches our pattern
        if (extension && !fullPath.endsWith(`.${extension}`)) return;

        this.handleFileEvent(eventType, fullPath);
      });

      this.watchers.set(pattern, { path: pattern, watcher });
    } catch (error) {
      logger.warn(`Failed to watch pattern ${pattern}: ${error}`, 'watcher');
    }
  }

  private handleFileEvent(eventType: string, filePath: string): void {
    // Debounce file events
    const key = filePath;
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    this.debounceTimers.set(key, setTimeout(async () => {
      this.debounceTimers.delete(key);

      try {
        const stats = await fs.promises.stat(filePath);
        const currentModified = stats.mtime.getTime();

        // Check if this is a real change (not just access time)
        const watchedFile = Array.from(this.watchers.values()).find(w => w.path === filePath.split('/').slice(0, -1).join('/'));
        if (watchedFile?.lastModified === currentModified) return;

        if (watchedFile) {
          watchedFile.lastModified = currentModified;
        }

        const relativePath = this.getRelativePath(filePath);

        if (eventType === 'change') {
          logger.info(`File changed: ${relativePath}`, 'watcher');
          await this.handleFileChange(filePath);
        } else if (eventType === 'rename') {
          // Check if file exists to determine if it was added or removed
          try {
            await fs.promises.access(filePath);
            logger.info(`New file detected: ${relativePath}`, 'watcher');
            this.options.onFileAdd?.(filePath);
          } catch {
            logger.info(`File removed: ${relativePath}`, 'watcher');
            this.options.onFileRemove?.(filePath);
          }
        }
      } catch (error) {
        // File might have been deleted
        if (eventType === 'rename') {
          const relativePath = this.getRelativePath(filePath);
          logger.info(`File removed: ${relativePath}`, 'watcher');
          this.options.onFileRemove?.(filePath);
        }
      }
    }, this.DEBOUNCE_DELAY));
  }

  private async handleFileChange(filePath: string): Promise<void> {
    try {
      await this.router.initialize();
      logger.success('Hot reload completed', 'watcher');
      this.options.onFileChange?.(filePath);
    } catch (error) {
      logger.error(`Hot reload failed: ${error instanceof Error ? error.message : String(error)}`, 'watcher');
    }
  }

  private getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }

  async stop(): Promise<void> {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close all watchers
    const closePromises = Array.from(this.watchers.values()).map(watchedFile =>
      new Promise<void>((resolve) => {
        watchedFile.watcher.close();
        resolve();
      })
    );

    await Promise.all(closePromises);
    this.watchers.clear();
    logger.info('File watcher stopped', 'watcher');
  }
}