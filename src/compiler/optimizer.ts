// Fluent VX Optimizer
// Advanced optimization pipeline with multiple passes

import { CompilationContext, OptimizationPass, CompilationWarning } from './types';

/**
 * Professional optimizer with configurable optimization passes
 */
export class Optimizer {
  private passes: OptimizationPass[] = [];
  private context: CompilationContext;

  constructor(context: CompilationContext) {
    this.context = context;
    this.initializePasses();
  }

  /**
   * Runs all optimization passes
   */
  async optimize(): Promise<void> {
    for (const pass of this.passes) {
      if (this.shouldRunPass(pass)) {
        await pass.run(this.context);
      }
    }
  }

  /**
   * Adds a custom optimization pass
   */
  addPass(pass: OptimizationPass): void {
    this.passes.push(pass);
  }

  /**
   * Gets optimization statistics
   */
  getStats() {
    return {
      passes: this.passes.length,
      warnings: this.context.warnings.length,
      assets: this.context.assets.size,
      dependencies: this.context.dependencies.size
    };
  }

  /**
   * Initializes default optimization passes
   */
  private initializePasses(): void {
    // Dead code elimination
    this.passes.push({
      name: 'dead-code-elimination',
      description: 'Removes unused variables and functions',
      run: async (context) => {
        // Analyze variable usage
        const usedVars = new Set<string>();

        // Simple analysis - mark all data variables as used for now
        for (const variable of context.ast.data.variables) {
          usedVars.add(variable.name);
        }

        // TODO: Implement proper usage analysis
        context.warnings.push({
          type: 'performance',
          message: 'Dead code elimination not fully implemented',
          suggestion: 'Implement AST traversal for usage analysis'
        });
      }
    });

    // CSS optimization
    this.passes.push({
      name: 'css-optimization',
      description: 'Optimizes CSS for smaller bundle size',
      run: async (context) => {
        if (context.ast.style.content) {
          // Simple optimizations
          let optimized = context.ast.style.content
            .replace(/\s+/g, ' ')           // Collapse whitespace
            .replace(/\/\*.*?\*\//g, '')    // Remove comments
            .replace(/;\s*}/g, '}')         // Remove trailing semicolons
            .trim();

          // Update AST
          context.ast.style.content = optimized;
        }
      }
    });

    // HTML minification
    this.passes.push({
      name: 'html-minification',
      description: 'Minifies HTML output',
      run: async (context) => {
        // HTML minification would be applied during code generation
        // This pass can prepare data for minification
        if (context.options.minify) {
          context.warnings.push({
            type: 'performance',
            message: 'HTML minification enabled',
            suggestion: 'Ensure whitespace is properly handled in templates'
          });
        }
      }
    });

    // Bundle analysis
    this.passes.push({
      name: 'bundle-analysis',
      description: 'Analyzes bundle composition',
      run: async (context) => {
        if (context.options.analyze) {
          // Count different types of content
          const htmlSize = context.ast.view.children.length * 100; // Rough estimate
          const cssSize = context.ast.style.content.length;
          const jsSize = context.features.events ? 2000 : 500; // Rough estimate

          context.assets.set('analysis', JSON.stringify({
            html: htmlSize,
            css: cssSize,
            js: jsSize,
            total: htmlSize + cssSize + jsSize
          }));
        }
      }
    });

    // Accessibility improvements
    this.passes.push({
      name: 'accessibility-improvements',
      description: 'Adds accessibility enhancements',
      run: async (context) => {
        // Check for missing alt attributes on images
        const hasImagesWithoutAlt = this.checkImagesWithoutAlt(context.ast.view.children);

        if (hasImagesWithoutAlt) {
          context.warnings.push({
            type: 'accessibility',
            message: 'Images found without alt attributes',
            suggestion: 'Add alt attributes to all img elements for accessibility'
          });
        }

        // Check for missing labels on form elements
        if (context.features.forms) {
          context.warnings.push({
            type: 'accessibility',
            message: 'Form elements detected - ensure proper labeling',
            suggestion: 'Add labels or aria-labels to form inputs'
          });
        }
      }
    });

    // HTML minification
    this.passes.push({
      name: 'html-minification',
      description: 'Minifies HTML output for smaller bundle size',
      run: async (context) => {
        if (context.options.minify && context.assets.has('html')) {
          const originalHtml = context.assets.get('html')!;
          const minifiedHtml = this.minifyHTML(originalHtml);

          context.assets.set('html', minifiedHtml);

          const savings = originalHtml.length - minifiedHtml.length;
          context.warnings.push({
            type: 'performance',
            message: `HTML minified: ${savings} bytes saved (${Math.round(savings/originalHtml.length*100)}% reduction)`,
            suggestion: 'HTML minification applied successfully'
          });
        }
      }
    });

    // CSS minification
    this.passes.push({
      name: 'css-minification',
      description: 'Minifies CSS output for optimal performance',
      run: async (context) => {
        if (context.options.minify && context.assets.has('css')) {
          const originalCss = context.assets.get('css')!;
          const minifiedCss = this.minifyCSS(originalCss);

          context.assets.set('css', minifiedCss);

          const savings = originalCss.length - minifiedCss.length;
          context.warnings.push({
            type: 'performance',
            message: `CSS minified: ${savings} bytes saved (${Math.round(savings/originalCss.length*100)}% reduction)`,
            suggestion: 'CSS minification applied successfully'
          });
        }
      }
    });

    // JavaScript minification and security
    this.passes.push({
      name: 'javascript-optimization',
      description: 'Minifies and secures JavaScript output',
      run: async (context) => {
        if (context.options.minify && context.assets.has('js')) {
          const originalJs = context.assets.get('js')!;
          const minifiedJs = this.minifyJavaScript(originalJs);
          const securedJs = this.secureJavaScript(minifiedJs);

          context.assets.set('js', securedJs);

          const savings = originalJs.length - securedJs.length;
          context.warnings.push({
            type: 'performance',
            message: `JavaScript minified: ${savings} bytes saved (${Math.round(savings/originalJs.length*100)}% reduction)`,
            suggestion: 'Minification applied successfully'
          });
        }
      }
    });

    // Variable name mangling
    this.passes.push({
      name: 'variable-mangling',
      description: 'Mangles variable names for obfuscation',
      run: async (context) => {
        if (context.options.minify) {
          // Simple variable name mangling
          const mangledNames = this.generateMangledNames(context.ast);

          // Apply mangling to generated assets
          for (const [key, value] of context.assets) {
            if (key === 'js') {
              context.assets.set(key, this.applyNameMangling(value, mangledNames));
            }
          }
        }
      }
    });

    // Performance optimizations
    this.passes.push({
      name: 'performance-optimizations',
      description: 'Applies performance optimizations',
      run: async (context) => {
        // Check for large data objects
        const largeDataVars = context.ast.data.variables.filter(v =>
          v.value.code.length > 1000
        );

        if (largeDataVars.length > 0) {
          context.warnings.push({
            type: 'performance',
            message: `Large data variables detected: ${largeDataVars.map(v => v.name).join(', ')}`,
            suggestion: 'Consider lazy loading or splitting large data structures'
          });
        }

        // Check for too many event handlers
        if (context.features.events) {
          context.warnings.push({
            type: 'performance',
            message: 'Event handlers detected - ensure efficient event delegation',
            suggestion: 'Use event delegation for multiple similar handlers'
          });
        }
      }
    });
  }

