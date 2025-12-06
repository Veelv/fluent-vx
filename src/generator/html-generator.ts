import { ViewNode, ElementNode, Attribute, DirectiveNode, InterpolationNode, TextNode, AST } from '../parser/ast';
import { ReactivityGraph } from '../reactivity/graph';

/**
 * Generates HTML and JS from #view block.
 */
export function generateView(nodes: ViewNode[], reactivity: ReactivityGraph, ast?: AST): { html: string; js: string } {
  let html = '';
  let js = '';

  for (const node of nodes) {
    const result = generateNode(node, reactivity, ast);
    html += result.html;
    js += result.js;
  }

  return { html, js };
}

/**
 * Generates code for a single view node.
 */
function generateNode(node: ViewNode, reactivity: ReactivityGraph, ast?: AST): { html: string; js: string } {
  switch (node.type) {
    case 'element':
      return generateElement(node, reactivity, ast);
    case 'directive':
      return generateDirective(node, reactivity, ast);
    case 'interpolation':
      return generateInterpolation(node, reactivity, ast);
    case 'text':
      return { html: node.content, js: '' };
    default:
      return { html: '', js: '' };
  }
}

/**
 * Generates HTML/JS for an element.
 */
function generateElement(element: ElementNode, reactivity: ReactivityGraph, ast?: AST): { html: string; js: string } {
  let html = `<${element.tag}`;
  let js = '';

  for (const attr of element.attributes) {
    if (attr.name.startsWith('@')) {
      // Event handler - add onclick or other event attributes
      const eventName = attr.name.slice(1);
      if (attr.value) {
        if (eventName === 'click') {
          html += ` onclick="${attr.value.code.replace(/"/g, '"')}"`;
        } else {
          js += `element.addEventListener('${eventName}', function() { ${attr.value.code} });`;
        }
      }
    } else if (attr.name.startsWith(':')) {
      // Dynamic attribute
      const attrName = attr.name.slice(1);
      if (attr.value) {
        js += `element.setAttribute('${attrName}', ${attr.value.code});`;
        // Add reactivity update
        const deps = extractDependencies(attr.value);
        for (const dep of deps) {
          if (reactivity.variables.has(dep)) {
            js += `// Reactive update for ${dep} -> ${attrName}`;
          }
        }
      }
    } else {
      // Static attribute
      if (attr.value) {
        html += ` ${attr.name}="${attr.value.code.replace(/"/g, '"')}"`;
      } else {
        html += ` ${attr.name}`;
      }
    }
  }

  html += '>';

  if (!element.selfClosing) {
    const children = generateView(element.children, reactivity, ast);
    html += children.html;
    js += children.js;
    html += `</${element.tag}>`;
  }

  return { html, js };
}

/**
 * Generates HTML/JS for a directive.
 */
function generateDirective(directive: DirectiveNode, reactivity: ReactivityGraph, ast?: AST): { html: string; js: string } {
  let html = '';
  let js = '';

  if (directive.name === 'if' && directive.condition) {
    // For static generation, evaluate condition if possible
    if (ast) {
      const conditionValue = evaluateStaticCondition(directive.condition.code, ast);
      if (conditionValue) {
        const children = generateView(directive.children, reactivity, ast);
        html += children.html;
        js += children.js;
      }
      // If condition is false, don't include HTML
    } else {
      // Fallback to runtime evaluation
      js += `if (${directive.condition.code}) {`;
      const children = generateView(directive.children, reactivity, ast);
      html += children.html;
      js += children.js;
      js += `}`;
    }
  } else if (directive.name === 'for' && directive.iterable) {
    // For static generation, evaluate iterable if possible
    if (ast) {
      const iterableValue = evaluateStaticIterable(directive.iterable.code, ast);
      if (Array.isArray(iterableValue)) {
        const iterator = directive.iterator || 'item';
        for (const item of iterableValue) {
          // Create a temporary context with the iterator variable
          const tempAst = { ...ast };
          if (!tempAst.data) tempAst.data = { type: 'data', variables: [] };
          tempAst.data.variables.push({
            name: iterator,
            value: { type: 'expression', code: JSON.stringify(item) }
          });

          const children = generateView(directive.children, reactivity, tempAst);
          html += children.html;
          js += children.js;
        }
      } else {
        // If can't evaluate statically, generate runtime code
        const iterator = directive.iterator || 'item';
        js += `for (const ${iterator} of ${directive.iterable.code}) {`;
        const children = generateView(directive.children, reactivity, ast);
        html += children.html;
        js += children.js;
        js += `}`;
      }
    } else {
      // Fallback to runtime evaluation
      const iterator = directive.iterator || 'item';
      js += `for (const ${iterator} of ${directive.iterable.code}) {`;
      const children = generateView(directive.children, reactivity, ast);
      html += children.html;
      js += children.js;
      js += `}`;
    }
  }
  // @slot not implemented in generation yet

  return { html, js };
}

