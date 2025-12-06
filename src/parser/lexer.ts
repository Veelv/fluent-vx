import { Token, TokenType } from './ast';

/**
 * Lexer class responsible for tokenizing the input .vx source code.
 * Converts the raw string input into a stream of tokens for parsing.
 */
export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  /**
   * Tokenizes the input string into a list of tokens.
   * Handles whitespace, comments, and various token types.
   */
  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      const char = this.input[this.position];

      // Handle newlines for line tracking
      if (char === '\n') {
        this.line++;
        this.column = 1;
        this.position++;
        continue;
      }

      // Skip whitespace
      if (/\s/.test(char)) {
        this.column++;
        this.position++;
        continue;
      }

      if (char === '/' && this.peek() === '/') {
        // Comment
        this.lexComment(tokens);
        continue;
      }

      if (char === '#') {
        tokens.push(this.createToken(TokenType.HASH, char));
        // Skip any whitespace after #
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
          this.position++;
          this.column++;
        }
        continue;
      }

      if (char === '=') {
        tokens.push(this.createToken(TokenType.EQUALS, char));
        continue;
      }

      if (char === '{') {
        tokens.push(this.createToken(TokenType.LBRACE, char));
        continue;
      }

      if (char === '}') {
        tokens.push(this.createToken(TokenType.RBRACE, char));
        continue;
      }

      if (char === '[') {
        tokens.push(this.createToken(TokenType.LBRACKET, char));
        continue;
      }

      if (char === ']') {
        tokens.push(this.createToken(TokenType.RBRACKET, char));
        continue;
      }

      if (char === '(') {
        tokens.push(this.createToken(TokenType.LPAREN, char));
        continue;
      }

      if (char === ')') {
        tokens.push(this.createToken(TokenType.RPAREN, char));
        continue;
      }

      if (char === '<' && this.peek() === '!' && this.peek(2) === '-' && this.peek(3) === '-') {
        // HTML comment
        this.lexHtmlComment(tokens);
        continue;
      }

      if (char === '<') {
        tokens.push(this.createToken(TokenType.LT, char));
        continue;
      }

      if (char === '>') {
        tokens.push(this.createToken(TokenType.GT, char));
        continue;
      }

      if (char === '/') {
        tokens.push(this.createToken(TokenType.SLASH, char));
        continue;
      }

      if (char === '@') {
        tokens.push(this.createToken(TokenType.AT, char));
        continue;
      }

      if (char === '.') {
        tokens.push(this.createToken(TokenType.DOT, char));
        continue;
      }

      if (char === ',') {
        tokens.push(this.createToken(TokenType.COMMA, char));
        continue;
      }

      if (char === ':') {
        tokens.push(this.createToken(TokenType.COLON, char));
        continue;
      }

      if (char === ';') {
        tokens.push(this.createToken(TokenType.SEMICOLON, char));
        continue;
      }

      if (char === '"' || char === "'") {
        tokens.push(this.lexString(char));
        continue;
      }

      if (/\d/.test(char)) {
        tokens.push(this.lexNumber());
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.lexIdentifier());
        continue;
      }

      // For view content, treat as text
      tokens.push(this.lexText());
    }

    tokens.push(this.createToken(TokenType.EOF, ''));
    return tokens;
  }

  private peek(offset: number = 1): string {
    return this.input[this.position + offset] || '';
  }

  private createToken(type: TokenType, value: string): Token {
    const token = { type, value, line: this.line, column: this.column };
    this.position += value.length;
    this.column += value.length;
    return token;
  }

  private lexComment(tokens: Token[]): void {
    let comment = '//';
    this.position += 2;
    this.column += 2;

    while (this.position < this.input.length && this.input[this.position] !== '\n') {
      comment += this.input[this.position];
      this.position++;
      this.column++;
    }

    tokens.push({ type: TokenType.COMMENT, value: comment, line: this.line, column: this.column - comment.length });
  }

  private lexHtmlComment(tokens: Token[]): void {
    let comment = '<!--';
    this.position += 4;
    this.column += 4;

    while (this.position < this.input.length) {
      if (this.input[this.position] === '-' && this.peek() === '-' && this.peek(2) === '>') {
        comment += '-->';
        this.position += 3;
        this.column += 3;
        break;
      }
      comment += this.input[this.position];
      this.position++;
      this.column++;
    }

    tokens.push({ type: TokenType.COMMENT, value: comment, line: this.line, column: this.column - comment.length });
  }

  private lexString(quote: string): Token {
    let str = quote;
    this.position++;
    this.column++;

    while (this.position < this.input.length && this.input[this.position] !== quote) {
      str += this.input[this.position];
      this.position++;
      this.column++;
    }

    if (this.position < this.input.length) {
      str += quote;
      this.position++;
      this.column++;
    }

    return { type: TokenType.STRING, value: str, line: this.line, column: this.column - str.length };
  }

  private lexNumber(): Token {
    let num = '';
    while (this.position < this.input.length && /\d/.test(this.input[this.position])) {
      num += this.input[this.position];
      this.position++;
      this.column++;
    }
    return { type: TokenType.NUMBER, value: num, line: this.line, column: this.column - num.length };
  }

  private lexIdentifier(): Token {
    let id = '';
    while (this.position < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.position])) {
      id += this.input[this.position];
      this.position++;
      this.column++;
    }
    return { type: TokenType.IDENTIFIER, value: id, line: this.line, column: this.column - id.length };
  }

  private lexText(): Token {
    let text = '';
    while (this.position < this.input.length && !/\s/.test(this.input[this.position]) && !['#', '=', '{', '}', '(', ')', '<', '>', '/', '@', '.', ',', ':', ';'].includes(this.input[this.position])) {
      text += this.input[this.position];
      this.position++;
      this.column++;
    }
    return { type: TokenType.TEXT, value: text, line: this.line, column: this.column - text.length };
  }
}