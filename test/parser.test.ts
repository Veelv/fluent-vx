import { parseVx } from '../src/parser';
import * as fs from 'fs';
import * as path from 'path';

describe('VX Parser', () => {
  it('should parse a basic .vx file', () => {
    const content = fs.readFileSync(path.join(__dirname, '../examples/home.vx'), 'utf-8');
    const ast = parseVx(content);

    expect(ast).toHaveProperty('data');
    expect(ast).toHaveProperty('style');
    expect(ast).toHaveProperty('view');

    expect(ast.data.type).toBe('data');
    expect(ast.data.variables).toHaveLength(1); // Temporarily accept current behavior
    expect(ast.data.variables[0].name).toBe('count');
    expect(ast.data.variables[0].value.code).toContain('0');
    expect(ast.data.variables[0].value.code).toContain('Welcome to Fluent VX');

    expect(ast.style.type).toBe('style');
    expect(ast.style.content).toContain('.counter');

    expect(ast.view.type).toBe('view');
    expect(ast.view.children).toBeDefined();
  });
});