// Fluent VX Code Generator
// Advanced code generation with optimization and strategy-specific output

import { AST, ViewNode, ElementNode, DirectiveNode, InterpolationNode, TextNode } from '../parser/ast';
import {
  RenderingStrategy,
  CompilationResult,
  CompilationContext,
  CodeGenerationContext,
  VariableInfo
} from './types';

/**
 * Professional code generator with multiple output formats
 */
export class CodeGenerator {
  private context: CompilationContext;
  private codeContext: CodeGenerationContext;
  private reactiveUpdates: string[] = [];

  constructor(context: CompilationContext) {
    this.context = context;
    this.codeContext = {
      indent: 0,
      scope: new Map(),
      buffer: []
    };
  }

  /**
   * Add a reactive update function
   */
  private addReactiveUpdate(updateFn: string): void {
    this.reactiveUpdates.push(updateFn);
  }

  /**
   * Generates complete compilation result
   */
  async generate(): Promise<CompilationResult> {
    const startTime = Date.now();

    // Initialize scope with data variables
    this.initializeScope();

    // Generate code based on strategy
    const html = this.generateHTML();
    const css = this.generateCSS();
    const js = this.generateJavaScript();

    // Store assets for optimization
    this.context.assets.set('html', html);
    this.context.assets.set('css', css);
    this.context.assets.set('js', js);

    const duration = Date.now() - startTime;

    // Generate separate files for professional builds
    const files = this.context.options.dev ? undefined : this.generateSeparateFiles(html, css, js);

    return {
      html,
      css,
      js,
      files,
      metadata: {
        timestamp: Date.now(),
        strategy: this.context.options.strategy || RenderingStrategy.STATIC,
        target: this.context.options.target,
        duration,
        features: this.context.features,
        performance: this.estimatePerformance()
      }
    };
  }

  /**
   * Initializes variable scope from AST
   */
  private initializeScope(): void {
    // Add data variables to scope
    for (const variable of this.context.ast.data.variables) {
      this.codeContext.scope.set(variable.name, {
        name: variable.name,
        type: 'data',
        reactive: true,
        used: false
      });
    }
  }

  /**
   * Generates optimized HTML output based on rendering strategy
   */
  private generateHTML(): string {
    const buffer: string[] = [];

    buffer.push('<!DOCTYPE html>');
    buffer.push('<html lang="en">');
    buffer.push('<head>');
    buffer.push('  <meta charset="UTF-8">');
    buffer.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    buffer.push('  <title>Fluent VX App</title>');

    // Add CSS inline for production, link for dev
    if (this.context.ast.style.content.trim()) {
      if (this.context.options.dev) {
        buffer.push('  <link rel="stylesheet" href="./.vx/assets/style.css">');
      } else {
        buffer.push('  <style>');
        buffer.push(this.generateCSS());
        buffer.push('  </style>');
      }
    }

    buffer.push('</head>');
    buffer.push('<body>');

    // Generate view content based on strategy
    buffer.push(this.generateViewHTML());

    // Add JavaScript inline for production, link for dev
    if (this.needsJavaScript()) {
      if (this.context.options.dev) {
        buffer.push('  <script type="module" src="./.vx/assets/app.js"></script>');
      } else {
        buffer.push('  <script>');
        buffer.push(this.generateJavaScript());
        buffer.push('  </script>');
      }
    }

    buffer.push('</body>');
    buffer.push('</html>');

    return buffer.join('\n');
  }

  /**
   * Generates view HTML content
   */
  private generateViewHTML(): string {
    return this.generateNodesHTML(this.context.ast.view.children, 2);
  }

  /**
   * Recursively generates HTML for view nodes
   */
  private generateNodesHTML(nodes: ViewNode[], indent: number): string {
    const buffer: string[] = [];
    const indentStr = ' '.repeat(indent);

    for (const node of nodes) {
      switch (node.type) {
        case 'element':
          buffer.push(this.generateElementHTML(node, indent));
          break;
        case 'text':
          buffer.push(`${indentStr}${node.content}`);
          break;
        case 'interpolation':
          const staticValue = this.evaluateStaticExpression(node.expression.code);
          if (staticValue !== null) {
            buffer.push(`${indentStr}${staticValue}`);
          } else {
            // For dev mode, try to get default value anyway
            const defaultValue = this.getDefaultValue(node.expression.code);
            if (defaultValue) {
              buffer.push(`${indentStr}${defaultValue}`);
            } else {
              // Generate reactive interpolation
              const varName = `vx_${Math.random().toString(36).substr(2, 9)}`;
              const varCode = node.expression.code;
              this.context.features.reactive = true;
              buffer.push(`${indentStr}<span id="${varName}" data-vx-text="${varCode}">${varCode}</span>`);

              // Add to reactive updates
              this.addReactiveUpdate(`() => {
                 const el = document.getElementById('${varName}');
                 if (el && window.reactiveData.${varCode} !== undefined) {
                   el.textContent = String(window.reactiveData.${varCode});
                 }
               }`);
            }
          }
          break;
        case 'directive':
          buffer.push(this.generateDirectiveHTML(node, indent));
          break;
      }
    }

    return buffer.join('\n');
  }

