/**
 * Intelligent Caching System for Fluent VX HMR
 * Memory + Disk cache with module graph tracking
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CacheEntry {
  id: string;
  content: string;
  hash: string;
  dependencies: string[];
  importers: string[];
  timestamp: number;
  ast?: any;
  metadata?: any;
}

export interface ModuleInfo {
  id: string;
  filePath: string;
  dependencies: string[];
  importers: string[];
  hash: string;
  lastModified: number;
  type: 'page' | 'layout' | 'component' | 'style' | 'data';
}

/**
 * In-memory development cache
 */
export class DevCache {
  private entries = new Map<string, CacheEntry>();
  private moduleGraph = new Map<string, ModuleInfo>();

  set(entry: CacheEntry): void {
    this.entries.set(entry.id, entry);
    this.updateModuleGraph(entry);
  }

  get(id: string): CacheEntry | null {
    return this.entries.get(id) || null;
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  isValid(id: string, hash: string): boolean {
    const entry = this.entries.get(id);
    return entry?.hash === hash;
  }

  invalidate(id: string): string[] {
    const invalidated: string[] = [];
    const queue = [id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (this.entries.has(currentId)) {
        this.entries.delete(currentId);
        invalidated.push(currentId);

        // Invalidate all importers
        const moduleInfo = this.moduleGraph.get(currentId);
        if (moduleInfo) {
          moduleInfo.importers.forEach(importer => {
            if (!invalidated.includes(importer)) {
              queue.push(importer);
            }
          });
        }
      }
    }

    return invalidated;
  }

  private updateModuleGraph(entry: CacheEntry): void {
    const moduleInfo: ModuleInfo = {
      id: entry.id,
      filePath: entry.id,
      dependencies: entry.dependencies,
      importers: [],
      hash: entry.hash,
      lastModified: entry.timestamp,
      type: this.detectModuleType(entry.id)
    };

    // Remove old relationships
    const oldInfo = this.moduleGraph.get(entry.id);
    if (oldInfo) {
      oldInfo.importers.forEach(importer => {
        const importerInfo = this.moduleGraph.get(importer);
        if (importerInfo) {
          importerInfo.dependencies = importerInfo.dependencies.filter(dep => dep !== entry.id);
        }
      });
    }

    // Add new relationships
    entry.dependencies.forEach(dep => {
      if (!this.moduleGraph.has(dep)) {
        this.moduleGraph.set(dep, {
          id: dep,
          filePath: dep,
          dependencies: [],
          importers: [],
          hash: '',
          lastModified: 0,
          type: this.detectModuleType(dep)
        });
      }

      const depInfo = this.moduleGraph.get(dep)!;
      if (!depInfo.importers.includes(entry.id)) {
        depInfo.importers.push(entry.id);
      }
    });

    this.moduleGraph.set(entry.id, moduleInfo);
  }

  private detectModuleType(id: string): ModuleInfo['type'] {
    if (id.includes('/pages/')) return 'page';
    if (id.includes('/app.vx')) return 'layout';
    if (id.includes('.css')) return 'style';
    if (id.includes('#data')) return 'data';
    return 'component';
  }

  getModuleGraph(): Map<string, ModuleInfo> {
    return this.moduleGraph;
  }

  getStats(): { entries: number; modules: number; totalSize: number } {
    return {
      entries: this.entries.size,
      modules: this.moduleGraph.size,
      totalSize: Array.from(this.entries.values()).reduce((sum, entry) => sum + entry.content.length, 0)
    };
  }

  clear(): void {
    this.entries.clear();
    this.moduleGraph.clear();
  }
}

/**
 * Disk-based build cache
 */
export class BuildCache {
  private cacheDir: string;

  constructor(projectRoot: string) {
    this.cacheDir = path.join(projectRoot, '.framework', 'cache');
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  get(key: string): CacheEntry | null {
    const filePath = this.getCachePath(key);
    if (!fs.existsSync(filePath)) return null;

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return null;
    }
  }

  set(entry: CacheEntry): void {
    const filePath = this.getCachePath(entry.id);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
  }

  private getCachePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  clear(): void {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
      this.ensureCacheDir();
    }
  }
}