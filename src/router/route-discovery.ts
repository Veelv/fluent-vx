/**
 * Fluent VX Router - Route Discovery
 * Automatically discovers routes from file system structure
 */

import * as fs from 'fs';
import * as path from 'path';
import { Route, RouteConfig, RouteSegment, StaticSegment, DynamicSegment, CatchAllSegment } from './types';

export class RouteDiscovery {
  private config: Required<RouteConfig>;

  constructor(config: RouteConfig = {}) {
    this.config = {
      pagesDir: './src/pages',
      basePath: '/',
      caseSensitive: false,
      trailingSlash: false,
      prefetch: true,
      historyMode: 'browser',
      scrollBehavior: { mode: 'auto' },
      guards: [],
      middleware: [],
      loadingComponent: '',
      analytics: false,
      ...config
    } as Required<RouteConfig>;
  }

  /**
   * Discover all routes from the file system
   */
  async discoverRoutes(): Promise<Route[]> {
    const routes: Route[] = [];
    const pagesDir = path.resolve(this.config.pagesDir);

    if (!fs.existsSync(pagesDir)) {
      throw new Error(`Pages directory not found: ${pagesDir}`);
    }

    await this.scanDirectory(pagesDir, '', routes, []);
    return this.sortRoutes(routes);
  }

  /**
   * Recursively scan directory for route files
   */
  private async scanDirectory(
    dirPath: string,
    currentPath: string,
    routes: Route[],
    layouts: string[]
  ): Promise<void> {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    // Check for layout files first
    const layoutFiles = entries.filter(entry =>
      entry.isFile() && entry.name.startsWith('layout.') && entry.name.endsWith('.vx')
    );

    const currentLayouts = [...layouts];
    for (const layout of layoutFiles) {
      currentLayouts.push(path.join(dirPath, layout.name));
    }

    // Process route files
    const routeFiles = entries.filter(entry =>
      entry.isFile() &&
      (entry.name === 'index.vx' || entry.name === 'page.vx' || entry.name.endsWith('.vx')) &&
      !entry.name.startsWith('layout.') &&
      !entry.name.startsWith('_')
    );

    for (const file of routeFiles) {
      const routePath = this.fileToRoutePath(currentPath, file.name);
      const filePath = path.join(dirPath, file.name);

      const route: Route = {
        path: routePath,
        filePath,
        params: this.extractParams(routePath),
        isDynamic: this.isDynamicRoute(routePath),
        isCatchAll: this.isCatchAllRoute(routePath),
        priority: this.calculatePriority(routePath),
        layouts: [...currentLayouts]
      };

      routes.push(route);
    }

    // Process subdirectories
    const subdirs = entries.filter(entry =>
      entry.isDirectory() &&
      !entry.name.startsWith('_') &&
      !entry.name.startsWith('.')
    );

    for (const subdir of subdirs) {
      const subPath = path.join(currentPath, subdir.name);
      await this.scanDirectory(
        path.join(dirPath, subdir.name),
        subPath,
        routes,
        currentLayouts
      );
    }
  }

  /**
   * Convert file path to route path
   */
  private fileToRoutePath(currentPath: string, filename: string): string {
    let routePath = currentPath;

    // Handle index files
    if (filename === 'index.vx' || filename === 'page.vx') {
      // Keep current path
    } else {
      // Remove .vx extension and add to path
      const name = filename.replace(/\.vx$/, '');
      routePath = path.join(routePath, name);
    }

    // Normalize path separators
    routePath = routePath.replace(/\\/g, '/');

    // Handle dynamic routes
    routePath = routePath
      .replace(/\[([^\]]+)\]/g, ':$1')  // [id] -> :id
      .replace(/\[\.\.\.([^\]]+)\]/g, '*$1'); // [...slug] -> *slug

    // Ensure leading slash
    if (!routePath.startsWith('/')) {
      routePath = '/' + routePath;
    }

    // Handle root path
    if (routePath === '/') {
      return routePath;
    }

    // Remove trailing slash unless configured
    if (!this.config.trailingSlash && routePath.endsWith('/') && routePath !== '/') {
      routePath = routePath.slice(0, -1);
    }

    return routePath;
  }

  /**
   * Extract parameter names from route path
   */
  private extractParams(routePath: string): string[] {
    const params: string[] = [];
    const segments = this.parseRouteSegments(routePath);

    for (const segment of segments) {
      if (segment.type === 'dynamic') {
        params.push(segment.name);
      } else if (segment.type === 'catch-all') {
        params.push(segment.name);
      }
    }

    return params;
  }

  /**
   * Check if route has dynamic segments
   */
  private isDynamicRoute(routePath: string): boolean {
    return /\[|\*/.test(routePath);
  }

  /**
   * Check if route has catch-all segments
   */
  private isCatchAllRoute(routePath: string): boolean {
    return /\*/.test(routePath);
  }

  /**
   * Calculate route priority for matching (higher = more specific)
   */
  private calculatePriority(routePath: string): number {
    let priority = 0;

    // Static routes have highest priority
    if (!this.isDynamicRoute(routePath)) {
      priority += 100;
    }

    // Routes with fewer parameters are more specific
    const paramCount = (routePath.match(/\[|\*/g) || []).length;
    priority += (10 - paramCount) * 10;

    // Exact matches over nested routes
    if (!routePath.includes('/')) {
      priority += 5;
    }

    return priority;
  }

  /**
   * Sort routes by priority (highest first)
   */
  private sortRoutes(routes: Route[]): Route[] {
    return routes.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Parse route path into segments
   */
  private parseRouteSegments(routePath: string): RouteSegment[] {
    const segments: RouteSegment[] = [];
    const parts = routePath.split('/').filter(Boolean);

    for (const part of parts) {
      if (part.startsWith(':')) {
        segments.push({
          type: 'dynamic',
          name: part.slice(1)
        });
      } else if (part.startsWith('*')) {
        segments.push({
          type: 'catch-all',
          name: part.slice(1)
        });
      } else {
        segments.push({
          type: 'static',
          value: part
        });
      }
    }

    return segments;
  }
}