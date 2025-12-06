// Fluent VX Reactivity Detection System
// Analyzes AST to detect reactive variables and dependencies

import { AST, ViewNode, ElementNode, Attribute, DirectiveNode, InterpolationNode, Expression } from '../parser/ast';
import { ReactivityGraph, ReactiveVariable } from './graph';

/**
 * Analyzes the AST to build a reactivity graph.
 * Detects reactive variables and their dependencies.
 */
export function detectReactivity(ast: AST): ReactivityGraph {
  const variables = new Map<string, ReactiveVariable>();

  // Initialize variables from #data
  for (const variable of ast.data.variables) {
    variables.set(variable.name, {
      name: variable.name,
      dependencies: [],
      usedIn: ['data']
    });
  }

  // Analyze #view for usages
  analyzeView(ast.view.children, variables);

  return {
    variables,
    addVariable(name: string, value: any) {
      variables.set(name, {
        name,
        dependencies: [],
        usedIn: ['data']
      });
    },
    getVariable(name: string) {
      return variables.get(name);
    }
  };
}

/**
 * Recursively analyzes view nodes for variable usages.
 */
function analyzeView(nodes: ViewNode[], variables: Map<string, ReactiveVariable>): void {
  for (const node of nodes) {
    switch (node.type) {
      case 'element':
        analyzeElement(node, variables);
        break;
      case 'directive':
        analyzeDirective(node, variables);
        break;
      case 'interpolation':
        analyzeInterpolation(node, variables);
        break;
      // Other node types don't directly use variables
    }
  }
}

/**
 * Analyzes an element for reactive attributes and children.
 */
function analyzeElement(element: ElementNode, variables: Map<string, ReactiveVariable>): void {
  // Check attributes for variable usage
  for (const attr of element.attributes) {
    if (attr.value) {
      const deps = extractDependencies(attr.value);
      for (const dep of deps) {
        if (variables.has(dep)) {
          variables.get(dep)!.usedIn.push('view');
        }
      }
    }
  }

  // Analyze children
  analyzeView(element.children, variables);
}

/**
 * Analyzes a directive for reactive conditions and children.
 */
function analyzeDirective(directive: DirectiveNode, variables: Map<string, ReactiveVariable>): void {
  // Check condition
  if (directive.condition) {
    const deps = extractDependencies(directive.condition);
    for (const dep of deps) {
      if (variables.has(dep)) {
        variables.get(dep)!.usedIn.push('view');
      }
    }
  }

  // Check iterable for @for
  if (directive.iterable) {
    const deps = extractDependencies(directive.iterable);
    for (const dep of deps) {
      if (variables.has(dep)) {
        variables.get(dep)!.usedIn.push('view');
      }
    }
  }

  // Analyze children
  analyzeView(directive.children, variables);
}

/**
 * Analyzes an interpolation for variable usage.
 */
function analyzeInterpolation(interpolation: InterpolationNode, variables: Map<string, ReactiveVariable>): void {
  const deps = extractDependencies(interpolation.expression);
  for (const dep of deps) {
    if (variables.has(dep)) {
      variables.get(dep)!.usedIn.push('view');
    }
  }
}

/**
 * Extracts variable dependencies from an expression.
 * Simple implementation: looks for identifiers in the code.
 */
function extractDependencies(expression: Expression): string[] {
  const deps: string[] = [];
  // Simple regex to find identifiers (not perfect, but for basic cases)
  const identifierRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  let match;
  while ((match = identifierRegex.exec(expression.code)) !== null) {
    const id = match[0];
    // Skip keywords and built-ins
    if (!['if', 'for', 'in', 'true', 'false', 'null', 'undefined'].includes(id)) {
      deps.push(id);
    }
  }
  return [...new Set(deps)]; // Remove duplicates
}