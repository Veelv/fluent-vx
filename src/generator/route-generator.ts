// Fluent VX Route Generator
// Generates runtime route code from discovered routes

import { Route } from '../router/types';

export interface RouteGenerationOptions {
  /** Output format: 'esm' | 'cjs' | 'iife' */
  format?: 'esm' | 'cjs' | 'iife';
  /** Include source maps */
  sourcemap?: boolean;
  /** Minify output */
  minify?: boolean;
  /** Add route metadata */
  metadata?: boolean;
}

export class RouteGenerator {
  private options: Required<RouteGenerationOptions>;

  constructor(options: RouteGenerationOptions = {}) {
    this.options = {
      format: 'esm',
      sourcemap: false,
      minify: false,
      metadata: true,
      ...options
    };
  }

  /**
   * Generate route code from discovered routes
   */
  generate(routes: Route[]): string {
    const routeMap = this.createRouteMap(routes);
    const routeArray = this.createRouteArray(routes);

    let code = '';

    // Generate imports
    if (this.options.format === 'esm') {
      code += this.generateESMImports();
    } else if (this.options.format === 'cjs') {
      code += this.generateCJSImports();
    }

    // Generate route data
    code += '\n// Generated route configuration\n';
    code += `export const routes = ${JSON.stringify(routeArray, null, 2)};\n\n`;

    // Generate route map for fast lookup
    code += `export const routeMap = ${JSON.stringify(routeMap, null, 2)};\n\n`;

    // Generate route matching function
    code += this.generateRouteMatcher();

    // Generate utility functions
    code += this.generateUtilities();

    // Generate exports
    if (this.options.format === 'esm') {
      code += this.generateESMExports();
    } else if (this.options.format === 'cjs') {
      code += this.generateCJSExports();
    } else if (this.options.format === 'iife') {
      code += this.generateIIFE(routes);
    }

    // Add metadata if requested
    if (this.options.metadata) {
      code += this.generateMetadata(routes);
    }

    return this.options.minify ? this.minifyCode(code) : code;
  }

  /**
   * Create route map for fast path lookup
   */
  private createRouteMap(routes: Route[]): Record<string, Route> {
    const map: Record<string, Route> = {};
    for (const route of routes) {
      map[route.path] = route;
    }
    return map;
  }

  /**
   * Create route array with processed data
   */
  private createRouteArray(routes: Route[]): any[] {
    return routes.map(route => ({
      path: route.path,
      filePath: route.filePath,
      params: route.params,
      isDynamic: route.isDynamic,
      isCatchAll: route.isCatchAll,
      priority: route.priority,
      layouts: route.layouts
    }));
  }

  /**
   * Generate ESM imports
   */
  private generateESMImports(): string {
    return `// Fluent VX Generated Routes
import { RouteMatcher } from './route-matcher';
`;
  }

  /**
   * Generate CommonJS imports
   */
  private generateCJSImports(): string {
    return `// Fluent VX Generated Routes
const { RouteMatcher } = require('./route-matcher');
`;
  }

  /**
   * Generate route matching function
   */
  private generateRouteMatcher(): string {
    return `
// Route matching functionality
export class GeneratedRouteMatcher extends RouteMatcher {
  constructor() {
    super(routes);
  }

  match(pathname) {
    return super.match(pathname);
  }

  resolve(route) {
    return super.resolve(route);
  }
}

export const routeMatcher = new GeneratedRouteMatcher();
`;
  }

  /**
   * Generate utility functions
   */
  private generateUtilities(): string {
    return `
// Utility functions
export function getRouteByPath(path) {
  return routeMap[path] || null;
}

export function getAllRoutes() {
  return [...routes];
}

export function getDynamicRoutes() {
  return routes.filter(route => route.isDynamic);
}

export function getStaticRoutes() {
  return routes.filter(route => !route.isDynamic);
}

export function findRouteByFile(filePath) {
  return routes.find(route => route.filePath === filePath) || null;
}
`;
  }

  /**
   * Generate ESM exports
   */
  private generateESMExports(): string {
    return `
// Default export
export default {
  routes,
  routeMap,
  routeMatcher,
  getRouteByPath,
  getAllRoutes,
  getDynamicRoutes,
  getStaticRoutes,
  findRouteByFile
};
`;
  }

  /**
   * Generate CommonJS exports
   */
  private generateCJSExports(): string {
    return `
// CommonJS exports
module.exports = {
  routes,
  routeMap,
  routeMatcher,
  getRouteByPath,
  getAllRoutes,
  getDynamicRoutes,
  getStaticRoutes,
  findRouteByFile
};
`;
  }

  /**
   * Generate IIFE wrapper
   */
  private generateIIFE(routes: Route[]): string {
    const routeCount = routes.length;
    const dynamicCount = routes.filter(r => r.isDynamic).length;

    return `
// IIFE wrapper for browser usage
(function() {
  const FluentVXRoutes = {
    routes,
    routeMap,
    routeMatcher,
    getRouteByPath,
    getAllRoutes,
    getDynamicRoutes,
    getStaticRoutes,
    findRouteByFile,
    _metadata: {
      totalRoutes: ${routeCount},
      dynamicRoutes: ${dynamicCount},
      staticRoutes: ${routeCount - dynamicCount},
      generatedAt: '${new Date().toISOString()}'
    }
  };

  // Attach to global scope
  if (typeof window !== 'undefined') {
    window.FluentVXRoutes = FluentVXRoutes;
  }

  return FluentVXRoutes;
})();
`;
  }

  /**
   * Generate metadata comments
   */
  private generateMetadata(routes: Route[]): string {
    const routeCount = routes.length;
    const dynamicCount = routes.filter(r => r.isDynamic).length;
    const staticCount = routeCount - dynamicCount;

    return `
// Route Generation Metadata
// Total Routes: ${routeCount}
// Static Routes: ${staticCount}
// Dynamic Routes: ${dynamicCount}
// Generated: ${new Date().toISOString()}
// Format: ${this.options.format}
// Minified: ${this.options.minify}
`;
  }

  /**
   * Basic code minification (remove extra whitespace)
   */
  private minifyCode(code: string): string {
    return code
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/^\s+|\s+$/gm, '') // Trim lines
      .replace(/\n+/g, '\n'); // Single newlines
  }
}

/**
 * Generate routes for a specific build
 */
export async function generateRoutes(routes: Route[], options?: RouteGenerationOptions): Promise<string> {
  const generator = new RouteGenerator(options);
  return generator.generate(routes);
}

/**
 * Generate routes file at specified path
 */
export async function generateRoutesFile(routes: Route[], outputPath: string, options?: RouteGenerationOptions): Promise<string> {
  const code = await generateRoutes(routes, options);

  // Write to file (in real implementation, use fs)
  console.log(`Generated routes file: ${outputPath}`);
  console.log(`Routes generated: ${routes.length}`);
  console.log(`Code length: ${code.length} characters`);

  // For now, just log the code
  console.log('\nGenerated Code:');
  console.log('='.repeat(50));
  console.log(code);
  console.log('='.repeat(50));

  return code;
}