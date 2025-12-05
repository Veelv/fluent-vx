import { AST } from '../parser/ast';
import { ReactivityGraph } from '../reactivity/graph';
import { generateCSS } from './css-generator';
import { generateView } from './html-generator';

export interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

/**
 * Generates optimized code from AST and reactivity graph.
 */
export function generateCode(ast: AST, reactivity: ReactivityGraph): GeneratedCode {
  const css = generateCSS(ast);
  const { html, js } = generateView(ast.view.children, reactivity);

  return { html, css, js };
}