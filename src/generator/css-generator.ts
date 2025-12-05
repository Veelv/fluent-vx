import { AST } from '../parser/ast';

/**
 * Generates CSS from #style block.
 */
export function generateCSS(ast: AST): string {
  return ast.style.content;
}