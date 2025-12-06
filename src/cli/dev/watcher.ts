/**
 * File watcher for dev server hot reload
 */

import chokidar from 'chokidar';
import { VxRouter } from '../../router';
import { logger } from '../../logger';

export interface WatcherOptions {
  onFileChange?: (filePath: string) => void;
  onFileAdd?: (filePath: string) => void;
  onFileRemove?: (filePath: string) => void;
}

export class DevWatcher {
  private watcher!: chokidar.FSWatcher;
  private router: VxRouter;
  private options: WatcherOptions;

  constructor(router: VxRouter, options: WatcherOptions = {}) {
    this.router = router;
    this.options = options;
    this.setupWatcher();
  }

  private setupWatcher(): void {
    this.watcher = chokidar.watch([
      './src/pages/**/*.vx',
      './src/app.vx',
      './src/styles/**/*.css'
    ], {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }
    });

    this.watcher.on('change', async (filePath: string) => {
      const relativePath = this.getRelativePath(filePath);
      logger.info(`File changed: ${relativePath}`, 'watcher');

      try {
        await this.router.initialize();
        logger.success('Hot reload completed', 'watcher');
        this.options.onFileChange?.(filePath);
      } catch (error) {
        logger.error(`Hot reload failed: ${error instanceof Error ? error.message : String(error)}`, 'watcher');
      }
    });

    this.watcher.on('add', (filePath) => {
      const relativePath = this.getRelativePath(filePath);
      logger.info(`New file detected: ${relativePath}`, 'watcher');
      this.options.onFileAdd?.(filePath);
    });

    this.watcher.on('unlink', (filePath) => {
      const relativePath = this.getRelativePath(filePath);
      logger.info(`File removed: ${relativePath}`, 'watcher');
      this.options.onFileRemove?.(filePath);
    });
  }

  private getRelativePath(filePath: string): string {
    return require('path').relative(process.cwd(), filePath);
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.watcher.close();
      resolve();
    });
  }
}