import { AST } from './ast';
import { Parser } from './parser';

/**
 * Main entry point for parsing .vx files.
 * @param content The raw string content of a .vx file
 * @returns The parsed AST representation
 */
export function parseVx(content: string): AST {
  const parser = new Parser();
  return parser.parse(content);
}

export * from './ast';