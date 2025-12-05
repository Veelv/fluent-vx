import { AST, DataBlock, StyleBlock, ScriptBlock, ViewBlock, Variable, ViewNode, ElementNode, Attribute, DirectiveNode, InterpolationNode, TextNode, CommentNode, Expression, ServerAction, Parameter, Token, TokenType } from './ast';
import { Lexer } from './lexer';

/**
 * Parser class that implements a recursive descent parser for .vx files.
 * Builds an AST from the token stream produced by the Lexer.
 */
export class Parser {
  private tokens: Token[] = [];
  private position: number = 0;

  /**
   * Parses the input .vx source code into an AST.
    * @param input The raw .vx file content
    * @returns The complete AST
    */
   parse(input: string): AST {
     // Tokenize the input
     const lexer = new Lexer(input);
     this.tokens = lexer.tokenize();
     this.position = 0;

     // Parse each block in order
     const data = this.tryParseDataBlock();
     const style = this.tryParseStyleBlock();
     const view = this.parseViewBlock();
     const script = this.tryParseScriptBlock();
     const serverActions = this.tryParseServerActionsBlock();

     return { data, style, view, script, serverActions };
   }

  private currentToken(): Token {
    if (this.position >= this.tokens.length) {
      return { type: TokenType.EOF, value: '', line: 0, column: 0 };
    }
    return this.tokens[this.position];
  }

