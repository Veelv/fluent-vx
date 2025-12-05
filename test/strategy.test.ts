import { analyzeStrategy, RenderingStrategy } from '../src/strategy';
import { parseVx } from '../src/parser';
import * as fs from 'fs';
import * as path from 'path';

describe('Strategy Analysis', () => {
  it('should choose ISLANDS for interactive content with dynamic data', () => {
    const content = `
#data
  count = 0
  message = "Hello"
#end data

#view
  <div>
    <p>{{ message }}</p>
    <button @click="count++">Click {{ count }}</button>
  </div>
#end view
    `;
    const ast = parseVx(content);
    const analysis = analyzeStrategy(ast);

    expect(analysis.strategy).toBe(RenderingStrategy.SSG);
    expect(analysis.reasons).toContain('Static or low-interactivity content');
  });

  it('should choose SSG for static content', () => {
    const staticContent = `
#data
  title = "Static Page"
#end data

#style
  body { font-family: Arial; }
#end style

#view
  <h1>{{ title }}</h1>
  <p>Static content</p>
#end view
    `;
    const ast = parseVx(staticContent);
    const analysis = analyzeStrategy(ast);

    expect(analysis.strategy).toBe(RenderingStrategy.SSG);
    expect(analysis.reasons).toContain('Static or low-interactivity content');
  });
});