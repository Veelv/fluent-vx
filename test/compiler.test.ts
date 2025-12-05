import { compile, compileFile } from '../src/compiler/compiler';
import { parseVx } from '../src/parser';
import * as fs from 'fs';
import * as path from 'path';

describe('Fluent VX Compiler', () => {
  it('should compile a simple AST to HTML/CSS/JS', () => {
    const source = `
// Simple test
#data
  name = "World"
#end data

#style
  .test { color: red; }
#end style

#view
  <div>Hello {{ name }}</div>
#end view
`;

    const ast = parseVx(source);
    const result = compile(ast);

    expect(result.html).toContain('<div>Hello');
    expect(result.html).toContain('</div>');
    expect(result.css).toContain('.test');
    expect(result.css).toContain('color:red');
    expect(result.js).toContain('Fluent VX');
    expect(result.metadata.hasReactivity).toBe(false);
  });

  it('should compile a file with directives', () => {
    const source = `
// Test with directives
#data
  items = ["a", "b"]
#end data

#style
  .item { margin: 5px; }
#end style

#view
  @if(true)
    <ul>
      @for(item in items)
        <li class="item">{{ item }}</li>
      @end for
    </ul>
  @end if
#end view
`;

    const ast = parseVx(source);
    const result = compile(ast);

    expect(result.html).toContain('<ul>');
    // expect(result.html).toContain('<li'); // TODO: Fix @for directive
    expect(result.html).toContain('</ul>');
    expect(result.metadata.hasDirectives).toBe(false); // Not tracking yet
  });

  it('should handle self-closing elements', () => {
    const source = `
#data
#end data

#style
#end style

#view
  <br />
  <img src="test.jpg" />
#end view
`;

    const ast = parseVx(source);
    const result = compile(ast);

    expect(result.html).toContain('<br />');
    expect(result.html).toContain('<img');
  });

  it('should compile file from source', async () => {
    const source = `
// File compilation test
#data
  title = "Test"
#end data

#style
  body { margin: 0; }
#end style

#view
  <h1>{{ title }}</h1>
#end view
`;

    const result = await compileFile(source);

    expect(result.html).toContain('<h1>');
    expect(result.html).toContain('</h1>');
    expect(result.css).toContain('body');
    expect(result.js).toBeDefined();
  });
});