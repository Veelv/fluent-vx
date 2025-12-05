/**
 * Fluent VX Router - Main Exports
 * Enterprise-grade file-system routing system
 */

export { VxRouter } from './router';
export { RouteDiscovery } from './route-discovery';
export { RouteMatcher } from './route-matcher';
export { RouteGuardSystem, RouteMiddlewareSystem, AuthGuard, RoleGuard, AnalyticsMiddleware, LoadingMiddleware } from './guards';
export { RouteCacheImpl, IntelligentPrefetcher, createRouteCache, createPrefetcher } from './cache';
export * from './types';