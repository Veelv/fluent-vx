// Strategy heuristics

import { AST } from '../parser/ast';

/**
 * Checks for dynamic data patterns.
 */
export function hasDynamicData(ast: AST): boolean {
  return ast.data.variables.some(v =>
    v.value.code.includes('fetch') ||
    v.value.code.includes('Date.now') ||
    v.value.code.includes('Math.random') ||
    v.value.code.includes('localStorage') ||
    v.value.code.includes('sessionStorage')
  );
}

/**
 * Checks for user interaction elements.
 */
export function hasUserInteractions(nodes: any[]): boolean {
  for (const node of nodes) {
    if (node.type === 'element') {
      if (node.attributes.some((attr: any) => attr.name.startsWith('@'))) {
        return true;
      }
      if (hasUserInteractions(node.children)) {
        return true;
      }
    } else if (node.type === 'directive' && (node.name === 'if' || node.name === 'for')) {
      return true;
    }
  }
  return false;
}

/**
 * Checks for form elements.
 */
export function hasForms(nodes: any[]): boolean {
  for (const node of nodes) {
    if (node.type === 'element' && (node.tag === 'form' || node.tag === 'input' || node.tag === 'textarea' || node.tag === 'select')) {
      return true;
    }
    if (node.children && hasForms(node.children)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks for routing/navigation.
 */
export function hasRouting(nodes: any[]): boolean {
  // Placeholder: check for links or router components
  for (const node of nodes) {
    if (node.type === 'element' && node.tag === 'a') {
      return true;
    }
    if (node.children && hasRouting(node.children)) {
      return true;
    }
  }
  return false;
}

/**
 * Estimates interactivity score.
 */
export function interactivityScore(nodes: any[]): number {
  let score = 0;
  for (const node of nodes) {
    if (node.type === 'directive') {
      score += 2;
    } else if (node.type === 'element') {
      if (node.attributes.some((attr: any) => attr.name.startsWith('@'))) {
        score += 1;
      }
      score += interactivityScore(node.children);
    }
  }
  return score;
}