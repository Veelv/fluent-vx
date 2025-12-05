/**
 * Fluent VX Router - Main Router Implementation
 * Professional file-system routing with automatic optimization
 */

import { Route, RouteMatch, RouteConfig, Router as IRouter, RouteContext, RouteError, RouteGuard, RouteMiddleware } from './types';
import { RouteDiscovery } from './route-discovery';
import { RouteMatcher } from './route-matcher';
import { RouteGuardSystem, RouteMiddlewareSystem, AuthGuard, RoleGuard, AnalyticsMiddleware, LoadingMiddleware } from './guards';
import { RouteCacheImpl, IntelligentPrefetcher, createRouteCache, createPrefetcher } from './cache';
import { TargetPlatform } from '../compiler/types';

export class VxRouter implements IRouter {
  private discovery: RouteDiscovery;
  private matcher: RouteMatcher;
  private guards: RouteGuardSystem;
  private middleware: RouteMiddlewareSystem;
  private cache: RouteCacheImpl;
  private prefetcher: IntelligentPrefetcher;
  private _routes: Route[] = [];
  private config: RouteConfig;

  constructor(config: RouteConfig = {}) {
    // Zero-config defaults (like Next.js, SvelteKit)
    this.config = {
      pagesDir: './src/pages', // Auto-discover pages
      basePath: '/',
      caseSensitive: false,
      trailingSlash: false,
      prefetch: true, // Auto-prefetch for performance
      historyMode: 'browser',
      scrollBehavior: { mode: 'auto' },
      guards: [],
      middleware: [],
      analytics: false,
      ...config
    };

    this.discovery = new RouteDiscovery(this.config);
    this.matcher = new RouteMatcher();
    this.guards = new RouteGuardSystem();
    this.middleware = new RouteMiddlewareSystem();
    this.cache = new RouteCacheImpl();
    this.prefetcher = createPrefetcher({ enabled: this.config.prefetch });

    // Register built-in guards and middleware
    if (this.config.guards) {
      this.config.guards.forEach(guard => this.guards.register(guard));
    }

    if (this.config.middleware) {
      this.config.middleware.forEach(mw => this.middleware.use(mw));
    }

    // Add analytics middleware if enabled
    if (this.config.analytics) {
      this.middleware.use(AnalyticsMiddleware);
    }

    // Always add loading middleware
    this.middleware.use(LoadingMiddleware);
  }

  /**
   * Get all discovered routes
   */
  get routes(): Route[] {
    return [...this._routes];
  }

  /**
   * Initialize router by discovering routes
   */
  async initialize(): Promise<void> {
    this._routes = await this.discovery.discoverRoutes();
    this.matcher.setRoutes(this._routes);
  }

  /**
   * Zero-config initialization (like Next.js, SvelteKit)
   * Automatically discovers routes and sets up everything
   */
  async init(): Promise<void> {
    try {
      // Auto-discover routes from ./src/pages
      await this.initialize();

      // Auto-setup client routing
      this.setupClientRouting();

      // Auto-load initial page
      await this.loadInitialPage();

      console.log(`🚀 Fluent VX ready - ${this.routes.length} routes loaded`);
    } catch (error) {
      console.error('❌ Fluent VX init failed:', error);
      throw error;
    }
  }

