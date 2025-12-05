/**
 * Fluent VX Router - File-System Routing Types
 * Professional routing system with automatic route discovery
 */

export interface RouteConfig {
  /** Base directory for pages (default: './src/pages') */
  pagesDir?: string;
  /** Base path for routing (default: '/') */
  basePath?: string;
  /** Case sensitive routing (default: false) */
  caseSensitive?: boolean;
  /** Enable trailing slash (default: false) */
  trailingSlash?: boolean;
  /** Enable route prefetching (default: true) */
  prefetch?: boolean;
  /** History mode: 'browser' | 'hash' | 'memory' */
  historyMode?: 'browser' | 'hash' | 'memory';
  /** Scroll behavior configuration */
  scrollBehavior?: ScrollBehavior;
  /** Route guards */
  guards?: RouteGuard[];
  /** Middleware functions */
  middleware?: RouteMiddleware[];
  /** Error handler for route errors */
  errorHandler?: RouteErrorHandler;
  /** Loading component */
  loadingComponent?: string;
  /** Enable route analytics */
  analytics?: boolean;
}

export interface Route {
  /** Route path pattern (e.g., '/users/:id') */
  path: string;
  /** File path to the .vx component */
  filePath: string;
  /** Route parameters names */
  params: string[];
  /** Whether route has dynamic segments */
  isDynamic: boolean;
  /** Whether route has catch-all segments */
  isCatchAll: boolean;
  /** Route priority for matching (higher = more specific) */
  priority: number;
  /** Parent layout routes */
  layouts: string[];
}

export interface RouteMatch {
  /** Matched route */
  route: Route;
  /** Extracted parameters */
  params: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Route segments */
  segments: string[];
}

export interface RouteContext {
  /** Current pathname */
  pathname: string;
  /** Route match result */
  match: RouteMatch | null;
  /** Navigation state */
  state?: any;
}

export interface Router {
  /** All discovered routes */
  routes: Route[];
  /** Match a pathname to a route */
  match(pathname: string): RouteMatch | null;
  /** Resolve a route to its file path */
  resolve(route: Route): string;
  /** Get all routes for a given path */
  getRoutesForPath(path: string): Route[];
}

export type RouteSegment =
  | StaticSegment
  | DynamicSegment
  | CatchAllSegment;

export interface StaticSegment {
  type: 'static';
  value: string;
}

export interface DynamicSegment {
  type: 'dynamic';
  name: string;
  optional?: boolean;
}

export interface CatchAllSegment {
  type: 'catch-all';
  name: string;
}

export interface RouteTree {
  /** Root routes (no parent) */
  root: RouteNode[];
  /** All routes flattened */
  all: Route[];
  /** Routes by path for fast lookup */
  byPath: Map<string, Route>;
}

export interface RouteNode {
  route: Route;
  children: RouteNode[];
  parent?: RouteNode;
  /** Nesting level */
  level: number;
}

// Advanced routing features
export interface RouteGuard {
  name: string;
  condition: (context: RouteContext) => boolean | Promise<boolean>;
  redirect?: string;
  priority?: number;
}

export interface RouteMiddleware {
  name: string;
  handler: (context: RouteContext, next: () => void | Promise<void>) => void | Promise<void>;
  priority?: number;
}

export type RouteErrorHandler = (error: RouteError, context: RouteContext) => void;

export interface RouteError {
  type: 'navigation' | 'loading' | 'guard' | 'middleware';
  message: string;
  originalError?: Error;
  route?: Route;
}

export interface ScrollBehavior {
  mode?: 'auto' | 'smooth';
  offset?: { x?: number; y?: number };
  selector?: string;
}

export interface RouteAnalytics {
  pageview: (path: string, params: Record<string, string>) => void;
  event: (name: string, data: any) => void;
}

export interface RouteCache {
  get: (key: string) => RouteMatch | null;
  set: (key: string, match: RouteMatch, ttl?: number) => void;
  clear: () => void;
  size: () => number;
}

export interface PrefetchStrategy {
  enabled: boolean;
  onHover?: boolean;
  onFocus?: boolean;
  timeout?: number;
  concurrency?: number;
}