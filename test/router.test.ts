import { RouteMatcher } from '../src/router/route-matcher';
import { Route } from '../src/router/types';

describe('RouteMatcher', () => {
  let matcher: RouteMatcher;

  beforeEach(() => {
    matcher = new RouteMatcher();
  });

  it('should match exact routes', () => {
    const routes: Route[] = [
      {
        path: '/',
        filePath: 'index.vx',
        params: [],
        isDynamic: false,
        isCatchAll: false,
        priority: 100,
        layouts: []
      }
    ];

    matcher.setRoutes(routes);
    const match = matcher.match('/');

    expect(match).toBeDefined();
    expect(match?.route.path).toBe('/');
  });

  it('should extract dynamic parameters', () => {
    const routes: Route[] = [
      {
        path: '/users/:id',
        filePath: '[id].vx',
        params: ['id'],
        isDynamic: true,
        isCatchAll: false,
        priority: 90,
        layouts: []
      }
    ];

    matcher.setRoutes(routes);
    const match = matcher.match('/users/123');

    expect(match).toBeDefined();
    expect(match?.params.id).toBe('123');
  });

  it('should handle catch-all routes', () => {
    const routes: Route[] = [
      {
        path: '/blog/*slug',
        filePath: '[...slug].vx',
        params: ['slug'],
        isDynamic: false,
        isCatchAll: true,
        priority: 80,
        layouts: []
      }
    ];

    matcher.setRoutes(routes);
    const match = matcher.match('/blog/2024/my-post');

    expect(match).toBeDefined();
    expect(match?.params.slug).toBe('2024/my-post');
  });

  it('should return null for unmatched routes', () => {
    const routes: Route[] = [
      {
        path: '/home',
        filePath: 'index.vx',
        params: [],
        isDynamic: false,
        isCatchAll: false,
        priority: 100,
        layouts: []
      }
    ];

    matcher.setRoutes(routes);
    const match = matcher.match('/nonexistent');

    expect(match).toBeNull();
  });
});