  /**
   * Set up client-side routing automatically
   */
  private setupClientRouting(): void {
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target?.closest('a[href]') as HTMLAnchorElement;
      if (link && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const path = link.href.replace(window.location.origin, '');
        this.navigate(path);
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.loadCurrentPage();
    });
  }

  /**
   * Load the initial page based on current URL
   */
  private async loadInitialPage(): Promise<void> {
    await this.loadCurrentPage();
  }

  /**
   * Load and render the current page
   */
  private async loadCurrentPage(): Promise<void> {
    const pathname = window.location.pathname;
    const match = await this.matchWithProcessing(pathname);

    if (match) {
      await this.renderPage(match.route.filePath);
    } else {
      this.render404Page();
    }
  }

  /**
   * Render a page by compiling its .vx file
   */
  private async renderPage(filePath: string): Promise<void> {
    try {
      // Import compiler dynamically
      const { compileSource } = await import('../compiler');

      // Read and compile the .vx file
      const fs = await import('fs');
      const source = fs.readFileSync(filePath, 'utf-8');
      const result = await compileSource(source, { target: TargetPlatform.BROWSER, dev: true });

      // Update the page content
      const pageContainer = document.getElementById('vx-page');
      if (pageContainer) {
        pageContainer.innerHTML = result.html;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      this.renderErrorPage(error);
    }
  }

  /**
   * Render 404 page
   */
  private render404Page(): void {
    const pageContainer = document.getElementById('vx-page');
    if (pageContainer) {
      pageContainer.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/" style="color: #0070f3;">Go Home</a>
        </div>
      `;
    }
  }

  /**
   * Render error page
   */
  private renderErrorPage(error: any): void {
    const pageContainer = document.getElementById('vx-page');
    if (pageContainer) {
      pageContainer.innerHTML = `
        <div style="text-align: center; padding: 4rem; color: #dc3545;">
          <h1>Error</h1>
          <p>Something went wrong loading this page.</p>
          <details style="margin-top: 2rem;">
            <summary>Error Details</summary>
            <pre style="text-align: left; background: #f8f9fa; padding: 1rem; margin-top: 1rem;">${error.message || error}</pre>
          </details>
        </div>
      `;
    }
  }

  /**
   * Match a pathname to a route (sync, basic matching)
   */
  match(pathname: string): RouteMatch | null {
    return this.matcher.match(pathname);
  }

  /**
   * Match a pathname with full processing (async, with guards/middleware)
   */
  async matchWithProcessing(pathname: string): Promise<RouteMatch | null> {
    // Check cache first
    const cacheKey = pathname;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Find route match
    const match = this.matcher.match(pathname);
    if (!match) {
      return null;
    }

    // Create route context
    const context: RouteContext = {
      pathname,
      match,
      state: history.state
    };

    // Execute guards
    const guardResult = await this.guards.execute(context);
    if (!guardResult.allowed) {
      if (guardResult.redirect) {
        await this.navigate(guardResult.redirect);
        return null;
      }
      throw new Error(`Route guard '${guardResult.guard}' blocked access`);
    }

    // Execute middleware
    const middlewareResult = await this.middleware.execute(context);
    if (!middlewareResult.success) {
      if (this.config.errorHandler) {
        this.config.errorHandler(middlewareResult.error!, context);
      }
      return null;
    }

    // Cache successful match
    this.cache.set(cacheKey, match);

    // Prefetch related routes
    this.prefetchRelatedRoutes(match);

    return match;
  }

  /**
   * Prefetch related routes for better performance
   */
  private prefetchRelatedRoutes(match: RouteMatch): void {
    if (!this.config.prefetch) return;

    // Prefetch potential next routes (e.g., common navigation patterns)
    const currentPath = match.route.path;
    const relatedPaths: string[] = [];

    // Add common related routes
    if (currentPath === '/') {
      relatedPaths.push('/about', '/contact');
    }

    // Prefetch in background
    this.prefetcher.prefetchBatch(relatedPaths).catch(console.warn);
  }

  /**
   * Resolve a route to its file path
   */
  resolve(route: Route): string {
    return route.filePath;
  }

  /**
   * Get all routes that could match a path
   */
  getRoutesForPath(path: string): Route[] {
    return this.matcher.getPotentialMatches(path);
  }

  /**
   * Navigate to a new route (client-side)
   */
  async navigate(path: string, options: NavigationOptions = {}): Promise<void> {
    const {
      replace = false,
      state,
      scroll = true
    } = options;

    // Update URL
    const url = this.buildUrl(path);
    if (replace) {
      window.history.replaceState(state, '', url);
    } else {
      window.history.pushState(state, '', url);
    }

    // Dispatch navigation event
    const event = new CustomEvent('vx:navigate', {
      detail: { path, state, replace }
    });
    window.dispatchEvent(event);

    // Handle scrolling
    if (scroll) {
      window.scrollTo(0, 0);
    }
  }

  /**
   * Go back in history
   */
  back(): void {
    window.history.back();
  }

  /**
   * Go forward in history
   */
  forward(): void {
    window.history.forward();
  }

  /**
   * Go to specific history entry
   */
  go(delta: number): void {
    window.history.go(delta);
  }

  /**
   * Get current route match (sync)
   */
  getCurrentMatch(): RouteMatch | null {
    return this.match(window.location.pathname);
  }

  /**
   * Get current route match with processing (async)
   */
  async getCurrentMatchWithProcessing(): Promise<RouteMatch | null> {
    return this.matchWithProcessing(window.location.pathname);
  }

  /**
   * Build full URL from path
   */
  private buildUrl(path: string): string {
    const baseUrl = window.location.origin + this.config.basePath;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return baseUrl + cleanPath;
  }

  /**
   * Prefetch route component (for performance)
   */
  async prefetch(path: string): Promise<void> {
    await this.prefetcher.prefetch(path);
  }

  /**
   * Warm up routes (preload critical routes)
   */
  async warmup(routes: string[]): Promise<void> {
    const promises = routes.map(route => this.prefetch(route));
    await Promise.all(promises);
  }

  /**
   * Get route metadata for SEO/analytics
   */
  getRouteMeta(path: string): RouteMeta | null {
    const match = this.match(path);
    if (!match) return null;

    return {
      path: match.route.path,
      params: match.params,
      file: match.route.filePath,
      isDynamic: match.route.isDynamic,
      priority: match.route.priority
    };
  }

  /**
   * Get route metadata with processing
   */
  async getRouteMetaWithProcessing(path: string): Promise<RouteMeta | null> {
    const match = await this.matchWithProcessing(path);
    if (!match) return null;

    return {
      path: match.route.path,
      params: match.params,
      file: match.route.filePath,
      isDynamic: match.route.isDynamic,
      priority: match.route.priority
    };
  }

  /**
   * Add a route guard
   */
  addGuard(guard: RouteGuard): void {
    this.guards.register(guard);
  }

  /**
   * Add middleware
   */
  addMiddleware(middleware: RouteMiddleware): void {
    this.middleware.use(middleware);
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      routes: this._routes.length,
      cacheSize: this.cache.size(),
      prefetchStats: this.prefetcher.getStats(),
      guards: this.guards,
      middleware: this.middleware
    };
  }

  /**
   * Validate route configuration
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate paths
    const pathMap = new Map<string, Route[]>();
    for (const route of this._routes) {
      const existing = pathMap.get(route.path) || [];
      existing.push(route);
      pathMap.set(route.path, existing);
    }

    for (const [path, routes] of pathMap.entries()) {
      if (routes.length > 1) {
        warnings.push(`Duplicate route path: ${path} (${routes.map(r => r.filePath).join(', ')})`);
      }
    }

    // Check for missing index files
    const dirsWithIndex = new Set(
      this._routes
        .filter(r => r.path.endsWith('/index') || r.path === '/')
        .map(r => r.filePath.replace(/[/\\][^/\\]+$/, ''))
    );

    // Validate parameter names
    for (const route of this._routes) {
      for (const param of route.params) {
        if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(param)) {
          errors.push(`Invalid parameter name: ${param} in ${route.filePath}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export interface NavigationOptions {
  /** Replace current history entry instead of pushing */
  replace?: boolean;
  /** State to pass to history */
  state?: any;
  /** Scroll to top after navigation */
  scroll?: boolean;
}

export interface RouteMeta {
  path: string;
  params: Record<string, string>;
  file: string;
  isDynamic: boolean;
  priority: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}