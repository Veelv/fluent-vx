import { parseVx } from '../src/parser';
import { detectReactivity } from '../src/reactivity';
import { generateCode } from '../src/generator';
import * as fs from 'fs';
import * as path from 'path';

describe('VX Code Generation', () => {
  it('should generate code from AST and reactivity', () => {
    const content = fs.readFileSync(path.join(__dirname, '../examples/home.vx'), 'utf-8');
    const ast = parseVx(content);
    const reactivity = detectReactivity(ast);
    const code = generateCode(ast, reactivity);

    expect(code).toHaveProperty('html');
    expect(code).toHaveProperty('css');
    expect(code).toHaveProperty('js');

    expect(code.html).toContain('<div');
    expect(code.html).toContain('<h1>');
    expect(code.html).toContain('<p>');
    expect(code.html).toContain('<button');

    expect(code.css).toContain('.counter');

    expect(code.js).toContain('addEventListener');
    // More detailed checks can be added
  });
});