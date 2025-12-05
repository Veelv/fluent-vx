// Fluent VX Strategy Selector
// Intelligent rendering strategy selection based on AST analysis

import { AST, ViewNode, ElementNode, DirectiveNode, InterpolationNode } from '../parser/ast';
import { RenderingStrategy, CompilationFeatures, CompilationContext } from './types';

/**
 * Advanced strategy selector with heuristic-based decision making
 */
export class StrategySelector {
  private heuristics: StrategyHeuristic[] = [];

  constructor() {
    this.initializeHeuristics();
  }

  /**
   * Selects the optimal rendering strategy for the given AST
   */
  selectStrategy(ast: AST, context: CompilationContext): RenderingStrategy {
    const features = this.analyzeFeatures(ast);
    context.features = features;

    // Apply heuristics in priority order
    for (const heuristic of this.heuristics) {
      const strategy = heuristic.evaluate(ast, features, context);
      if (strategy) {
        return strategy;
      }
    }

    // Fallback to SPA for complex applications
    return RenderingStrategy.SPA;
  }

  /**
   * Analyzes AST to detect features that influence strategy selection
   */
  private analyzeFeatures(ast: AST): CompilationFeatures {
    const features: CompilationFeatures = {
      reactive: false,
      events: false,
      serverActions: false,
      dynamicImports: false,
      animations: false,
      forms: false
    };

    // Check data block for reactivity
    features.reactive = ast.data.variables.some(v =>
      this.isReactiveExpression(v.value.code)
    );

    // Check view for features
    this.analyzeViewFeatures(ast.view.children, features);

    // Check server actions
    features.serverActions = ast.serverActions.length > 0;

    return features;
  }

  /**
   * Recursively analyzes view nodes for features
   */
  private analyzeViewFeatures(nodes: ViewNode[], features: CompilationFeatures): void {
    for (const node of nodes) {
      switch (node.type) {
        case 'element':
          this.analyzeElementFeatures(node, features);
          break;
        case 'directive':
          this.analyzeDirectiveFeatures(node, features);
          break;
        case 'interpolation':
          if (this.isReactiveExpression(node.expression.code)) {
            features.reactive = true;
          }
          break;
      }
    }
  }

  /**
   * Analyzes element nodes for features
   */
  private analyzeElementFeatures(element: ElementNode, features: CompilationFeatures): void {
    // Check for form elements
    if (['input', 'select', 'textarea', 'form', 'button'].includes(element.tag)) {
      features.forms = true;
    }

    // Check for event handlers
    const hasEvents = element.attributes.some(attr =>
      attr.name.startsWith('@') || attr.name.startsWith('on')
    );
    if (hasEvents) {
      features.events = true;
    }

    // Check for animations
    const hasAnimations = element.attributes.some(attr =>
      attr.name.includes('animation') || attr.name.includes('transition')
    );
    if (hasAnimations) {
      features.animations = true;
    }

    // Recursively check children
    this.analyzeViewFeatures(element.children, features);
  }

  /**
   * Analyzes directive nodes for features
   */
  private analyzeDirectiveFeatures(directive: DirectiveNode, features: CompilationFeatures): void {
    // @if and @for indicate reactivity
    if (['if', 'for'].includes(directive.name)) {
      features.reactive = true;
    }

    // Check directive expressions
    if (directive.condition && this.isReactiveExpression(directive.condition.code)) {
      features.reactive = true;
    }

    if (directive.iterable && this.isReactiveExpression(directive.iterable.code)) {
      features.reactive = true;
    }

    // Recursively check children
    this.analyzeViewFeatures(directive.children, features);
  }

  /**
   * Checks if an expression indicates reactivity
   */
  private isReactiveExpression(code: string): boolean {
    // Simple heuristic: contains variable references or function calls
    return /[a-zA-Z_$][a-zA-Z0-9_$]*\(/.test(code) ||
           /\b(count|data|props|state)\b/.test(code);
  }

  /**
   * Initializes strategy selection heuristics
   */
  private initializeHeuristics(): void {
    // Static content heuristic
    this.heuristics.push({
      name: 'static-content',
      priority: 1,
      evaluate: (ast, features) => {
        if (!features.reactive && !features.events && !features.forms) {
          return RenderingStrategy.STATIC;
        }
        return null;
      }
    });

    // Islands heuristic
    this.heuristics.push({
      name: 'islands-optimization',
      priority: 2,
      evaluate: (ast, features) => {
        if (features.events && !features.serverActions && this.hasIsolatedInteractivity(ast)) {
          return RenderingStrategy.ISLANDS;
        }
        return null;
      }
    });

    // SPA heuristic for complex apps
    this.heuristics.push({
      name: 'spa-complexity',
      priority: 3,
      evaluate: (ast, features) => {
        if (features.serverActions || features.dynamicImports || this.isHighlyInteractive(ast)) {
          return RenderingStrategy.SPA;
        }
        return null;
      }
    });

    // Hydration heuristic
    this.heuristics.push({
      name: 'hydration-default',
      priority: 4,
      evaluate: (ast, features) => {
        if (features.reactive || features.events) {
          return RenderingStrategy.HYDRATE;
        }
        return null;
      }
    });
  }

  /**
   * Checks if the AST has isolated interactive components
   */
  private hasIsolatedInteractivity(ast: AST): boolean {
    // Heuristic: count interactive elements vs total elements
    let interactiveCount = 0;
    let totalCount = 0;

    const countElements = (nodes: ViewNode[]) => {
      for (const node of nodes) {
        if (node.type === 'element') {
          totalCount++;
          if (node.attributes.some(attr => attr.name.startsWith('@'))) {
            interactiveCount++;
          }
          countElements(node.children);
        } else if (node.type === 'directive') {
          countElements(node.children);
        }
      }
    };

    countElements(ast.view.children);

    // If less than 30% of elements are interactive, consider islands
    return totalCount > 0 && (interactiveCount / totalCount) < 0.3;
  }

  /**
   * Checks if the application is highly interactive
   */
  private isHighlyInteractive(ast: AST): boolean {
    // Heuristic: multiple event handlers or complex state
    let eventCount = 0;
    let directiveCount = 0;

    const countInteractivity = (nodes: ViewNode[]) => {
      for (const node of nodes) {
        if (node.type === 'element') {
          eventCount += node.attributes.filter(attr => attr.name.startsWith('@')).length;
          countInteractivity(node.children);
        } else if (node.type === 'directive') {
          directiveCount++;
          countInteractivity(node.children);
        }
      }
    };

    countInteractivity(ast.view.children);

    return eventCount > 5 || directiveCount > 3 || ast.data.variables.length > 10;
  }
}

/**
 * Strategy selection heuristic interface
 */
interface StrategyHeuristic {
  name: string;
  priority: number;
  evaluate: (ast: AST, features: CompilationFeatures, context: CompilationContext) => RenderingStrategy | null;
}

/**
 * Convenience function for strategy selection
 */
export function selectRenderingStrategy(ast: AST, context: CompilationContext): RenderingStrategy {
  const selector = new StrategySelector();
  return selector.selectStrategy(ast, context);
}