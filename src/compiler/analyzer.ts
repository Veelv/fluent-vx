// Fluent VX Analyzer
// Advanced analysis and code generation for different rendering strategies

import { AST, ViewNode, ElementNode, DirectiveNode, InterpolationNode } from '../parser/ast';
import { RenderingStrategy, CompilationContext, CompilationResult } from './types';
import { generateCode } from './code-generator';

/**
 * Advanced analyzer that generates strategy-specific outputs
 */
export class Analyzer {
  private context: CompilationContext;

  constructor(context: CompilationContext) {
    this.context = context;
  }

  /**
   * Analyze and generate output based on rendering strategy
   */
  async analyzeAndGenerate(): Promise<CompilationResult> {
    const strategy = this.context.options.strategy || RenderingStrategy.STATIC;

    switch (strategy) {
      case RenderingStrategy.STATIC:
        return this.generateStaticOutput();
      case RenderingStrategy.STREAM:
        return this.generateSSROutput();
      case RenderingStrategy.ISLANDS:
        return this.generateIslandsOutput();
      case RenderingStrategy.SPA:
        return this.generateSPAOutput();
      case RenderingStrategy.HYDRATE:
        return this.generateHydrateOutput();
      default:
        // For HYDRATE strategy (default), use code generator with reactive support
        return generateCode(this.context);
    }
  }

  /**
   * Generate static HTML output (SSG)
   */
  private async generateStaticOutput(): Promise<CompilationResult> {
    // For static, evaluate all expressions at compile time
    const staticAST = this.evaluateStaticExpressions(this.context.ast);

    // Temporarily set context to static AST
    const originalAST = this.context.ast;
    this.context.ast = staticAST;

    const result = await generateCode(this.context);

    // Restore original AST
    this.context.ast = originalAST;

    // Remove JavaScript for pure static
    return {
      ...result,
      js: '',
      metadata: {
        ...result.metadata,
        strategy: RenderingStrategy.STATIC,
        // @ts-ignore - Extended metadata
        static: { fullyStatic: true }
      } as any
    };
  }

  /**
   * Generate SSR output with streaming capabilities
   */
  private async generateSSROutput(): Promise<CompilationResult> {
    const result = await generateCode(this.context);

    // Add SSR-specific metadata and code
    const ssrCode = this.generateSSRRuntimeCode();

    return {
      ...result,
      js: result.js + '\n\n' + ssrCode,
      metadata: {
        ...result.metadata,
        strategy: RenderingStrategy.STREAM,
        // @ts-ignore - Extended metadata
        ssr: {
          streaming: true,
          chunks: this.analyzeStreamingChunks()
        }
      } as any
    };
  }

  /**
   * Generate Islands output with selective hydration
   */
  private async generateIslandsOutput(): Promise<CompilationResult> {
    const islands = this.identifyIslands(this.context.ast);

    // Generate island-specific code
    const islandCode = this.generateIslandRuntimeCode(islands);

    const result = await generateCode(this.context);

    return {
      ...result,
      js: result.js + '\n\n' + islandCode,
      html: this.markIslandsInHTML(result.html, islands),
      metadata: {
        ...result.metadata,
        strategy: RenderingStrategy.ISLANDS,
        // @ts-ignore - Extended metadata
        islands: {
          count: islands.length,
          interactiveRatio: this.calculateInteractiveRatio(islands)
        }
      } as any
    };
  }

  /**
   * Generate SPA output with client-side routing
   */
  private async generateSPAOutput(): Promise<CompilationResult> {
    const result = await generateCode(this.context);

    // Add SPA-specific runtime
    const spaCode = this.generateSPARuntimeCode();

    return {
      ...result,
      html: this.generateSPAContainerHTML(),
      js: result.js + '\n\n' + spaCode,
      metadata: {
        ...result.metadata,
        strategy: RenderingStrategy.SPA,
        // @ts-ignore - Extended metadata
        spa: {
          hasRouting: this.detectRouting(this.context.ast),
          clientOnly: true
        }
      } as any
    };
  }

  /**
   * Generate Hydrate output for progressive enhancement
   */
  private async generateHydrateOutput(): Promise<CompilationResult> {
    const result = await generateCode(this.context);

    // Add hydration-specific code
    const hydrateCode = this.generateHydrateRuntimeCode();

    return {
      ...result,
      js: result.js + '\n\n' + hydrateCode,
      metadata: {
        ...result.metadata,
        strategy: RenderingStrategy.HYDRATE,
        // @ts-ignore - Extended metadata
        hydrate: {
          progressive: true,
          estimatedHydrationTime: this.estimateHydrationTime()
        }
      } as any
    };
  }

