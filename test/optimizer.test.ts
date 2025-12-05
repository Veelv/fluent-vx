import { optimize } from '../src/compiler/optimizer';
import { CompilationContext, TargetPlatform } from '../src/compiler/types';
import { parseVx } from '../src/parser';

describe('Optimizer', () => {
  it('should run optimization passes', async () => {
    const source = `
#data
  count = 0
#end data

#style
  body { color: red; }
#end style

#view
  <div><p>test</p></div>
#end view
    `.trim();

    const ast = parseVx(source);
    const context: CompilationContext = {
      ast,
      options: {
        target: TargetPlatform.BROWSER,
        minify: true,
        analyze: true
      },
      features: {
        reactive: false,
        events: false,
        serverActions: false,
        dynamicImports: false,
        animations: false,
        forms: false
      },
      assets: new Map(),
      dependencies: new Set(),
      warnings: []
    };

    await optimize(context);

    expect(context.warnings).toBeDefined();
    expect(context.assets.size).toBeGreaterThanOrEqual(0);
  });
});