  /**
   * Generates HTML for element nodes
   */
  private generateElementHTML(element: ElementNode, indent: number): string {
    const indentStr = ' '.repeat(indent);
    const attrs = this.generateElementAttributes(element);

    if (element.selfClosing) {
      return `${indentStr}<${element.tag}${attrs} />`;
    }

    const children = element.children.length > 0
      ? '\n' + this.generateNodesHTML(element.children, indent + 2) + '\n' + indentStr
      : '';

    return `${indentStr}<${element.tag}${attrs}>${children}</${element.tag}>`;
  }

  /**
   * Generates attributes string for elements
   */
  private generateElementAttributes(element: ElementNode): string {
    const attrs: string[] = [];

    for (const attr of element.attributes) {
      if (attr.name.startsWith('@')) {
        // Event handlers - add data attributes for hydration
        const value = (attr.value?.code || '').replace(/"/g, '"');
        attrs.push(`data-event-${attr.name.slice(1)}="${value}"`);
      } else if (attr.dynamic) {
        // Dynamic attributes
        attrs.push(`${attr.name}="{{ ${attr.value?.code || ''} }}"`);
      } else {
        // Static attributes
        const value = (attr.value?.code || '').replace(/"/g, '"');
        attrs.push(`${attr.name}="${value}"`);
      }
    }

    return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  }

  /**
   * Generates HTML for directive nodes
   */
  private generateDirectiveHTML(directive: DirectiveNode, indent: number): string {
    const indentStr = ' '.repeat(indent);

    switch (directive.name) {
      case 'if':
        const condition = directive.condition?.code;
        const conditionValue = this.evaluateStaticExpression(condition || '');

        // For reactive conditions, always render both branches with appropriate markers
        if (conditionValue === null) {
          // Dynamic condition - render both branches
          const ifContent = this.generateNodesHTML(directive.children, indent);
          // For now, just render the if branch for dynamic conditions
          return ifContent;
        } else if (conditionValue) {
          // Static true condition
          return this.generateNodesHTML(directive.children, indent);
        } else {
          // Static false condition - check for else branch
          return '';
        }

      case 'for':
        const iterator = directive.iterator || 'item';
        const iterable = directive.iterable?.code || 'items';
        const iterableValue = this.evaluateStaticExpression(iterable);

        if (iterableValue !== null && Array.isArray(iterableValue)) {
          let result = '';
          for (const item of iterableValue) {
            // Create a temporary data context with the iterator variable
            const originalAST = this.context.ast;
            const tempAST = {
              ...originalAST,
              data: {
                ...originalAST.data,
                variables: [
                  ...originalAST.data.variables,
                  { name: iterator, value: { type: 'expression' as const, code: JSON.stringify(item) } }
                ]
              }
            };

            // Temporarily update AST
            this.context.ast = tempAST;

            // Generate HTML with iterator in data context
            result += this.generateNodesHTML(directive.children, indent);

            // Restore original AST
            this.context.ast = originalAST;
          }
          return result;
        }

        // Fallback for non-static arrays
        return `${indentStr}<!-- @for ${iterator} in ${iterable} -->\n${
          this.generateNodesHTML(directive.children, indent)
        }\n${indentStr}<!-- @endfor -->`;

      default:
        return this.generateNodesHTML(directive.children, indent);
    }
  }

  /**
   * Generates CSS output
   */
  private generateCSS(): string {
    return this.context.ast.style.content;
  }

  /**
   * Generates JavaScript output
   */
  private generateJavaScript(): string {
    const buffer: string[] = [];

    // Data initialization (global)
    buffer.push('// Global data initialization');
    buffer.push('const data = {};');

    // Initialize reactive data
    for (const variable of this.context.ast.data.variables) {
      buffer.push(`data.${variable.name} = ${this.parseValue(variable.value.code)};`);
    }

    // Add inline VxRouter for client-side routing
    buffer.push(this.generateInlineVxRouter());

    // Add secure fetch for API calls
    if (this.needsSecureFetch()) {
      buffer.push(this.generateSecureFetch());
    }

    // Add reactivity system
    if (this.context.features.reactive) {
      buffer.push(this.generateReactivitySystem());
    }

    // Add event handlers
    if (this.context.features.events) {
      buffer.push(this.generateEventHandlers());
    }

    // Add server action callers
    if (this.context.features.serverActions) {
      buffer.push(this.generateServerActionCallers());
    }

    // Export VX for module usage
    buffer.push(`\n// Export VX\nexport { VX };`);

    // Make VX globally available
    buffer.push(`\n// Global VX\nwindow.VX = VX;`);

    // Add script block content
    if (this.context.ast.script.content.trim()) {
      buffer.push(`\n// Script block content\n${this.context.ast.script.content}`);
    }

    // Initialize VX if available
    buffer.push(`\n// Initialize VX framework\nif (window.VX && window.VX.init) {\n  window.VX.init().catch(console.error);\n}`);

    return buffer.join('\n');
  }

  /**
   * Generates strategy-specific JavaScript
   */
  private generateStrategySpecificJavaScript(): string {
    const strategy = this.context.options.strategy;

    switch (strategy) {
      case RenderingStrategy.STATIC:
        return this.generateStaticJavaScript();
      case RenderingStrategy.STREAM:
        return this.generateSSRJavaScript();
      case RenderingStrategy.ISLANDS:
        return this.generateIslandsJavaScript();
      case RenderingStrategy.SPA:
        return this.generateSPAJavaScript();
      case RenderingStrategy.HYDRATE:
        return this.generateHydrateJavaScript();
      default:
        return this.generateInlineJavaScript();
    }
  }

  /**
   * Generates static JavaScript (minimal)
   */
  private generateStaticJavaScript(): string {
    return `
      // Static Fluent VX App
      console.log('Static Fluent VX app loaded');
    `.trim();
  }

  /**
   * Generates SSR JavaScript
   */
  private generateSSRJavaScript(): string {
    return `
      // SSR Fluent VX Runtime
      ${this.generateReactivitySystem()}
      console.log('SSR Fluent VX app loaded');
    `.trim();
  }

  /**
   * Generates Islands JavaScript (selective hydration)
   */
  private generateIslandsJavaScript(): string {
    return `
      // Islands Fluent VX Runtime
      ${this.generateReactivitySystem()}

      // Selective hydration for interactive islands
      function hydrateIsland(islandId) {
        const island = document.getElementById(islandId);
        if (island && island.dataset.interactive) {
          // Hydrate this specific island
          console.log('Hydrating island:', islandId);
        }
      }

      // Auto-hydrate on load
      document.addEventListener('DOMContentLoaded', () => {
        const islands = document.querySelectorAll('[data-island]');
        islands.forEach(island => {
          if (island.id) hydrateIsland(island.id);
        });
      });

      console.log('Islands Fluent VX app loaded');
    `.trim();
  }

  /**
   * Generates SPA JavaScript (full client-side)
   */
  private generateSPAJavaScript(): string {
    return `
      // SPA Fluent VX Runtime
      ${this.generateReactivitySystem()}

      // Full client-side rendering
      function renderApp() {
        // Client-side rendering logic would go here
        console.log('SPA Fluent VX app rendered');
      }

      // Initialize on load
      document.addEventListener('DOMContentLoaded', renderApp);
      console.log('SPA Fluent VX app loaded');
    `.trim();
  }

  /**
   * Generates Hydrate JavaScript
   */
  private generateHydrateJavaScript(): string {
    return `
      // Hydrate Fluent VX Runtime
      ${this.generateReactivitySystem()}

      // Progressive hydration
      function hydrateApp() {
        // Hydrate the entire app
        console.log('Hydrating Fluent VX app');
      }

      // Hydrate on load
      document.addEventListener('DOMContentLoaded', hydrateApp);
      console.log('Hydrate Fluent VX app loaded');
    `.trim();
  }

  /**
   * Generates inline JavaScript for HTML (fallback)
   */
  private generateInlineJavaScript(): string {
    // Minimal inline script for basic functionality
    return `
      // Fluent VX Runtime
      console.log('Fluent VX app loaded');
    `.trim();
  }

  /**
   * Parses JavaScript values from strings
   */
  private parseValue(code: string): string {
    // Simple value parsing
    if (code.startsWith('"') && code.endsWith('"')) {
      return code; // String literal
    }
    if (!isNaN(Number(code))) {
      return code; // Number literal
    }
    if (code === 'true' || code === 'false') {
      return code; // Boolean literal
    }
    return code; // Expression
  }

  /**
   * Generates VX-SecureFetch runtime
   */
  private generateSecureFetch(): string {
    return `
      // VX-SecureFetch Runtime
      class VXSecureFetch {
        constructor(config = {}) {
          this.config = {
            jsonPrefix: 'for (;;);',
            timeout: 10000,
            maxResponseSize: 10 * 1024 * 1024,
            debug: false,
            ...config
          };
        }

        async fetch(url, options = {}) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

          try {
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
              }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
            }

            const text = await response.text();
            const security = this.processSecurity(text);
            const data = this.parseJSON(security.cleanText);

            if (!this.validateData(data)) {
              throw new Error('Response data failed validation');
            }

            return {
              data,
              status: response.status,
              security
            };

          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        }

        processSecurity(text) {
          let cleanText = text.trim();
          let prefixRemoved = false;

          if (cleanText.startsWith(this.config.jsonPrefix)) {
            prefixRemoved = true;
            cleanText = cleanText.slice(this.config.jsonPrefix.length).trim();
          }

          return {
            hijackingProtected: prefixRemoved,
            prefixRemoved,
            cleanText,
            validationPassed: true
          };
        }

        parseJSON(text) {
          // Security checks
          if (text.includes('<script') || text.includes('javascript:')) {
            throw new Error('Potentially dangerous content detected');
          }

          return JSON.parse(text);
        }

        validateData(data) {
          // Basic validation - can be extended
          return data !== null && typeof data === 'object';
        }
      }

      // Global secure fetch instance
      window.VXSecureFetch = new VXSecureFetch();
    `;
  }

  /**
   * Generates advanced reactivity system code
   */
  private generateReactivitySystem(): string {
    return `
      // Advanced Fine-Grained Reactivity System
      class ReactiveObject {
        constructor(target) {
          this.dependencies = new Map();
          return this.createReactiveProxy(target);
        }

        track(property, effect) {
          if (!this.dependencies.has(property)) {
            this.dependencies.set(property, new Set());
          }
          this.dependencies.get(property).add(effect);
        }

        trigger(property) {
          const deps = this.dependencies.get(property);
          if (deps) {
            deps.forEach(effect => effect());
          }
        }

        createReactiveProxy(target) {
          const self = this;
          return new Proxy(target, {
            get(target, property) {
              if (activeEffect && typeof property === 'string') {
                self.track(property, activeEffect);
              }
              const value = Reflect.get(target, property);
              if (typeof value === 'object' && value !== null && !value.__isReactive) {
                return self.createReactiveProxy(value);
              }
              return value;
            },
            set(target, property, value) {
              const oldValue = Reflect.get(target, property);
              if (oldValue !== value) {
                Reflect.set(target, property, value);
                self.trigger(property);
              }
              return true;
            }
          });
        }
      }

      class Effect {
        constructor(fn) {
          this.fn = fn;
          this.dependencies = new Set();
          this.active = false;
        }

        run() {
          if (this.active) return;
          this.active = true;
          this.cleanup();
          activeEffect = this;
          try {
            this.fn();
          } finally {
            activeEffect = null;
            this.active = false;
          }
        }

        addDependency(dep) {
          this.dependencies.add(dep);
        }

        cleanup() {
          this.dependencies.clear();
        }
      }

      let activeEffect = null;

      // Global reactivity functions
      window.VX = {
        reactive: (target) => new ReactiveObject(target),
        effect: (fn) => {
          const effect = new Effect(fn);
          effect.run();
          return effect;
        },
        computed: (getter) => {
          let value, dirty = true;
          const effect = new Effect(() => {
            value = getter();
            dirty = false;
          });
          return {
            get value() {
              if (dirty) effect.run();
              return value;
            }
          };
        },
        watch: (source, callback) => {
          let oldValue;
          const effect = new Effect(() => {
            const newValue = source();
            if (oldValue !== undefined) callback(newValue, oldValue);
            oldValue = newValue;
          });
          effect.run();
        },
        nextTick: (callback) => setTimeout(callback, 0),
        batch: (callback) => callback(),
        init: () => {
          // Initialize framework
          console.log('Fluent VX initialized');
          // Could setup client-side routing here if needed
        }
      };

      // Make data reactive (global)
      window.reactiveData = window.VX.reactive(data);

      // Create reactive effects for DOM updates
      ${this.generateReactiveEffects()}
    `;
  }

  /**
   * Generate reactive effects for DOM updates
   */
  private generateReactiveEffects(): string {
    if (this.reactiveUpdates.length === 0) return '';

    return `
      // Reactive DOM updates
      ${this.reactiveUpdates.map(update => `window.VX.effect(${update});`).join('\n      ')}
    `;
  }

  /**
   * Generates inline VxRouter for client-side routing
   */
  private generateInlineVxRouter(): string {
    return `
// Inline VxRouter - Simplified client-side router
class VxRouter {
  constructor(config = {}) {
    this.config = { pagesDir: './src/pages', ...config };
    this.routes = [];
  }

  async initialize() {
    // Simple route discovery - in production this would scan filesystem
    this.routes = [
      { path: '/', filePath: './src/pages/index.vx' },
      { path: '/about', filePath: './src/pages/about.vx' },
      { path: '/contact', filePath: './src/pages/contact.vx' }
    ];
    return this.routes;
  }

  match(pathname) {
    // Simple exact matching
    const route = this.routes.find(r => r.path === pathname);
    if (route) {
      return {
        route,
        params: {},
        pathname
      };
    }
    return null;
  }

  async matchWithProcessing(pathname) {
    return this.match(pathname);
  }
}

// Global VxRouter instance
window.VxRouter = VxRouter;
    `.trim();
  }

  /**
   * Generates secure event handler code
   */
  private generateEventHandlers(): string {
    return `
      // Secure event handlers
      document.addEventListener('click', (e) => {
        const eventAttr = e.target.closest('[data-event-click]');
        if (eventAttr) {
          const code = eventAttr.getAttribute('data-event-click');
          if (code) {
            try {
              // Transform variable names to use reactive data
              const transformedCode = code.replace(/\\b(\\w+)\\b/g, 'window.reactiveData.$1');
              const fn = new Function('"use strict"; ' + transformedCode);
              fn();
            } catch (error) {
              console.error('Secure event execution failed:', error);
            }
          }
        }
      });
    `;
  }

  /**
   * Generates server action callers
   */
  private generateServerActionCallers(): string {
    const callers: string[] = [];

    for (const action of this.context.ast.serverActions) {
      callers.push(`
        window.${action.name} = async (...args) => {
          const response = await fetch('/api/actions/${action.name}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ args })
          });
          return response.json();
        };
      `);
    }

    return callers.join('\n');
  }

  /**
   * Checks if JavaScript is needed
   */
  private needsJavaScript(): boolean {
    return this.context.features.reactive ||
            this.context.features.events ||
            this.context.features.serverActions ||
            this.context.ast.script.content.trim() !== '';
  }

  /**
   * Checks if secure fetch is needed
   */
  private needsSecureFetch(): boolean {
    // Include secure fetch for apps with server actions or API calls
    return this.context.features.serverActions ||
           this.hasApiCallsInCode();
  }

  /**
   * Checks if there are API calls in the code
   */
  private hasApiCallsInCode(): boolean {
    // Simple heuristic - look for fetch or API-related patterns
    const code = JSON.stringify(this.context.ast);
    return code.includes('fetch') || code.includes('api') || code.includes('http');
  }

  /**
   * Estimates performance metrics
   */
  private estimatePerformance() {
    const bundleSize = this.estimateBundleSize();

    return {
      lcp: this.context.features.animations ? 2500 : 1500,
      fcp: this.context.features.forms ? 1200 : 800,
      tti: this.context.features.events ? 2000 : 1000,
      bundleSize
    };
  }

  /**
   * Evaluates static expressions for direct HTML generation
   */
  private evaluateStaticExpression(code: string): any {
    // Remove whitespace
    const trimmedCode = code.trim();

    // Simple static evaluation for string literals
    if (trimmedCode.startsWith('"') && trimmedCode.endsWith('"')) {
      return trimmedCode.slice(1, -1); // Remove quotes
    }

    // Check if it's a data variable
    const dataVar = this.context.ast.data.variables.find(v => v.name === trimmedCode);
    if (dataVar) {
      return this.evaluateStaticExpression(dataVar.value.code);
    }

    // Handle arrays
    if (trimmedCode.startsWith('[') && trimmedCode.endsWith(']')) {
      try {
        // Try to parse as JSON first
        return JSON.parse(trimmedCode);
      } catch (e) {
        // Fallback to manual parsing
        const arrayContent = trimmedCode.slice(1, -1).trim();
        if (arrayContent === '') return [];

        const items = arrayContent.split(',').map(item => {
          const trimmedItem = item.trim();
          if (trimmedItem.startsWith('"') && trimmedItem.endsWith('"')) {
            return trimmedItem.slice(1, -1);
          }
          return trimmedItem;
        });
        return items;
      }
    }

    // Handle objects
    if (trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) {
      try {
        // Simple object parsing
        const objContent = trimmedCode.slice(1, -1).trim();
        if (objContent === '') return {};

        const pairs = objContent.split(',').map(pair => pair.trim());
        const obj: any = {};

        for (const pair of pairs) {
          const [key, ...valueParts] = pair.split(':');
          const value = valueParts.join(':').trim();
          const keyName = key.trim().replace(/"/g, '');
          const valueParsed = this.evaluateStaticExpression(value);
          obj[keyName] = valueParsed;
        }

        return obj;
      } catch (e) {
        return null;
      }
    }

    // Handle simple expressions like method calls
    if (trimmedCode.includes('.toLowerCase()')) {
      const [varName, method] = trimmedCode.split('.toLowerCase()');
      const baseValue = this.evaluateStaticExpression(varName);
      if (baseValue && method === '' && typeof baseValue === 'string') {
        return baseValue.toLowerCase();
      }
    }

    // Handle numbers
    if (!isNaN(Number(trimmedCode))) {
      return Number(trimmedCode);
    }

    // Handle booleans
    if (trimmedCode === 'true') return true;
    if (trimmedCode === 'false') return false;

    return null; // Not static
  }

  /**
   * Gets default value for reactive interpolation
   */
  private getDefaultValue(varCode: string): string {
    // Try to get initial value from data variables
    const dataVar = this.context.ast.data.variables.find(v => v.name === varCode);
    if (dataVar) {
      const value = this.evaluateStaticExpression(dataVar.value.code);
      return value !== null ? value : '';
    }
    return '';
  }

  /**
   * Generates separate files for professional builds
   */
  private generateSeparateFiles(html: string, css: string, js: string): Map<string, string> {
    const files = new Map<string, string>();

    // Main HTML file
    files.set('index.html', html);

    // CSS file (if we have styles)
    if (css.trim()) {
      files.set('assets/style.css', this.minifyCSS(css));
    }

    // JavaScript file (if we need JS)
    if (this.needsJavaScript() && js.trim()) {
      files.set('assets/app.js', this.minifyJS(js));
    }

    return files;
  }

  /**
   * Basic CSS minification
   */
  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*{\s*/g, '{') // Remove spaces around braces
      .replace(/\s*}\s*/g, '}') // Remove spaces around braces
      .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
      .replace(/\s*:\s*/g, ':') // Remove spaces around colons
      .replace(/\s*,\s*/g, ',') // Remove spaces around commas
      .trim();
  }

  /**
   * Basic JavaScript minification
   */
  private minifyJS(js: string): string {
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*{\s*/g, '{') // Remove spaces around braces
      .replace(/\s*}\s*/g, '}') // Remove spaces around braces
      .replace(/\s*\(\s*/g, '(') // Remove spaces around parentheses
      .replace(/\s*\)\s*/g, ')') // Remove spaces around parentheses
      .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
      .replace(/\s*=\s*/g, '=') // Remove spaces around equals
      .replace(/\s*,\s*/g, ',') // Remove spaces around commas
      .trim();
  }

  /**
   * Estimates bundle size in KB
   */
  private estimateBundleSize(): number {
    let size = 0;

    // Base HTML size
    size += this.generateHTML().length * 0.5; // Rough compression estimate

    // CSS size
    size += this.context.ast.style.content.length;

    // JS size
    if (this.needsJavaScript()) {
      size += this.generateJavaScript().length;
    }

    // Convert to KB
    return Math.round(size / 1024);
  }
}

/**
 * Convenience function for code generation
 */
export async function generateCode(context: CompilationContext): Promise<CompilationResult> {
  const generator = new CodeGenerator(context);
  return generator.generate();
}