  private consume(type: TokenType): Token {
    const token = this.currentToken();
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type} at line ${token.line}, column ${token.column}`);
    }
    this.position++;
    return token;
  }

  private peek(offset: number = 1): Token {
    return this.tokens[this.position + offset];
  }

  /**
   * Parses the #data block containing reactive variables.
   * @returns The parsed DataBlock AST node
   */
  /**
   * Parses the #data block containing reactive variables.
   * For this prototype, we collect the raw content and parse it simply.
   * @returns The parsed DataBlock AST node
   */
  private parseDataBlock(): DataBlock {
    // Skip any leading comments
    while (this.currentToken().type === TokenType.COMMENT) {
      this.position++;
    }

    // Consume #data
    this.consume(TokenType.HASH);
    this.consumeIdentifier('data');

    // Parse variables directly from tokens
    const variables: Variable[] = [];

    while (this.position < this.tokens.length) {
      const token = this.currentToken();

      if (token.type === TokenType.HASH &&
          this.position + 2 < this.tokens.length &&
          this.tokens[this.position + 1].value === 'end' &&
          this.tokens[this.position + 2].value === 'data') {
        break; // Found #end data
      }

      // Skip comments
      if (token.type === TokenType.COMMENT) {
        this.position++;
        continue;
      }

      // Parse variable declaration: identifier = expression
      if (token.type === TokenType.IDENTIFIER) {
        const varName = token.value;
        this.position++;

        // Expect equals
        this.consume(TokenType.EQUALS);

        // Parse the value expression
        const value = this.parseDataValue();

        variables.push({ name: varName, value });
      } else {
        this.position++; // Skip unexpected tokens
      }
    }

    // Consume #end data
    this.consume(TokenType.HASH);
    this.consumeIdentifier('end');
    this.consumeIdentifier('data');

    return { type: 'data', variables };
  }

  private tryParseDataBlock(): DataBlock {
    // Skip leading comments
    while (this.currentToken().type === TokenType.COMMENT) {
      this.position++;
    }

    if (this.currentToken().type === TokenType.HASH && this.peek().value === 'data') {
      return this.parseDataBlock();
    }
    return { type: 'data', variables: [] };
  }


  private parseStyleBlock(): StyleBlock {
    this.consume(TokenType.HASH);
    this.consumeIdentifier('style');
    let content = '';

    // Collect all content until #end style as raw text
    const startPos = this.position;
    while (this.position < this.tokens.length) {
      const token = this.currentToken();
      if (token.type === TokenType.HASH &&
          this.position + 2 < this.tokens.length &&
          this.tokens[this.position + 1].value === 'end' &&
          this.tokens[this.position + 2].value === 'style') {
        break;
      }
      content += token.value;
      this.position++;
    }

    this.consume(TokenType.HASH);
    this.consumeIdentifier('end');
    this.consumeIdentifier('style');

    return { type: 'style', content: content.trim() };
  }

  private tryParseStyleBlock(): StyleBlock {
    // Skip leading comments
    while (this.currentToken().type === TokenType.COMMENT) {
      this.position++;
    }

    if (this.currentToken().type === TokenType.HASH && this.peek().value === 'style') {
      return this.parseStyleBlock();
    }
    return { type: 'style', content: '' };
  }

  private parseScriptBlock(): ScriptBlock {
    this.consume(TokenType.HASH);
    this.consumeIdentifier('script');
    let content = '';

    // Collect all content until #end script as raw text
    const startPos = this.position;
    while (this.position < this.tokens.length) {
      const token = this.currentToken();
      if (token.type === TokenType.HASH &&
          this.position + 2 < this.tokens.length &&
          this.tokens[this.position + 1].value === 'end' &&
          this.tokens[this.position + 2].value === 'script') {
        break;
      }
      content += token.value;
      this.position++;
    }

    this.consume(TokenType.HASH);
    this.consumeIdentifier('end');
    this.consumeIdentifier('script');

    return { type: 'script', content: content.trim() };
  }

  private tryParseScriptBlock(): ScriptBlock {
    // Skip leading comments
    while (this.currentToken().type === TokenType.COMMENT) {
      this.position++;
    }

    if (this.currentToken().type === TokenType.HASH && this.peek().value === 'script') {
      return this.parseScriptBlock();
    }
    return { type: 'script', content: '' };
  }

  /**
   * Parses the #view block containing the template structure.
   * @returns The parsed ViewBlock AST node
   */
  private parseViewBlock(): ViewBlock {
    // Skip any leading comments
    while (this.currentToken().type === TokenType.COMMENT) {
      this.position++;
    }

    // Consume #view
    this.consume(TokenType.HASH);
    this.consumeIdentifier('view');
    // Parse child nodes
    const children = this.parseViewNodes();

    // Consume #end view
    this.consume(TokenType.HASH);
    this.consumeIdentifier('end');
    this.consumeIdentifier('view');

    return { type: 'view', children };
  }

  /**
   * Parses a list of view nodes until a block end or closing tag.
   * @returns Array of ViewNode AST nodes
   */
  private parseViewNodes(): ViewNode[] {
    const nodes: ViewNode[] = [];

    while (this.currentToken().type !== TokenType.HASH && !(this.currentToken().type === TokenType.LT && this.peek().type === TokenType.SLASH)) {
      if (this.currentToken().type === TokenType.LT) {
        nodes.push(this.parseElement());
      } else if (this.currentToken().type === TokenType.AT) {
        nodes.push(this.parseDirective());
      } else if (this.currentToken().type === TokenType.LBRACE && this.peek().type === TokenType.LBRACE) {
        nodes.push(this.parseInterpolation());
      } else if (this.currentToken().type === TokenType.COMMENT) {
        nodes.push(this.parseComment());
      } else {
        nodes.push(this.parseText());
      }
    }

    return nodes;
  }

  /**
   * Parses an HTML-like element in the view block.
   * Handles attributes, self-closing tags, and nested children.
   * @returns The parsed ElementNode AST node
   */
  private parseElement(): ElementNode {
    // Consume opening <
    this.consume(TokenType.LT);
    const tag = this.consume(TokenType.IDENTIFIER).value;
    const attributes: Attribute[] = [];

    // Parse attributes until > or />
    while (this.currentToken().type !== TokenType.GT && this.currentToken().type !== TokenType.SLASH) {
      let attrName = '';
      let dynamic = false;

      if (this.currentToken().type === TokenType.AT) {
        this.consume(TokenType.AT);
        let eventName = this.consume(TokenType.IDENTIFIER).value;

        // Handle event modifiers like @click.prevent
        while (this.currentToken().type === TokenType.DOT) {
          this.consume(TokenType.DOT);
          eventName += '.' + this.consume(TokenType.IDENTIFIER).value;
        }

        attrName = '@' + eventName;
        dynamic = true; // Event attributes are dynamic
      } else if (this.currentToken().type === TokenType.COLON) {
        this.consume(TokenType.COLON);
        attrName = ':' + this.consume(TokenType.IDENTIFIER).value;
        dynamic = true; // Binding attributes are dynamic
      } else {
        attrName = this.consume(TokenType.IDENTIFIER).value;
      }

      let value: Expression | undefined;

      if (this.currentToken().type === TokenType.EQUALS) {
        this.consume(TokenType.EQUALS);
        if (this.currentToken().type === TokenType.STRING) {
          // Static string attribute
          value = { type: 'expression', code: this.consume(TokenType.STRING).value };
        } else if (this.currentToken().type === TokenType.LBRACE) {
          // Dynamic expression attribute
          value = this.parseExpression();
        } else {
          // For dynamic attributes, value can be expression
          value = this.parseExpression();
        }
      }

      attributes.push({ name: attrName, value, dynamic });
    }

    // Check for self-closing tag or naturally self-closing elements
    let selfClosing = this.currentToken().type === TokenType.SLASH;
    if (selfClosing) {
      this.consume(TokenType.SLASH);
    }

    // Some elements are naturally self-closing
    const selfClosingTags = ['br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'track', 'area', 'base', 'col', 'embed', 'param', 'wbr'];
    if (selfClosingTags.includes(tag.toLowerCase())) {
      selfClosing = true;
    }

    this.consume(TokenType.GT);

    // Parse children if not self-closing
    const children = selfClosing ? [] : this.parseViewNodes();

    // Consume closing tag if not self-closing
    if (!selfClosing) {
      this.consume(TokenType.LT);
      this.consume(TokenType.SLASH);
      this.consumeIdentifier(tag);
      this.consume(TokenType.GT);
    }

    return { type: 'element', tag, attributes, children, selfClosing };
  }

  /**
   * Parses a directive like @if or @for.
   * @returns The parsed DirectiveNode AST node
   */
  private parseDirective(): DirectiveNode {
    this.consume(TokenType.AT);
    let name = this.consume(TokenType.IDENTIFIER).value;

    // Handle @else if
    if (name === 'else' && this.currentToken().type === TokenType.IDENTIFIER && this.currentToken().value === 'if') {
      this.consume(TokenType.IDENTIFIER); // consume 'if'
      name = 'else-if';
    }

    let condition: Expression | undefined;
    let iterator: string | undefined;
    let iterable: Expression | undefined;

    if (name === 'if' || name === 'else-if' || name === 'for' || name === 'slot') {
      this.consume(TokenType.LPAREN);
      if (name === 'if' || name === 'else-if') {
        condition = this.parseExpression();
      } else if (name === 'for') {
        iterator = this.consume(TokenType.IDENTIFIER).value;
        this.consumeIdentifier('in');
        iterable = this.parseExpression();
      } else if (name === 'slot') {
        condition = this.parseExpression(); // slot name
      }

      if (this.currentToken().type === TokenType.RPAREN) {
        this.consume(TokenType.RPAREN);
      }
    }

    // Only @if and @for have their own @end blocks
    // @else-if and @else are handled as part of the @if structure
    let children: ViewNode[] = [];
    if (name === 'if' || name === 'for') {
      children = this.parseViewNodesUntilEnd(name);
    }
    // For else-if and else, children will be empty as they don't have their own blocks

    return { type: 'directive', name, condition, iterator, iterable, children };
  }

  /**
   * Parses view nodes until @end directiveName.
   * @param directiveName The name of the directive to end
   * @returns Array of ViewNode AST nodes
   */
  private parseViewNodesUntilEnd(directiveName: string): ViewNode[] {
    const nodes: ViewNode[] = [];

    while (this.currentToken().type !== TokenType.EOF &&
           !(this.currentToken().type === TokenType.AT && this.peek().type === TokenType.IDENTIFIER && this.peek().value === 'end')) {
      if (this.currentToken().type === TokenType.LT) {
        nodes.push(this.parseElement());
      } else if (this.currentToken().type === TokenType.AT) {
        nodes.push(this.parseDirective());
      } else if (this.currentToken().type === TokenType.LBRACE && this.peek().type === TokenType.LBRACE) {
        nodes.push(this.parseInterpolation());
      } else if (this.currentToken().type === TokenType.COMMENT) {
        nodes.push(this.parseComment());
      } else if (this.currentToken().type !== TokenType.EOF) {
        nodes.push(this.parseText());
      } else {
        break;
      }
    }

    // Consume @end directiveName if not at EOF
    if (this.currentToken().type === TokenType.AT) {
      this.consume(TokenType.AT);
      this.consumeIdentifier('end');

      // Handle compound directive names like 'else-if'
      if (directiveName === 'else-if') {
        this.consumeIdentifier('else');
        this.consumeIdentifier('if');
      } else {
        this.consumeIdentifier(directiveName);
      }
    }

    return nodes;
  }

  private parseInterpolation(): InterpolationNode {
    this.consume(TokenType.LBRACE);
    this.consume(TokenType.LBRACE);
    // Consume expression until }}
    let code = '';
    let braceCount = 0; // Start from 0, since {{ are consumed
    while (this.position < this.tokens.length) {
      const token = this.currentToken();
      if (token.type === TokenType.LBRACE) {
        braceCount++;
        code += token.value;
      } else if (token.type === TokenType.RBRACE) {
        braceCount--;
        if (braceCount < 0) {
          // This is the closing }}
          this.consume(TokenType.RBRACE);
          this.consume(TokenType.RBRACE);
          break;
        } else {
          code += token.value;
        }
      } else {
        code += token.value;
      }
      this.position++;
    }

    const expression = { type: 'expression' as const, code: code.trim() };
    return { type: 'interpolation', expression };
  }

  private parseServerActionsBlock(): ServerAction[] {
    const actions: ServerAction[] = [];

    // Parse all @server blocks until end of file or other blocks
    while (this.position < this.tokens.length && this.currentToken().type !== TokenType.HASH) {
      if (this.currentToken().type === TokenType.AT && this.peek().value === 'server') {
        actions.push(this.parseServerAction());
      } else {
        this.position++; // Skip other content
      }
    }

    return actions;
  }

  private parseServerAction(): ServerAction {
    this.consume(TokenType.AT);
    this.consumeIdentifier('server');

    // Parse function declaration
    this.consumeIdentifier('function');
    const isAsync = this.currentToken().value === 'async';
    if (isAsync) {
      this.consumeIdentifier('async');
    }
    const name = this.consume(TokenType.IDENTIFIER).value;

    this.consume(TokenType.LPAREN);
    const params: Parameter[] = [];
    while (this.currentToken().type !== TokenType.RPAREN) {
      if (this.currentToken().type === TokenType.IDENTIFIER) {
        const paramName = this.consume(TokenType.IDENTIFIER).value;
        let paramType: string | undefined;
        if (this.currentToken().type === TokenType.COLON) {
          this.consume(TokenType.COLON);
          paramType = this.parseType();
        }
        params.push({ name: paramName, type: paramType });
      }
      if (this.currentToken().type === TokenType.COMMA) {
        this.consume(TokenType.COMMA);
      }
    }
    this.consume(TokenType.RPAREN);

    let returnType: string | undefined;
    if (this.currentToken().type === TokenType.COLON) {
      this.consume(TokenType.COLON);
      returnType = this.parseType();
    }

    this.consume(TokenType.LBRACE);
    let body = '';
    let braceCount = 1;
    while (braceCount > 0 && this.position < this.tokens.length) {
      const token = this.currentToken();
      if (token.type === TokenType.LBRACE) {
        braceCount++;
      } else if (token.type === TokenType.RBRACE) {
        braceCount--;
        if (braceCount === 0) break;
      }
      body += token.value;
      this.position++;
    }
    this.consume(TokenType.RBRACE);

    this.consume(TokenType.AT);
    this.consumeIdentifier('end');
    this.consumeIdentifier('server');

    return {
      type: 'serverAction',
      name,
      params,
      returnType,
      isAsync,
      body: body.trim(),
      endpoint: `/api/actions/${name}`
    };
  }

  private parseType(): string {
    let type = '';
    while (this.currentToken().type === TokenType.IDENTIFIER ||
           this.currentToken().type === TokenType.LT ||
           this.currentToken().type === TokenType.GT ||
           this.currentToken().type === TokenType.LBRACKET ||
           this.currentToken().type === TokenType.RBRACKET) {
      type += this.currentToken().value;
      this.position++;
    }
    return type;
  }

  private tryParseServerActionsBlock(): ServerAction[] {
    // Server actions are parsed from the view block, so return empty for now
    return [];
  }

  private parseComment(): CommentNode {
    const content = this.consume(TokenType.COMMENT).value;
    return { type: 'comment', content };
  }

  private parseText(): TextNode {
    let content = '';
    while (this.currentToken().type !== TokenType.LT && this.currentToken().type !== TokenType.AT && this.currentToken().type !== TokenType.LBRACE && this.currentToken().type !== TokenType.HASH) {
      content += this.currentToken().value;
      this.position++;
    }
    return { type: 'text', content: content.trim() };
  }

  /**
   * Parses a simple expression for variable values and attributes.
   * For now, handles literals and basic expressions.
   * @returns The parsed Expression AST node
   */
  private parseExpression(): Expression {
    let code = '';
    const startToken = this.currentToken();

    if (startToken.type === TokenType.STRING) {
      code = this.consume(TokenType.STRING).value;
    } else if (startToken.type === TokenType.NUMBER) {
      code = this.consume(TokenType.NUMBER).value;
    } else if (startToken.type === TokenType.IDENTIFIER) {
      // For expressions like count < 5, consume until RPAREN or end of expression
      while (this.position < this.tokens.length && this.currentToken().type !== TokenType.RPAREN && this.currentToken().type !== TokenType.COMMA) {
        code += this.currentToken().value;
        this.position++;
      }
    } else if (startToken.type === TokenType.LBRACKET) {
      // Array literal
      this.consume(TokenType.LBRACKET);
      code = '[';
      let depth = 1;
      while (this.position < this.tokens.length && depth > 0) {
        const token = this.currentToken();
        if (token.type === TokenType.LBRACKET) {
          depth++;
        } else if (token.type === TokenType.RBRACKET) {
          depth--;
          if (depth === 0) {
            code += ']';
            this.position++;
            break;
          }
        }
        code += token.value;
        this.position++;
      }
    } else if (startToken.type === TokenType.LBRACE) {
      // Object literal or complex expression
      if (this.peek().type === TokenType.IDENTIFIER || this.peek().type === TokenType.STRING) {
        // Object literal
        this.consume(TokenType.LBRACE);
        code = '{';
        let depth = 1;
        while (this.position < this.tokens.length && depth > 0) {
          const token = this.currentToken();
          if (token.type === TokenType.LBRACE) {
            depth++;
          } else if (token.type === TokenType.RBRACE) {
            depth--;
            if (depth === 0) {
              code += '}';
              this.position++;
              break;
            }
          }
          code += token.value;
          this.position++;
        }
      } else {
        // Complex expression in braces
        this.consume(TokenType.LBRACE);
        let depth = 1;
        while (this.position < this.tokens.length && depth > 0) {
          const token = this.currentToken();
          if (token.type === TokenType.LBRACE) {
            depth++;
          } else if (token.type === TokenType.RBRACE) {
            depth--;
            if (depth === 0) {
              this.position++;
              break;
            }
          }
          code += token.value;
          this.position++;
        }
      }
    } else {
      // Fallback for other expressions
      code = this.currentToken().value;
      this.position++;
    }

    return { type: 'expression', code: code.trim() };
  }

  private consumeIdentifier(value: string): Token {
    const token = this.consume(TokenType.IDENTIFIER);
    if (token.value !== value) {
      throw new Error(`Expected identifier '${value}', got '${token.value}'`);
    }
    return token;
  }

  /**
   * Parses a data value (string, number, array, object, or expression)
   */
  private parseDataValue(): Expression {
    // For data values, collect everything until newline or #end data
    let code = '';

    while (this.position < this.tokens.length) {
      const token = this.currentToken();

      // Stop at #end data
      if (token.type === TokenType.HASH &&
          this.position + 2 < this.tokens.length &&
          this.tokens[this.position + 1].value === 'end' &&
          this.tokens[this.position + 2].value === 'data') {
        break;
      }

      // Stop at newline (end of variable declaration)
      if (token.type === TokenType.EOF || (token.value === '\n' && code.trim() !== '')) {
        break;
      }

      // Stop at next identifier (end of current expression)
      if (token.type === TokenType.IDENTIFIER) {
        break;
      }

      code += token.value;
      this.position++;
    }

    return { type: 'expression', code: code.trim() };
  }
}

