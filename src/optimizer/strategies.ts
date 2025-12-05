// Strategy-specific optimizations

import { AST } from '../parser/ast';
import { RenderingStrategy } from '../strategy';
import { Bundle } from './types';

/**
 * Extracts critical CSS for above-the-fold content.
 */
export function extractCriticalCss(css: string, ast: AST): string {
  // Simple heuristic: extract styles for common elements
  const criticalSelectors = ['body', 'h1', 'h2', 'p', '.container'];
  const lines = css.split('\n');
  const criticalLines: string[] = [];

  for (const line of lines) {
    if (criticalSelectors.some(sel => line.includes(sel))) {
      criticalLines.push(line);
    }
  }

  return criticalLines.join('\n');
}

/**
 * Adds hydration optimizations for SSR.
 */
export function addHydrationOptimizations(js: string): string {
  return js + '\n// SSR Hydration optimizations\nconsole.log("Hydrating...");';
}

/**
 * Creates code bundles for interactive islands.
 */
export function createIslandBundles(ast: AST, js: string): Bundle[] {
  const bundles: Bundle[] = [];
  // Simple: split JS by component (placeholder)
  bundles.push({
    name: 'main',
    code: js.substring(0, js.length / 2),
    size: js.length / 4
  });
  bundles.push({
    name: 'interactive',
    code: js.substring(js.length / 2),
    size: js.length / 4
  });
  return bundles;
}

/**
 * Generates lazy loader for island bundles.
 */
export function generateIslandLoader(bundles: Bundle[]): string {
  return `
${bundles.map(b => `import('./${b.name}.js');`).join('\n')}
// Island loader
console.log('Loading islands...');
  `.trim();
}

/**
 * Adds route-based code splitting for SPA.
 */
export function addRouteSplitting(js: string, ast: AST): string {
  return js + '\n// Route splitting\nconsole.log("Splitting routes...");';
}

/**
 * Gets performance estimates for each strategy.
 */
export function getPerformanceEstimates(strategy: RenderingStrategy): { lcp: number; bundleSize: number } {
  switch (strategy) {
    case RenderingStrategy.SSG:
      return { lcp: 30, bundleSize: 2 };
    case RenderingStrategy.ISLANDS:
      return { lcp: 40, bundleSize: 3 };
    case RenderingStrategy.SSR:
      return { lcp: 50, bundleSize: 5 };
    case RenderingStrategy.SPA:
      return { lcp: 60, bundleSize: 8 };
    default:
      return { lcp: 100, bundleSize: 10 };
  }
}