  /**
   * Evaluate static expressions at compile time
   */
  private evaluateStaticExpressions(ast: AST): AST {
    const evaluateNode = (node: ViewNode): ViewNode => {
      if (node.type === 'interpolation') {
        const staticValue = this.evaluateExpression(node.expression.code);
        if (staticValue !== null) {
          return {
            type: 'text',
            content: String(staticValue)
          };
        }
      }

      if (node.type === 'element') {
        return {
          ...node,
          children: node.children.map(evaluateNode)
        };
      }

      if (node.type === 'directive') {
        // For static generation, directives might be resolved
        return {
          ...node,
          children: node.children.map(evaluateNode)
        };
      }

      return node;
    };

    return {
      ...ast,
      view: {
        ...ast.view,
        children: ast.view.children.map(evaluateNode)
      }
    };
  }

  /**
   * Evaluate simple expressions
   */
  private evaluateExpression(code: string): any {
    // Simple static evaluation
    if (code.startsWith('"') && code.endsWith('"')) {
      return code.slice(1, -1);
    }

    if (!isNaN(Number(code))) {
      return Number(code);
    }

    if (code === 'true') return true;
    if (code === 'false') return false;

    // Check data variables
    const dataVar = this.context.ast.data.variables.find(v => v.name === code);
    if (dataVar) {
      return this.evaluateExpression(dataVar.value.code);
    }

    return null; // Cannot evaluate statically
  }

  /**
   * Identify interactive islands in the AST
   */
  private identifyIslands(ast: AST): IslandInfo[] {
    const islands: IslandInfo[] = [];
    let islandCounter = 0;

    const analyzeNode = (node: ViewNode, path: string[]): void => {
      if (node.type === 'element') {
        const hasInteractivity = this.elementHasInteractivity(node);
        const currentPath = [...path, node.tag];

        if (hasInteractivity) {
          islands.push({
            id: `island_${islandCounter++}`,
            path: currentPath,
            interactive: true,
            elements: this.countElements(node),
            eventHandlers: this.countEventHandlers(node)
          });
        }

        node.children.forEach((child, index) =>
          analyzeNode(child, [...currentPath, `child_${index}`])
        );
      }
    };

    ast.view.children.forEach((child, index) =>
      analyzeNode(child, [`root_${index}`])
    );

    return islands;
  }

  /**
   * Check if element has interactivity
   */
  private elementHasInteractivity(element: ElementNode): boolean {
    return element.attributes.some(attr =>
      attr.name.startsWith('@') ||
      attr.name.startsWith('on') ||
      attr.dynamic
    );
  }

  /**
   * Count elements in a node tree
   */
  private countElements(node: ViewNode): number {
    if (node.type === 'element') {
      return 1 + node.children.reduce((sum, child) => sum + this.countElements(child), 0);
    }
    return 0;
  }

  /**
   * Count event handlers in a node tree
   */
  private countEventHandlers(node: ViewNode): number {
    if (node.type === 'element') {
      const elementHandlers = node.attributes.filter(attr =>
        attr.name.startsWith('@') || attr.name.startsWith('on')
      ).length;

      return elementHandlers + node.children.reduce((sum, child) =>
        sum + this.countEventHandlers(child), 0
      );
    }
    return 0;
  }

  /**
   * Generate SSR runtime code
   */
  private generateSSRRuntimeCode(): string {
    return `
// SSR Runtime
if (typeof window === 'undefined') {
  global.VX_SSR = {
    renderToString: function(ast) {
      // Server-side rendering logic
      return '<div>SSR Content</div>';
    },

    renderToStream: function(ast) {
      // Streaming SSR logic
      return new ReadableStream({
        start(controller) {
          controller.enqueue('<div>');
          controller.enqueue('SSR Stream Content');
          controller.enqueue('</div>');
          controller.close();
        }
      });
    }
  };
}
    `.trim();
  }

  /**
   * Generate island runtime code
   */
  private generateIslandRuntimeCode(islands: IslandInfo[]): string {
    const islandIds = islands.map(i => i.id);

    return `
// Islands Runtime
window.VX_ISLANDS = {
  islands: ${JSON.stringify(islandIds)},

  hydrateIsland: function(id) {
    const island = document.getElementById(id);
    if (island && island.dataset.interactive) {
      console.log('Hydrating island:', id);
      // Selective hydration logic
    }
  },

  hydrateAll: function() {
    this.islands.forEach(id => this.hydrateIsland(id));
  }
};

// Auto-hydrate on load
document.addEventListener('DOMContentLoaded', function() {
  window.VX_ISLANDS.hydrateAll();
});
    `.trim();
  }

