import { ViewNode, ElementNode, Attribute, DirectiveNode, InterpolationNode, TextNode } from '../parser/ast';
import { ReactivityGraph } from '../reactivity/graph';

/**
 * Generates HTML and JS from #view block.
 */
export function generateView(nodes: ViewNode[], reactivity: ReactivityGraph): { html: string; js: string } {
  let html = '';
  let js = '';

  for (const node of nodes) {
    const result = generateNode(node, reactivity);
    html += result.html;
    js += result.js;
  }

  return { html, js };
}

/**
 * Generates code for a single view node.
 */
function generateNode(node: ViewNode, reactivity: ReactivityGraph): { html: string; js: string } {
  switch (node.type) {
    case 'element':
      return generateElement(node, reactivity);
    case 'directive':
      return generateDirective(node, reactivity);
    case 'interpolation':
      return generateInterpolation(node, reactivity);
    case 'text':
      return { html: node.content, js: '' };
    default:
      return { html: '', js: '' };
  }
}

/**
 * Generates HTML/JS for an element.
 */
function generateElement(element: ElementNode, reactivity: ReactivityGraph): { html: string; js: string } {
  let html = `<${element.tag}`;
  let js = '';

  for (const attr of element.attributes) {
    if (attr.name.startsWith('@')) {
      // Event handler
      const eventName = attr.name.slice(1);
      if (attr.value) {
        js += `element.addEventListener('${eventName}', () => { ${attr.value.code} });`;
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
        html += ` ${attr.name}=${attr.value.code}`;
      } else {
        html += ` ${attr.name}`;
      }
    }
  }

  html += '>';

  if (!element.selfClosing) {
    const children = generateView(element.children, reactivity);
    html += children.html;
    js += children.js;
    html += `</${element.tag}>`;
  }

  return { html, js };
}

/**
 * Generates HTML/JS for a directive.
 */
function generateDirective(directive: DirectiveNode, reactivity: ReactivityGraph): { html: string; js: string } {
  let html = '';
  let js = '';

  if (directive.name === 'if' && directive.condition) {
    js += `if (${directive.condition.code}) {`;
    const children = generateView(directive.children, reactivity);
    html += children.html;
    js += children.js;
    js += `}`;
  } else if (directive.name === 'for' && directive.iterable) {
    const iterator = directive.iterator || 'item';
    js += `for (const ${iterator} of ${directive.iterable.code}) {`;
    const children = generateView(directive.children, reactivity);
    html += children.html;
    js += children.js;
    js += `}`;
  }
  // @slot not implemented in generation yet

  return { html, js };
}

/**
 * Generates HTML/JS for an interpolation.
 */
function generateInterpolation(interpolation: InterpolationNode, reactivity: ReactivityGraph): { html: string; js: string } {
  const deps = extractDependencies(interpolation.expression);
  let html = `<span>${interpolation.expression.code}</span>`;
  let js = '';

  // Add reactivity updates
  for (const dep of deps) {
    if (reactivity.variables.has(dep)) {
      js += `// Update interpolation for ${dep}`;
    }
  }

  return { html, js };
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