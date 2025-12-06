/**
 * Automatic Manifest Generation for Fluent VX
 * Generates internal and external manifests for development and production
 */

import * as fs from 'fs';
import * as path from 'path';
import { ModuleInfo } from '../hmr/cache';

export interface DevManifest {
  version: string;
  timestamp: number;
  pages: PageInfo[];
  layouts: LayoutInfo[];
  components: ComponentInfo[];
  routes: RouteInfo[];
  dependencies: DependencyGraph;
  buildInfo: BuildInfo;
}

export interface PageInfo {
  id: string;
  filePath: string;
  route: string;
  hasData: boolean;
  hasLoad: boolean;
  prerender: boolean;
}

export interface LayoutInfo {
  id: string;
  filePath: string;
  appliesTo: string[];
}

export interface ComponentInfo {
  id: string;
  filePath: string;
  dependencies: string[];
}

export interface RouteInfo {
  path: string;
  page: string;
  layout?: string;
  data?: string;
}

export interface DependencyGraph {
  [moduleId: string]: {
    dependencies: string[];
    importers: string[];
    lastModified: number;
  };
}

export interface BuildInfo {
  chunks: ChunkInfo[];
  assets: AssetInfo[];
  optimization: OptimizationInfo;
}

export interface ChunkInfo {
  id: string;
  modules: string[];
  size: number;
  hash: string;
}

export interface AssetInfo {
  name: string;
  size: number;
  hash: string;
  type: 'js' | 'css' | 'asset';
}

export interface OptimizationInfo {
  minified: boolean;
  compressed: boolean;
  treeShaken: boolean;
}

/**
 * Manifest Generator
 */
export class ManifestGenerator {
  private projectRoot: string;
  private manifestPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.manifestPath = path.join(projectRoot, '.framework', 'manifest.json');
  }

  /**
   * Generate development manifest
   */
  generateDevManifest(moduleGraph: Map<string, ModuleInfo>): DevManifest {
    const pages = this.discoverPages();
    const layouts = this.discoverLayouts();
    const components = this.discoverComponents(moduleGraph);
    const routes = this.generateRoutes(pages, layouts);
    const dependencies = this.buildDependencyGraph(moduleGraph);

    const manifest: DevManifest = {
      version: '1.0.0',
      timestamp: Date.now(),
      pages,
      layouts,
      components,
      routes,
      dependencies,
      buildInfo: this.generateBuildInfo()
    };

    this.saveManifest(manifest);
    return manifest;
  }

  /**
   * Discover pages from file system
   */
  private discoverPages(): PageInfo[] {
    const pagesDir = path.join(this.projectRoot, 'src', 'pages');
    const pages: PageInfo[] = [];

    if (!fs.existsSync(pagesDir)) return pages;

    const scanDir = (dir: string, routePrefix = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scanDir(fullPath, routePrefix + '/' + entry.name);
        } else if (entry.name.endsWith('.vx')) {
          const route = this.fileToRoute(fullPath, pagesDir);
          const content = fs.readFileSync(fullPath, 'utf-8');

          pages.push({
            id: route,
            filePath: fullPath,
            route,
            hasData: content.includes('#data'),
            hasLoad: content.includes('#load'),
            prerender: content.includes('prerender: true')
          });
        }
      }
    };

    scanDir(pagesDir);
    return pages;
  }

  /**
   * Discover layouts
   */
  private discoverLayouts(): LayoutInfo[] {
    const appFile = path.join(this.projectRoot, 'src', 'app.vx');

    if (!fs.existsSync(appFile)) return [];

    return [{
      id: 'app',
      filePath: appFile,
      appliesTo: ['*'] // Applies to all routes
    }];
  }

  /**
   * Discover components from module graph
   */
  private discoverComponents(moduleGraph: Map<string, ModuleInfo>): ComponentInfo[] {
    const components: ComponentInfo[] = [];

    for (const [moduleId, info] of moduleGraph) {
      if (info.type === 'component') {
        components.push({
          id: moduleId,
          filePath: info.filePath,
          dependencies: info.dependencies
        });
      }
    }

    return components;
  }

  /**
   * Generate route configuration
   */
  private generateRoutes(pages: PageInfo[], layouts: LayoutInfo[]): RouteInfo[] {
    return pages.map(page => ({
      path: page.route,
      page: page.id,
      layout: layouts.length > 0 ? 'app' : undefined,
      data: page.hasData ? `${page.id}:data` : undefined
    }));
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(moduleGraph: Map<string, ModuleInfo>): DependencyGraph {
    const graph: DependencyGraph = {};

    for (const [moduleId, info] of moduleGraph) {
      graph[moduleId] = {
        dependencies: info.dependencies,
        importers: info.importers,
        lastModified: info.lastModified
      };
    }

    return graph;
  }

  /**
   * Generate build info (placeholder for now)
   */
  private generateBuildInfo(): BuildInfo {
    return {
      chunks: [],
      assets: [],
      optimization: {
        minified: false,
        compressed: false,
        treeShaken: false
      }
    };
  }

  /**
   * Convert file path to route
   */
  private fileToRoute(filePath: string, baseDir: string): string {
    const relativePath = path.relative(baseDir, filePath);
    const route = '/' + relativePath.replace(/\.vx$/, '').replace(/\/index$/, '');

    return route === '/' ? '/' : route;
  }

  /**
   * Save manifest to disk
   */
  private saveManifest(manifest: DevManifest): void {
    const manifestDir = path.dirname(this.manifestPath);

    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }

    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Load manifest from disk
   */
  loadManifest(): DevManifest | null {
    if (!fs.existsSync(this.manifestPath)) return null;

    try {
      return JSON.parse(fs.readFileSync(this.manifestPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  /**
   * Check if manifest needs update
   */
  needsUpdate(): boolean {
    const manifest = this.loadManifest();
    if (!manifest) return true;

    // Check if any source files changed since manifest generation
    const checkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return false;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (checkDir(fullPath)) return true;
        } else if (entry.name.endsWith('.vx')) {
          const stat = fs.statSync(fullPath);
          if (stat.mtime.getTime() > manifest.timestamp) {
            return true;
          }
        }
      }

      return false;
    };

    return checkDir(path.join(this.projectRoot, 'src'));
  }
}