  /**
   * Generate SPA runtime code
   */
  private generateSPARuntimeCode(): string {
    return `
// SPA Runtime
window.VX_SPA = {
  router: null,

  init: function() {
    this.setupRouting();
    this.render();
  },

  setupRouting: function() {
    // Client-side routing setup
    window.addEventListener('popstate', () => this.render());
  },

  render: function() {
    const app = document.getElementById('app');
    if (app) {
      // Client-side rendering
      app.innerHTML = '<div>SPA Content</div>';
    }
  }
};

// Initialize SPA
document.addEventListener('DOMContentLoaded', function() {
  window.VX_SPA.init();
});
    `.trim();
  }

  /**
   * Generate hydrate runtime code
   */
  private generateHydrateRuntimeCode(): string {
    return `
// Hydrate Runtime
window.VX_HYDRATE = {
  hydrated: false,

  hydrate: function() {
    if (this.hydrated) return;

    console.log('Starting progressive hydration...');

    // Progressive hydration logic
    this.attachEventListeners();
    this.initializeReactivity();

    this.hydrated = true;
    console.log('Hydration complete');
  },

  attachEventListeners: function() {
    // Attach event listeners to pre-rendered HTML
    document.querySelectorAll('[data-event-click]').forEach(el => {
      el.addEventListener('click', function() {
        const code = this.getAttribute('data-event-click');
        if (code) {
          try {
            new Function('"use strict"; return (' + code + ')')();
          } catch (e) {
            console.error('Event execution failed:', e);
          }
        }
      });
    });
  },

  initializeReactivity: function() {
    // Initialize reactive system on hydrated content
    if (window.VX && window.VX.effect) {
      // Reactive effects are already set up
    }
  }
};

// Start hydration
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => window.VX_HYDRATE.hydrate(), 0);
});
    `.trim();
  }

  /**
   * Mark islands in HTML
   */
  private markIslandsInHTML(html: string, islands: IslandInfo[]): string {
    let markedHtml = html;

    islands.forEach(island => {
      // Simple marking - in production would need more sophisticated marking
      markedHtml = markedHtml.replace(
        /<div/g,
        `<div data-island="${island.id}"`
      );
    });

    return markedHtml;
  }

  /**
   * Generate SPA container HTML
   */
  private generateSPAContainerHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fluent VX SPA</title>
</head>
<body>
  <div id="app">
    <!-- SPA content will be rendered here -->
  </div>
</body>
</html>`;
  }

  /**
   * Analyze streaming chunks for SSR
   */
  private analyzeStreamingChunks(): any[] {
    // Analyze AST for streaming opportunities
    const chunks = [];

    // Head chunk
    chunks.push({ type: 'head', priority: 1 });

    // Above fold content
    chunks.push({ type: 'above-fold', priority: 2 });

    // Below fold content
    chunks.push({ type: 'below-fold', priority: 3 });

    return chunks;
  }

  /**
   * Calculate interactive ratio for islands
   */
  private calculateInteractiveRatio(islands: IslandInfo[]): number {
    const totalElements = islands.reduce((sum, island) => sum + island.elements, 0);
    const interactiveElements = islands.reduce((sum, island) => sum + island.eventHandlers, 0);

    return totalElements > 0 ? interactiveElements / totalElements : 0;
  }

  /**
   * Detect routing in AST
   */
  private detectRouting(ast: AST): boolean {
    // Simple heuristic - look for navigation-related elements
    const hasLinks = this.hasElement(ast.view.children, 'a');
    const hasButtons = this.hasElement(ast.view.children, 'button');

    return hasLinks || hasButtons;
  }

  /**
   * Check if AST has specific element
   */
  private hasElement(nodes: ViewNode[], tagName: string): boolean {
    for (const node of nodes) {
      if (node.type === 'element') {
        if (node.tag === tagName) return true;
        if (this.hasElement(node.children, tagName)) return true;
      }
    }
    return false;
  }

  /**
   * Estimate hydration time
   */
  private estimateHydrationTime(): number {
    // Rough estimation based on features
    let time = 100; // Base time

    if (this.context.features.events) time += 200;
    if (this.context.features.reactive) time += 300;
    if (this.context.features.animations) time += 100;

    return time;
  }
}

/**
 * Island information
 */
interface IslandInfo {
  id: string;
  path: string[];
  interactive: boolean;
  elements: number;
  eventHandlers: number;
}

/**
 * Convenience function for analysis
 */
export async function analyze(context: CompilationContext): Promise<CompilationResult> {
  const analyzer = new Analyzer(context);
  return analyzer.analyzeAndGenerate();
}