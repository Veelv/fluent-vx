/**
 * Fluent VX Configuration System
 * Loads and validates fluent-vx.config.ts
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PWAConfig {
  enabled: boolean;
  name?: string;
  shortName?: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  startUrl?: string;
  scope?: string;
  icons?: PWAIcon[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface BuildConfig {
  outDir?: string;
  minify?: boolean;
  sourcemap?: boolean;
  target?: 'es2015' | 'es2017' | 'es2018' | 'es2019' | 'es2020';
  cssCodeSplit?: boolean;
  rollupOptions?: any;
}

export interface ServerConfig {
  host?: string;
  open?: boolean;
  https?: boolean;
  cors?: boolean;
  hmr?: boolean;
}

export interface FluentVXConfig {
  pwa?: PWAConfig;
  build?: BuildConfig;
  server?: ServerConfig;
  base?: string;
  integrations?: any[];
  [key: string]: any;
}

const DEFAULT_CONFIG: FluentVXConfig = {
  pwa: {
    enabled: false
  },
  build: {
    outDir: './.vx/.dist',
    minify: true,
    sourcemap: false,
    target: 'es2018',
    cssCodeSplit: true
  },
  server: {
    host: '127.0.0.1',
    open: true,
    https: false,
    cors: true,
    hmr: true
  },
  base: '/',
  integrations: []
};

export class ConfigLoader {
  private projectRoot: string;
  private configPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, 'fluent-vx.config.ts');
  }

  /**
   * Load configuration from fluent-vx.config.ts
   */
  async load(): Promise<FluentVXConfig> {
    if (!fs.existsSync(this.configPath)) {
      console.log('⚠️  No fluent-vx.config.ts found, using defaults');
      return DEFAULT_CONFIG;
    }

    try {
      // Dynamic import of the config file
      const configModule = await import(this.configPath);
      const userConfig = configModule.default || configModule;

      // Merge with defaults
      const config = this.deepMerge(DEFAULT_CONFIG, userConfig);

      // Validate configuration
      this.validateConfig(config);

      console.log('✅ Configuration loaded from fluent-vx.config.ts');
      return config;

    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      console.log('⚠️  Using default configuration');
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Check if PWA is enabled
   */
  isPWAEnabled(config: FluentVXConfig): boolean {
    return config.pwa?.enabled === true;
  }

  /**
   * Get PWA configuration with defaults
   */
  getPWAConfig(config: FluentVXConfig): Required<PWAConfig> {
    const pwa = config.pwa || {};

    return {
      enabled: (pwa as any).enabled || false,
      name: (pwa as any).name || 'Fluent VX App',
      shortName: (pwa as any).shortName || (pwa as any).name || 'Fluent VX',
      description: (pwa as any).description || 'A Fluent VX application',
      themeColor: (pwa as any).themeColor || '#0070f3',
      backgroundColor: (pwa as any).backgroundColor || '#ffffff',
      display: (pwa as any).display || 'standalone',
      startUrl: (pwa as any).startUrl || '/',
      scope: (pwa as any).scope || '/',
      icons: (pwa as any).icons || this.getDefaultIcons()
    };
  }

  private getDefaultIcons(): PWAIcon[] {
    return [
      {
        src: '/assets/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/assets/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ];
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private validateConfig(config: FluentVXConfig): void {
    // Validate PWA config
    if (config.pwa?.enabled) {
      if (!config.pwa.name && !config.pwa.shortName) {
        console.warn('⚠️  PWA enabled but no name/shortName specified');
      }
    }

    // Validate build config
    if (config.build?.outDir && !config.build.outDir.startsWith('./')) {
      console.warn('⚠️  outDir should be relative (start with ./)');
    }

    // Server config validation (port is handled by port finder)
  }
}

export async function loadConfig(projectRoot: string = process.cwd()): Promise<FluentVXConfig> {
  const loader = new ConfigLoader(projectRoot);
  return loader.load();
}

export function isPWAEnabled(config: FluentVXConfig): boolean {
  const loader = new ConfigLoader(process.cwd());
  return loader.isPWAEnabled(config);
}

export function getPWAConfig(config: FluentVXConfig): Required<PWAConfig> {
  const loader = new ConfigLoader(process.cwd());
  return loader.getPWAConfig(config);
}