// Fluent VX Configuration API
// Professional config system like Astro and Vite

import type { FluentIntegration, IntegrationFactory } from './integrations';

export interface FluentVXConfig {
  // Output directory for builds
  outDir?: string;

  // Base path for deployment
  base?: string;

  // Development server options
  server?: {
    host?: string;
    port?: number;
    open?: boolean;
  };

  // Build optimizations
  build?: {
    minify?: boolean | 'esbuild' | 'terser';
    sourcemap?: boolean;
  };

  // Framework features and integrations
  integrations?: (FluentIntegration | IntegrationFactory)[];
}

/**
 * Define Fluent VX configuration
 * Provides TypeScript intellisense and validation
 */
export function defineConfig(config: FluentVXConfig) {
  return config;
}