/**
 * Evaluate static conditions for @if
 */
function evaluateStaticCondition(code: string, ast: AST): boolean {
  const trimmedCode = code.trim();

  // Simple evaluations
  if (trimmedCode === 'true') return true;
  if (trimmedCode === 'false') return false;

  // Check data variables
  const dataVar = ast.data.variables.find(v => v.name === trimmedCode);
  if (dataVar) {
    const value = dataVar.value.code.trim();
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === '0') return false;
    return !!value;
  }

  return false; // Default to false for safety
}

/**
 * Evaluate static iterables for @for
 */
function evaluateStaticIterable(code: string, ast: AST): any[] {
  const trimmedCode = code.trim();

  // Check data variables
  const dataVar = ast.data.variables.find(v => v.name === trimmedCode);
  if (dataVar) {
    const value = dataVar.value.code.trim();
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Try to parse the code directly if it's an array literal
  try {
    const parsed = JSON.parse(trimmedCode);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Generates HTML/JS for an interpolation.
 */
function generateInterpolation(interpolation: InterpolationNode, reactivity: ReactivityGraph, ast?: AST): { html: string; js: string } {
  const deps = extractDependencies(interpolation.expression);
  let html = '';
  let js = '';

  // Try to evaluate static value from AST data
  if (ast) {
    const staticValue = evaluateStaticExpression(interpolation.expression.code, ast);
    if (staticValue !== null) {
      html = `<span>${staticValue}</span>`;
    } else {
      html = `<span>${interpolation.expression.code}</span>`;
    }
  } else {
    html = `<span>${interpolation.expression.code}</span>`;
  }

  // Add reactivity updates
  for (const dep of deps) {
    if (reactivity.variables.has(dep)) {
      js += `// Update interpolation for ${dep}`;
    }
  }

  return { html, js };
}

/**
 * Evaluate static expressions from AST data
 */
function evaluateStaticExpression(code: string, ast: AST): string | null {
  const trimmedCode = code.trim();

  // Find variable in data block
  const variable = ast.data.variables.find(v => v.name === trimmedCode);
  if (variable) {
    const value = variable.value.code.trim();

    // Handle string literals
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    // Handle number literals
    if (!isNaN(Number(value))) {
      return value;
    }

    // Handle boolean literals
    if (value === 'true') return 'true';
    if (value === 'false') return 'false';

    // Handle array literals (basic)
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const array = JSON.parse(value);
        return array.join(', ');
      } catch {
        return value;
      }
    }

    return value;
  }

  return null;
}

/**
 * Simple dependency extraction (reuse from reactivity).
 */
function extractDependencies(expression: { code: string }): string[] {
  const deps: string[] = [];
  const identifierRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  let match;
  while ((match = identifierRegex.exec(expression.code)) !== null) {
    const id = match[0];
    if (!['if', 'for', 'in', 'true', 'false', 'null', 'undefined'].includes(id)) {
      deps.push(id);
    }
  }
  return [...new Set(deps)];
}