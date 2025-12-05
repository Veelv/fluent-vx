export interface Location {
  line: number;
  column: number;
}

// AST definitions for Fluent VX
// This module defines the Abstract Syntax Tree structures used to represent parsed .vx files.

export interface ASTNode {
  location: Location;
}

/**
 * The root AST node representing a complete .vx file.
 */
export interface AST {
  /** The data block containing reactive variables */
  data: DataBlock;
  /** The style block containing CSS */
  style: StyleBlock;
  /** The view block containing the template */
  view: ViewBlock;
  /** The script block containing JavaScript */
  script: ScriptBlock;
  /** Server actions for form handling */
  serverActions: ServerAction[];
}

export interface DataBlock {
  type: 'data';
  variables: Variable[];
}

export interface Variable {
  name: string;
  value: Expression;
}

export interface StyleBlock {
  type: 'style';
  content: string;
}

export interface ScriptBlock {
  type: 'script';
  content: string;
}

export interface ViewBlock {
  type: 'view';
  children: ViewNode[];
}

export type ViewNode =
  | TextNode
  | ElementNode
  | DirectiveNode
  | InterpolationNode
  | CommentNode;

export interface TextNode {
  type: 'text';
  content: string;
}

export interface ElementNode {
  type: 'element';
  tag: string;
  attributes: Attribute[];
  children: ViewNode[];
  selfClosing?: boolean;
}

export interface Attribute {
  name: string;
  value?: Expression;
  dynamic?: boolean; // for @click etc.
}

export interface DirectiveNode {
  type: 'directive';
  name: string; // 'if', 'for', 'else'
  condition?: Expression;
  iterator?: string;
  iterable?: Expression;
  children: ViewNode[];
}

export interface InterpolationNode {
  type: 'interpolation';
  expression: Expression;
}

export interface CommentNode {
  type: 'comment';
  content: string;
}

export interface ServerAction {
  type: 'serverAction';
  name: string;
  params: Parameter[];
  returnType?: string;
  isAsync: boolean;
  body: string;
  endpoint: string;
}

export interface Parameter {
  name: string;
  type?: string;
}

export interface Expression {
  type: 'expression';
  code: string;
}

// Token types for lexer
export enum TokenType {
  HASH = 'HASH',
  IDENTIFIER = 'IDENTIFIER',
  EQUALS = 'EQUALS',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LT = 'LT',
  GT = 'GT',
  SLASH = 'SLASH',
  AT = 'AT',
  DOT = 'DOT',
  COMMA = 'COMMA',
  COLON = 'COLON',
  SEMICOLON = 'SEMICOLON',
  EOF = 'EOF',
  COMMENT = 'COMMENT',
  TEXT = 'TEXT'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}