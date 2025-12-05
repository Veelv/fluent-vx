// Fluent VX Compiler
// Professional compilation pipeline with strategy selection, optimization, and code generation

import { AST } from '../parser/ast';
import { selectRenderingStrategy } from './strategy-selector';
import { generateCode } from './code-generator';
import { optimize } from './optimizer';
import { analyze } from './analyzer';
import {
  CompilationOptions,
  CompilationResult,
  CompilationContext,
  TargetPlatform,
  RenderingStrategy,
  CompilerPlugin
} from './types';

/**
 * Main Fluent VX Compiler class
 * Orchestrates the entire compilation pipeline
 */
export class Compiler {
  private plugins: CompilerPlugin[] = [];
  private defaultOptions: CompilationOptions = {
    target: TargetPlatform.BROWSER, // Auto-detect target
    minify: false, // Auto-minify in production
    sourceMap: false, // Auto-enable in dev
    dev: false, // Auto-detect environment
    analyze: false // Auto-analyze for optimization
  };

  /**
   * Compiles a .vx AST into optimized web assets
   */
  async compile(ast: AST, options: Partial<CompilationOptions> = {}): Promise<CompilationResult> {
    const startTime = Date.now();
    const finalOptions = { ...this.defaultOptions, ...options };

    // Initialize compilation context
    const context: CompilationContext = {
      ast,
      options: finalOptions,
      features: {
        reactive: false,
        events: false,
        serverActions: false,
        dynamicImports: false,
        animations: false,
        forms: false
      },
      assets: new Map(),
      dependencies: new Set(),
      warnings: []
    };

    try {
      // Pre-compilation hooks
      for (const plugin of this.plugins) {
        if (plugin.preCompile) {
          await plugin.preCompile(context);
        }
      }

      // Select rendering strategy
      const strategy = selectRenderingStrategy(ast, context);
      context.options.strategy = strategy;

      // Generate strategy-specific output with analysis
      const result = await analyze(context);

      // Post-compilation hooks
      for (const plugin of this.plugins) {
        if (plugin.postCompile) {
          await plugin.postCompile(result);
        }
      }

      return result;

    } catch (error) {
      throw new Error(`Compilation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Adds a compiler plugin
   */
  use(plugin: CompilerPlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Estimates performance metrics for compilation context
   */
  private estimatePerformance(context: CompilationContext) {
    const bundleSize = this.estimateBundleSize(context);

    return {
      lcp: context.features.animations ? 2500 : 1500,
      fcp: context.features.forms ? 1200 : 800,
      tti: context.features.events ? 2000 : 1000,
      bundleSize
    };
  }

  /**
   * Estimates bundle size in KB
   */
  private estimateBundleSize(context: CompilationContext): number {
    let size = 0;

    // Base HTML size
    const html = context.assets.get('html') || '';
    size += html.length * 0.5; // Rough compression estimate

    // CSS size
    const css = context.assets.get('css') || '';
    size += css.length;

    // JS size
    const js = context.assets.get('js') || '';
    size += js.length;

    // Convert to KB
    return Math.round(size / 1024);
  }

  /**
   * Gets compiler information
   */
  getInfo() {
    return {
      name: 'Fluent VX Compiler',
      version: '0.1.0',
      plugins: this.plugins.length,
      supportedTargets: Object.values(TargetPlatform),
      supportedStrategies: Object.values(RenderingStrategy)
    };
  }
}

/**
 * Convenience function for one-off compilation
 */
export async function compile(
  ast: AST,
  options: Partial<CompilationOptions> = {}
): Promise<CompilationResult> {
  const compiler = new Compiler();
  return compiler.compile(ast, options);
}

/**
 * Zero-config compilation (like Svelte, Astro)
 * Automatically detects environment and optimizes
 */
export async function compileSource(
  source: string,
  options: Partial<CompilationOptions> = {}
): Promise<CompilationResult> {
  // Auto-detect environment
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  const isBrowser = typeof window !== 'undefined';

  // Zero-config defaults
  const defaultOptions: CompilationOptions = {
    target: isBrowser ? TargetPlatform.BROWSER : TargetPlatform.STATIC,
    dev: isDev,
    minify: !isDev,
    sourceMap: isDev,
    ...options
  };

  // Import parser dynamically to avoid circular dependencies
  const { parseVx } = await import('../parser');

  const ast = parseVx(source);
  return compile(ast, defaultOptions);
}

// Export types for external use
export type {
  CompilationOptions,
  CompilationResult,
  CompilationContext,
  CompilerPlugin,
  RenderingStrategy,
  TargetPlatform
} from './types';

// Export utilities
export { selectRenderingStrategy } from './strategy-selector';
export { generateCode } from './code-generator';
export { optimize, createOptimizationPass } from './optimizer';