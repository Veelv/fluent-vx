// Fluent VX Compiler
// Compiles AST to executable JavaScript/HTML/CSS

import { AST } from '../parser/ast';

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

  compile(): CompilationResult {
    // Simple compilation for now
    const html = this.compileToHtml();
    const css = this.ast.style.content;
    const js = this.generateBasicJs();

    return {
      html,
      css,
      js,
      metadata: {
        hasReactivity: false,
        hasDirectives: false,
        hasInteractivity: false
      }
    };
  }

  private compileToHtml(): string {
    let html = '';

    for (const node of this.ast.view.children) {
      html += this.nodeToHtml(node);
    }

    return html;
  }

  private nodeToHtml(node: any): string {
    switch (node.type) {
      case 'text':
        return node.content;
      case 'element':
        const attrs = node.attributes.map((attr: any) =>
          `${attr.name}="${attr.value?.code || ''}"`
        ).join(' ');
        const attrStr = attrs ? ' ' + attrs : '';
        if (node.selfClosing) {
          return `<${node.tag}${attrStr} />`;
        } else {
          const children = node.children.map((child: any) => this.nodeToHtml(child)).join('');
          return `<${node.tag}${attrStr}>${children}</${node.tag}>`;
        }
      case 'interpolation':
        return `<span>${node.expression.code}</span>`;
      case 'directive':
        if (node.name === 'if' && node.condition) {
          // Simple if evaluation
          const condition = node.condition.code === 'true';
          if (condition) {
            return node.children.map((child: any) => this.nodeToHtml(child)).join('');
          }
        } else if (node.name === 'for' && node.iterable) {
          // Simple for loop
          const items = node.iterable.code;
          if (items.startsWith('[') && items.endsWith(']')) {
            const itemList = items.slice(1, -1).split(',').map((s: string) => s.trim().replace(/"/g, ''));
            let result = '';
            for (const item of itemList) {
              // Replace iterator in children
              const iteratorVar = node.iterator || 'item';
              result += node.children.map((child: any) => {
                if (child.type === 'text') {
                  return child.content.replace(new RegExp(`\\{\\{\\s*${iteratorVar}\\s*\\}\\}`, 'g'), item);
                } else if (child.type === 'interpolation' && child.expression.code === iteratorVar) {
                  return `<span>${item}</span>`;
                }
                return this.nodeToHtml(child);
              }).join('');
            }
            return result;
          }
        }
        return '';
      default:
        return '';
    }
  }

  private generateBasicJs(): string {
    return `
// Fluent VX Basic Runtime
console.log('Fluent VX app loaded');
`;
  }
}

/**
 * Compile a .vx AST to executable code
 */
export function compile(ast: AST): CompilationResult {
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