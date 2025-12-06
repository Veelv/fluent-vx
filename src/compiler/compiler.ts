// Fluent VX Compiler
// Professional compilation using unified HTML generation system

import { AST } from '../parser/ast';
import { ReactivityGraph } from '../reactivity/graph';

export interface CompilationResult {
  html: string;
  css: string;
  js: string;
  metadata: {
    hasReactivity: boolean;
    hasDirectives: boolean;
    hasInteractivity: boolean;
  };
}

export class Compiler {
  private ast: AST;

  constructor(ast: AST) {
    this.ast = ast;
  }

  async compile(): Promise<CompilationResult> {
    // Use professional HTML generation system
    const { ReactivityGraphImpl } = await import('../reactivity/graph');
    const reactivityGraph = new ReactivityGraphImpl();

    // Add data variables to reactivity graph
    for (const variable of this.ast.data.variables) {
      reactivityGraph.addVariable(variable.name, variable.value);
    }

    // Generate HTML using professional system
    const { generateView } = await import('../generator/html-generator');
    const { html, js: viewJs } = generateView(this.ast.view.children, reactivityGraph, this.ast);

    // Generate CSS
    const { generateCSS } = await import('../generator/css-generator');
    const css = generateCSS(this.ast);

    // Generate JavaScript runtime
    const js = this.generateProfessionalJs(viewJs);

    // Analyze metadata
    const metadata = this.analyzeMetadata();

    return {
      html,
      css,
      js,
      metadata
    };
  }

  private generateProfessionalJs(viewJs: string): string {
    return `
// Fluent VX Professional Runtime
(function(){
  'use strict';

  // Reactive system
  const VX = {
    reactive: function(obj) {
      return new Proxy(obj, {
        get: function(target, prop) {
          if (typeof prop === 'string' && VX._activeEffect) {
            target._deps = target._deps || {};
            target._deps[prop] = target._deps[prop] || new Set();
            target._deps[prop].add(VX._activeEffect);
          }
          return target[prop];
        },
        set: function(target, prop, value) {
          if (target[prop] !== value) {
            target[prop] = value;
            VX.trigger(target, prop);
          }
          return true;
        }
      });
    },
    effect: function(fn) {
      VX._activeEffect = fn;
      fn();
      VX._activeEffect = null;
    },
    trigger: function(target, prop) {
      if (target._deps && target._deps[prop]) {
        target._deps[prop].forEach(fn => fn());
      }
    }
  };

  // Global reactive data
  window.VX = VX;
  window.reactiveData = VX.reactive({});

  // Initialize data from AST
  ${this.generateDataInitialization()}

  // View-specific JavaScript
  ${viewJs}

  console.log('Fluent VX Professional Runtime loaded');
})();
`;
  }

  private generateDataInitialization(): string {
    const initStatements: string[] = [];

    for (const variable of this.ast.data.variables) {
      try {
        // Try to evaluate static values
        const value = variable.value.code.trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          // String literal
          initStatements.push(`reactiveData.${variable.name} = ${value};`);
        } else if (!isNaN(Number(value))) {
          // Number literal
          initStatements.push(`reactiveData.${variable.name} = ${value};`);
        } else if (value === 'true' || value === 'false') {
          // Boolean literal
          initStatements.push(`reactiveData.${variable.name} = ${value};`);
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // Array literal
          initStatements.push(`reactiveData.${variable.name} = ${value};`);
        } else {
          // Fallback to string
          initStatements.push(`reactiveData.${variable.name} = "${value}";`);
        }
      } catch (error) {
        initStatements.push(`reactiveData.${variable.name} = "${variable.value.code}";`);
      }
    }

    return initStatements.join('\n  ');
  }

  private analyzeMetadata() {
    let hasReactivity = false;
    let hasDirectives = false;
    let hasInteractivity = false;

    // Check for reactivity in data
    hasReactivity = this.ast.data.variables.length > 0;

    // Check for directives and interactivity in view
    const checkNode = (node: any) => {
      if (node.type === 'directive') {
        hasDirectives = true;
        if (node.name === 'if' || node.name === 'for') {
          hasInteractivity = true;
        }
      } else if (node.type === 'element') {
        // Check for event handlers
        const hasEvents = node.attributes.some((attr: any) => attr.name.startsWith('@'));
        if (hasEvents) {
          hasInteractivity = true;
        }
        // Check children
        node.children.forEach(checkNode);
      }
    };

    this.ast.view.children.forEach(checkNode);

    return {
      hasReactivity,
      hasDirectives,
      hasInteractivity
    };
  }
}

/**
 * Compile a .vx AST to executable code
 */
export async function compile(ast: AST): Promise<CompilationResult> {
  const compiler = new Compiler(ast);
  return compiler.compile();
}

/**
 * Compile a .vx file from source to executable code
 */
export async function compileFile(source: string): Promise<CompilationResult> {
  const { parseVx } = await import('../parser');
  const ast = parseVx(source);
  return compile(ast);
}