/**
 * Fluent VX Router - Route Guards & Middleware
 * Professional authorization and navigation control system
 */

import { RouteContext, RouteGuard, RouteMiddleware, RouteError } from './types';

export class RouteGuardSystem {
  private guards: RouteGuard[] = [];

  /**
   * Register a route guard
   */
  register(guard: RouteGuard): void {
    this.guards.push(guard);
    this.guards.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Unregister a guard by name
   */
  unregister(name: string): void {
    this.guards = this.guards.filter(g => g.name !== name);
  }

  /**
   * Execute all guards for a route context
   */
  async execute(context: RouteContext): Promise<RouteGuardResult> {
    for (const guard of this.guards) {
      try {
        const result = await guard.condition(context);

        if (!result) {
          return {
            allowed: false,
            redirect: guard.redirect,
            guard: guard.name
          };
        }
      } catch (error) {
        return {
          allowed: false,
          error: {
            type: 'guard',
            message: `Guard '${guard.name}' failed`,
            originalError: error as Error
          }
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Clear all guards
   */
  clear(): void {
    this.guards = [];
  }
}

export class RouteMiddlewareSystem {
  private middleware: RouteMiddleware[] = [];

  /**
   * Register middleware
   */
  use(middleware: RouteMiddleware): void {
    this.middleware.push(middleware);
    this.middleware.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Remove middleware by name
   */
  remove(name: string): void {
    this.middleware = this.middleware.filter(m => m.name !== name);
  }

  /**
   * Execute middleware chain
   */
  async execute(context: RouteContext): Promise<RouteMiddlewareResult> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middleware.length) {
        const current = this.middleware[index++];
        try {
          await current.handler(context, next);
        } catch (error) {
          throw {
            type: 'middleware' as const,
            message: `Middleware '${current.name}' failed`,
            originalError: error as Error
          };
        }
      }
    };

    try {
      await next();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error as RouteError
      };
    }
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.middleware = [];
  }
}

// Built-in guards
export const AuthGuard: RouteGuard = {
  name: 'auth',
  condition: (context: RouteContext) => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    return !!token;
  },
  redirect: '/login',
  priority: 100
};

export const RoleGuard = (requiredRoles: string[]): RouteGuard => ({
  name: 'role',
  condition: (context: RouteContext) => {
    const userRoles = JSON.parse(localStorage.getItem('user_roles') || '[]');
    return requiredRoles.some(role => userRoles.includes(role));
  },
  redirect: '/unauthorized',
  priority: 90
});

// Built-in middleware
export const AnalyticsMiddleware: RouteMiddleware = {
  name: 'analytics',
  handler: async (context, next) => {
    const startTime = Date.now();

    // Track page view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_TRACKING_ID', {
        page_path: context.pathname
      });
    }

    await next();

    const duration = Date.now() - startTime;
    console.log(`[Analytics] ${context.pathname} took ${duration}ms`);
  },
  priority: 10
};

export const LoadingMiddleware: RouteMiddleware = {
  name: 'loading',
  handler: async (context, next) => {
    // Show loading indicator
    const loadingElement = document.getElementById('route-loading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
    }

    try {
      await next();
    } finally {
      // Hide loading indicator
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
    }
  },
  priority: 20
};

export interface RouteGuardResult {
  allowed: boolean;
  redirect?: string;
  guard?: string;
  error?: RouteError;
}

export interface RouteMiddlewareResult {
  success: boolean;
  error?: RouteError;
}