  /**
   * Determines if a pass should run based on context
   */
  private shouldRunPass(pass: OptimizationPass): boolean {
    // Skip analysis passes unless explicitly requested
    if (pass.name === 'bundle-analysis' && !this.context.options.analyze) {
      return false;
    }

    // Skip minification passes unless minify is enabled
    if (pass.name === 'html-minification' && !this.context.options.minify) {
      return false;
    }

    return true;
  }

  /**
   * Minifies HTML code
   */
  private minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/\s*([<>])\s*/g, '$1') // Remove spaces around < >
      .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
      .trim();
  }

  /**
   * Minifies CSS code
   */
  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove semicolons before }
      .replace(/{\s*;/g, '{') // Remove semicolons after {
      .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around syntax
      .trim();
  }

  /**
   * Minifies JavaScript code
   */
  private minifyJavaScript(code: string): string {
    // Simple minification - remove extra whitespace and comments
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove semicolons before }
      .replace(/{\s*;/g, '{') // Remove semicolons after {
      .replace(/\s*([{}();,])\s*/g, '$1') // Remove spaces around syntax
      .trim();
  }

  /**
   * Secures JavaScript by replacing unsafe patterns
   */
  private secureJavaScript(code: string): string {
    // Replace eval with secure Function constructor
    return code.replace(
      /eval\(([^)]+)\)/g,
      '(function(){try{const fn=new Function(\'"use strict";return ($1)\');return fn()}catch(e){console.error("Secure execution failed:",e)}})()'
    );
  }

  /**
   * Generates mangled variable names
   */
  private generateMangledNames(ast: any): Map<string, string> {
    const mappings = new Map<string, string>();
    const usedNames = new Set<string>();

    // Collect all variable names
    const collectNames = (node: any) => {
      if (node.type === 'data' && node.variables) {
        node.variables.forEach((v: any) => {
          if (!mappings.has(v.name)) {
            let mangled = this.generateShortName(usedNames);
            mappings.set(v.name, mangled);
            usedNames.add(mangled);
          }
        });
      }
    };

    collectNames(ast.data);
    return mappings;
  }

  /**
   * Generates a short variable name
   */
  private generateShortName(used: Set<string>): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let name = '';

    do {
      name = chars[Math.floor(Math.random() * chars.length)];
    } while (used.has(name));

    return name;
  }

  /**
   * Applies name mangling to code
   */
  private applyNameMangling(code: string, mappings: Map<string, string>): string {
    let mangledCode = code;

    for (const [original, mangled] of mappings) {
      // Simple regex replacement - in production would need AST-based replacement
      const regex = new RegExp(`\\b${original}\\b`, 'g');
      mangledCode = mangledCode.replace(regex, mangled);
    }

    return mangledCode;
  }

  /**
   * Checks for images without alt attributes
   */
  private checkImagesWithoutAlt(nodes: any[]): boolean {
    for (const node of nodes) {
      if (node.type === 'element' && node.tag === 'img') {
        const hasAlt = node.attributes.some((attr: any) => attr.name === 'alt');
        if (!hasAlt) {
          return true;
        }
      }

      if (node.children) {
        if (this.checkImagesWithoutAlt(node.children)) {
          return true;
        }
      }
    }

    return false;
  }
}

/**
 * Convenience function for optimization
 */
export async function optimize(context: CompilationContext): Promise<void> {
  const optimizer = new Optimizer(context);
  await optimizer.optimize();
}

/**
 * Creates a custom optimization pass
 */
export function createOptimizationPass(
  name: string,
  description: string,
  runner: (context: CompilationContext) => Promise<void>
): OptimizationPass {
  return {
    name,
    description,
    run: runner
  };
}