import { validateAccessibility } from '../src/accessibility';

describe('Accessibility Validation', () => {
  it('should validate basic HTML accessibility', () => {
    const html = `
      <img src="test.jpg" />
      <input type="text" id="name" />
      <label for="name">Name</label>
      <button role="button">Click me</button>
    `;
    const css = 'color: #000; background: #fff;';

    const report = validateAccessibility(html, css);

    expect(report).toHaveProperty('issues');
    expect(report).toHaveProperty('score');
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);

    // Should have issues for missing alt and potential contrast
    expect(report.issues.length).toBeGreaterThan(0);
  });

  it('should pass for accessible HTML', () => {
    const html = `
      <img src="test.jpg" alt="Test image" />
      <input type="text" id="name" aria-label="Name field" />
      <button>Click me</button>
    `;
    const css = 'color: #000; background: #fff;';

    const report = validateAccessibility(html, css);

    // Should have fewer issues
    const errorCount = report.issues.filter(i => i.type === 'error').length;
    expect(errorCount).toBe(0);
  });
});