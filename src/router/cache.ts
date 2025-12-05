/**
 * Fluent VX Router - Intelligent Caching & Prefetching
 * Enterprise-grade performance optimization system
 */

import { Route, RouteMatch, RouteCache, PrefetchStrategy } from './types';

export class RouteCacheImpl implements RouteCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key: string): RouteMatch | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    // Update access time for LRU
    entry.lastAccessed = Date.now();
    return entry.match;
  }

  set(key: string, match: RouteMatch, ttl?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      match,
      expires: Date.now() + (ttl || this.defaultTTL),
      lastAccessed: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

export class IntelligentPrefetcher {
  private strategy: PrefetchStrategy;
  private prefetching = new Set<string>();
  private prefetchQueue: string[] = [];
  private activeRequests = 0;

  constructor(strategy: PrefetchStrategy = {
    enabled: true,
    onHover: true,
    onFocus: true,
    timeout: 100,
    concurrency: 3
  }) {
    this.strategy = strategy;
    this.setupEventListeners();
  }

  /**
   * Prefetch a route
   */
  async prefetch(path: string): Promise<void> {
    if (!this.strategy.enabled || this.prefetching.has(path)) {
      return;
    }

    // Add to queue if too many concurrent requests
    if (this.activeRequests >= this.strategy.concurrency!) {
      this.prefetchQueue.push(path);
      return;
    }

    await this.doPrefetch(path);
  }

  /**
   * Prefetch multiple routes
   */
  async prefetchBatch(paths: string[]): Promise<void> {
    const promises = paths.map(path => this.prefetch(path));
    await Promise.allSettled(promises);
  }

  /**
   * Warm up critical routes
   */
  async warmup(routes: string[]): Promise<void> {
    await this.prefetchBatch(routes);
  }

  private async doPrefetch(path: string): Promise<void> {
    this.prefetching.add(path);
    this.activeRequests++;

    try {
      // Simulate component loading
      await this.loadRouteComponent(path);

      // Cache the route match
      console.log(`[Prefetch] Successfully prefetched: ${path}`);
    } catch (error) {
      console.warn(`[Prefetch] Failed to prefetch: ${path}`, error);
    } finally {
      this.prefetching.delete(path);
      this.activeRequests--;

      // Process next in queue
      if (this.prefetchQueue.length > 0) {
        const nextPath = this.prefetchQueue.shift()!;
        this.doPrefetch(nextPath);
      }
    }
  }

  private async loadRouteComponent(path: string): Promise<void> {
    // In a real implementation, this would:
    // 1. Resolve the route to a component file
    // 2. Dynamically import the component
    // 3. Cache the loaded component

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private setupEventListeners(): void {
    if (typeof document === 'undefined') return;

    if (this.strategy.onHover) {
      document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
    }

    if (this.strategy.onFocus) {
      document.addEventListener('focusin', this.handleFocus.bind(this), true);
    }
  }

  private handleMouseOver(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;

    if (link && this.shouldPrefetch(link.href)) {
      clearTimeout((link as any)._prefetchTimeout);
      (link as any)._prefetchTimeout = setTimeout(() => {
        const path = this.getPathFromUrl(link.href);
        this.prefetch(path);
      }, this.strategy.timeout);
    }
  }

  private handleFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;

    if (link && this.shouldPrefetch(link.href)) {
      const path = this.getPathFromUrl(link.href);
      this.prefetch(path);
    }
  }

  private shouldPrefetch(href: string): boolean {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  private getPathFromUrl(href: string): string {
    try {
      const url = new URL(href, window.location.origin);
      return url.pathname;
    } catch {
      return href;
    }
  }

  /**
   * Get prefetch statistics
   */
  getStats() {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.prefetchQueue.length,
      prefetching: Array.from(this.prefetching)
    };
  }
}

interface CacheEntry {
  match: RouteMatch;
  expires: number;
  lastAccessed: number;
}

// Utility functions
export function createRouteCache(maxSize = 100, defaultTTL = 5 * 60 * 1000): RouteCache {
  return new RouteCacheImpl(maxSize, defaultTTL);
}

export function createPrefetcher(strategy?: Partial<PrefetchStrategy>): IntelligentPrefetcher {
  return new IntelligentPrefetcher({
    enabled: true,
    onHover: true,
    onFocus: true,
    timeout: 100,
    concurrency: 3,
    ...strategy
  });
}