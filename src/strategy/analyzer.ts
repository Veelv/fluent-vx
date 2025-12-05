// Strategy analysis logic

import { AST } from '../parser/ast';
import { RenderingStrategy, StrategyAnalysis } from './types';
import { hasDynamicData, hasUserInteractions, hasForms, hasRouting, interactivityScore } from './heuristics';

/**
 * Analyzes the AST to determine the optimal rendering strategy.
 */
export function analyzeStrategy(ast: AST): StrategyAnalysis {
  const reasons: string[] = [];

  const dynamicData = hasDynamicData(ast);
  const interactions = hasUserInteractions(ast.view.children);
  const forms = hasForms(ast.view.children);
  const routing = hasRouting(ast.view.children);
  const score = interactivityScore(ast.view.children);

  // Priority: Routing requires SPA
  if (routing) {
    reasons.push('Detected routing/navigation elements');
    return { strategy: RenderingStrategy.SPA, reasons };
  }

  // High interactivity with forms: Islands
  if (forms && score > 5) {
    reasons.push('Complex forms with high interactivity');
    return { strategy: RenderingStrategy.ISLANDS, reasons };
  }

  // Dynamic data + interactivity: Islands
  if (dynamicData && interactions) {
    reasons.push('Dynamic data with user interactions');
    return { strategy: RenderingStrategy.ISLANDS, reasons };
  }

  // Dynamic data: SSR
  if (dynamicData) {
    reasons.push('Server-side data fetching required');
    return { strategy: RenderingStrategy.SSR, reasons };
  }

  // Moderate interactivity: Islands
  if (interactions && score > 2) {
    reasons.push('Moderate to high interactivity');
    return { strategy: RenderingStrategy.ISLANDS, reasons };
  }

  // Low interactivity or static: SSG
  reasons.push('Static or low-interactivity content');
  return { strategy: RenderingStrategy.SSG, reasons };
}