// Fluent VX Runtime - Lightweight SPA Router
// Client-side routing for single-page applications

export interface Route {
  path: string;
  component: string; // Component code or reference
  props?: Record<string, any>;
}

export class Router {
  private routes: Route[] = [];
  private currentPath: string = '/';

  constructor(routes: Route[] = []) {
    this.routes = routes;
    this.currentPath = this.getCurrentPath();

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.navigate(this.getCurrentPath(), false);
    });
  }

  /**
   * Add a route
   */
  addRoute(route: Route): void {
    this.routes.push(route);
  }

  /**
   * Navigate to a path
   */
  navigate(path: string, updateHistory: boolean = true): void {
    const route = this.findRoute(path);
    if (!route) {
      console.error(`Route not found: ${path}`);
      return;
    }

    // Update current path
    this.currentPath = path;

    // Update browser history
    if (updateHistory) {
      window.history.pushState({ path }, '', path);
    }

    // Render the component
    this.renderRoute(route, path);
  }

  /**
   * Get current path from URL
   */
  private getCurrentPath(): string {
    return window.location.pathname;
  }

  /**
   * Find matching route
   */
  private findRoute(path: string): Route | null {
    // Simple exact match - in production, use path-to-regexp for patterns
    return this.routes.find(route => route.path === path) || null;
  }

  /**
   * Render a route component
   */
  private renderRoute(route: Route, path: string): void {
    try {
      // Find the main content area
      const app = document.getElementById('app') || document.body;

      // Clear current content
      app.innerHTML = '';

      // Execute component code
      const componentFunction = new Function('props', route.component);
      const props = { ...route.props, path };

      const componentInstance = componentFunction(props);

      // Render component
      if (componentInstance && typeof componentInstance.render === 'function') {
        const element = componentInstance.render();
        app.appendChild(element);
      } else if (typeof componentInstance === 'string') {
        app.innerHTML = componentInstance;
      }

      // Dispatch route change event
      window.dispatchEvent(new CustomEvent('routechange', {
        detail: { path, route }
      }));

    } catch (error) {
      console.error(`Failed to render route ${path}:`, error);
      // Fallback to 404
      this.render404(path);
    }
  }

  /**
   * Render 404 page
   */
  private render404(path: string): void {
    const app = document.getElementById('app') || document.body;
    app.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h1>404 - Page Not Found</h1>
        <p>The page <code>${path}</code> could not be found.</p>
        <button onclick="router.navigate('/')">Go Home</button>
      </div>
    `;
  }

  /**
   * Get current route
   */
  getCurrentRoute(): Route | null {
    return this.findRoute(this.currentPath);
  }

  /**
   * Initialize router on page load
   */
  static init(routes: Route[]): Router {
    const router = new Router(routes);

    // Navigate to current path
    router.navigate(router.getCurrentPath(), false);

    // Make router globally available
    (window as any).router = router;

    return router;
  }
}

/**
 * Link component for navigation
 */
export function createLink(href: string, text: string, props: Record<string, any> = {}): HTMLElement {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  link.style.textDecoration = 'none';
  link.style.color = '#0070f3';

  // Apply additional props
  Object.assign(link, props);

  // Handle click
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const router = (window as any).router;
    if (router) {
      router.navigate(href);
    }
  });

  return link;
}