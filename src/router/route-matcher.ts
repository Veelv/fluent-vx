/**
 * Fluent VX Router - Route Matcher
 * High-performance route matching with parameter extraction
 */

import { Route, RouteMatch, RouteSegment } from './types';

export class RouteMatcher {
  private routes: Route[] = [];

  /**
   * Set routes for matching
   */
  setRoutes(routes: Route[]): void {
    this.routes = routes;
  }

  /**
   * Match a pathname against available routes
   */
  match(pathname: string): RouteMatch | null {
    // Normalize pathname
    const normalizedPath = this.normalizePath(pathname);

    for (const route of this.routes) {
      const match = this.matchRoute(route, normalizedPath);
      if (match) {
        return match;
      }
    }

    return null;
  }

  /**
   * Match a specific route against a pathname
   */
  private matchRoute(route: Route, pathname: string): RouteMatch | null {
    const routeSegments = this.parseRouteSegments(route.path);
    const pathSegments = pathname.split('/').filter(Boolean);

    // Handle root path
    if (route.path === '/' && pathname === '/') {
      return {
        route,
        params: {},
        query: {},
        segments: []
      };
    }

    // Check segment count for non-catch-all routes
    if (!route.isCatchAll && routeSegments.length !== pathSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};
    let routeIndex = 0;
    let pathIndex = 0;

    while (routeIndex < routeSegments.length && pathIndex < pathSegments.length) {
      const routeSegment = routeSegments[routeIndex];
      const pathSegment = pathSegments[pathIndex];

      if (routeSegment.type === 'static') {
        if (routeSegment.value !== pathSegment) {
          return null; // Static segment mismatch
        }
        routeIndex++;
        pathIndex++;
      } else if (routeSegment.type === 'dynamic') {
        params[routeSegment.name] = pathSegment;
        routeIndex++;
        pathIndex++;
      } else if (routeSegment.type === 'catch-all') {
        // Catch-all consumes all remaining path segments
        const remainingSegments = pathSegments.slice(pathIndex);
        params[routeSegment.name] = remainingSegments.join('/');
        routeIndex++;
        pathIndex = pathSegments.length;
      }
    }

    // Ensure all route segments were matched (unless catch-all)
    if (routeIndex < routeSegments.length && !route.isCatchAll) {
      return null;
    }

    // For catch-all routes, remaining path segments go to the catch-all param
    if (route.isCatchAll && routeIndex < routeSegments.length) {
      const catchAllSegment = routeSegments[routeIndex];
      if (catchAllSegment.type === 'catch-all') {
        const remainingSegments = pathSegments.slice(pathIndex);
        params[catchAllSegment.name] = remainingSegments.join('/');
      }
    }

    return {
      route,
      params,
      query: {}, // Query parsing handled separately
      segments: pathSegments
    };
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

  /**
   * Normalize pathname for matching
   */
  private normalizePath(pathname: string): string {
    // Remove query string
    const path = pathname.split('?')[0];

    // Remove trailing slash unless root
    if (path !== '/' && path.endsWith('/')) {
      return path.slice(0, -1);
    }

    return path;
  }

  /**
   * Extract query parameters from URL
   */
  extractQuery(pathname: string): Record<string, string> {
    const query: Record<string, string> = {};
    const queryString = pathname.split('?')[1];

    if (!queryString) {
      return query;
    }

    const params = new URLSearchParams(queryString);
    for (const [key, value] of params.entries()) {
      query[key] = value;
    }

    return query;
  }

  /**
   * Get all routes that could potentially match a path
   */
  getPotentialMatches(pathname: string): Route[] {
    const normalizedPath = this.normalizePath(pathname);
    return this.routes.filter(route => this.couldMatch(route, normalizedPath));
  }

  /**
   * Check if a route could potentially match a path
   */
  private couldMatch(route: Route, pathname: string): boolean {
    const routeSegments = this.parseRouteSegments(route.path);
    const pathSegments = pathname.split('/').filter(Boolean);

    if (route.path === '/' && pathname === '/') {
      return true;
    }

    if (route.isCatchAll) {
      return routeSegments.length <= pathSegments.length + 1; // +1 for catch-all
    }

    if (routeSegments.length !== pathSegments.length) {
      return false;
    }

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const pathSegment = pathSegments[i];

      if (routeSegment.type === 'static' && routeSegment.value !== pathSegment) {
        return false;
      }
    }

    return true;
  }
}