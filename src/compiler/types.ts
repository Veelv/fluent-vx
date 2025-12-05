// Fluent VX Compiler Types
// Advanced type definitions for compilation pipeline

import { AST } from '../parser/ast';

/**
 * Compilation target platforms
 */
export enum TargetPlatform {
  BROWSER = 'browser',
  NODE = 'node',
  STATIC = 'static'
}

/**
 * Rendering strategies
 */
export enum RenderingStrategy {
  STATIC = 'static',           // Pure static HTML
  HYDRATE = 'hydrate',         // Client-side hydration
  STREAM = 'stream',           // Server-side streaming
  ISLANDS = 'islands',         // Selective hydration
  SPA = 'spa'                  // Single-page application
}

/**
 * Compilation options
 */
export interface CompilationOptions {
  /** Target platform */
  target: TargetPlatform;
  /** Preferred rendering strategy */
  strategy?: RenderingStrategy;
  /** Enable minification */
  minify?: boolean;
  /** Enable source maps */
  sourceMap?: boolean;
  /** Output directory */
  outDir?: string;
  /** Development mode */
  dev?: boolean;
  /** Bundle analysis */
  analyze?: boolean;
}

/**
 * Compilation result
 */
export interface CompilationResult {
  /** Generated HTML */
  html: string;
  /** Generated CSS */
  css: string;
  /** Generated JavaScript */
  js: string;
  /** Generated files (for professional builds) */
  files?: Map<string, string>;
  /** Source map (if enabled) */
  sourceMap?: string;
  /** Bundle analysis (if enabled) */
  analysis?: BundleAnalysis;
  /** Metadata */
  metadata: CompilationMetadata;
}

/**
 * Bundle analysis data
 */
export interface BundleAnalysis {
  /** Total bundle size in bytes */
  totalSize: number;
  /** Size breakdown by type */
  sizeByType: Record<string, number>;
  /** Dependencies count */
  dependencies: number;
  /** Estimated load time */
  estimatedLoadTime: number;
}

/**
 * Compilation metadata
 */
export interface CompilationMetadata {
  /** Compilation timestamp */
  timestamp: number;
  /** Rendering strategy used */
  strategy: RenderingStrategy;
  /** Target platform */
  target: TargetPlatform;
  /** Compilation duration in ms */
  duration: number;
  /** Features detected */
  features: CompilationFeatures;
  /** Performance metrics */
  performance: PerformanceMetrics;
  /** Number of warnings generated */
  warnings?: number;
}

/**
 * Detected compilation features
 */
export interface CompilationFeatures {
  /** Has reactive data */
  reactive: boolean;
  /** Has event handlers */
  events: boolean;
  /** Has server actions */
  serverActions: boolean;
  /** Has dynamic imports */
  dynamicImports: boolean;
  /** Has CSS animations */
  animations: boolean;
  /** Has form elements */
  forms: boolean;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Largest Contentful Paint estimate */
  lcp: number;
  /** First Contentful Paint estimate */
  fcp: number;
  /** Time to Interactive estimate */
  tti: number;
  /** Bundle size in KB */
  bundleSize: number;
}

/**
 * Compilation context
 */
export interface CompilationContext {
  /** Original AST */
  ast: AST;
  /** Compilation options */
  options: CompilationOptions;
  /** Detected features */
  features: CompilationFeatures;
  /** Generated assets */
  assets: Map<string, string>;
  /** Dependency graph */
  dependencies: Set<string>;
  /** Compilation warnings */
  warnings: CompilationWarning[];
}

/**
 * Compilation warning
 */
export interface CompilationWarning {
  type: 'performance' | 'accessibility' | 'compatibility';
  message: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  suggestion?: string;
}

/**
 * Code generation context
 */
export interface CodeGenerationContext {
  /** Indentation level */
  indent: number;
  /** Variable scope */
  scope: Map<string, VariableInfo>;
  /** Generated code buffer */
  buffer: string[];
}

/**
 * Variable information for scope management
 */
export interface VariableInfo {
  name: string;
  type: 'data' | 'computed' | 'prop' | 'local';
  reactive: boolean;
  used: boolean;
}

/**
 * Optimization pass
 */
export interface OptimizationPass {
  name: string;
  description: string;
  run: (context: CompilationContext) => Promise<void>;
}

/**
 * Plugin interface for extending compiler
 */
export interface CompilerPlugin {
  name: string;
  version: string;

  /** Pre-compilation hook */
  preCompile?: (context: CompilationContext) => Promise<void>;

  /** Post-compilation hook */
  postCompile?: (result: CompilationResult) => Promise<void>;

  /** Custom optimization passes */
  optimizationPasses?: OptimizationPass[];
}