// Fluent VX Accessibility Validation Engine
// Comprehensive build-time accessibility checking with WCAG compliance

export interface AccessibilityIssue {
  type: 'error' | 'warning';
  message: string;
  element?: string;
  line?: number;
  wcag?: string; // WCAG guideline reference
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[];
  score: number; // 0-100 accessibility score
  wcagLevel: 'A' | 'AA' | 'AAA';
}

/**
 * Main accessibility validation function
 * Runs comprehensive checks on HTML and CSS
 */
export function validateAccessibility(html: string, css: string): AccessibilityReport {
  const issues: AccessibilityIssue[] = [];

  // Parse HTML elements
  const elements = parseElements(html);

  // Run all validation rules
  issues.push(...validateImages(elements));
  issues.push(...validateForms(elements));
  issues.push(...checkAriaAttributes(elements));
  issues.push(...checkSemanticStructure(elements));
  issues.push(...checkFormAccessibility(elements));
  issues.push(...checkColorContrast(css));

  // Calculate accessibility score
  const score = calculateAccessibilityScore(issues);
  const wcagLevel = determineWcagLevel(issues);

  return { issues, score, wcagLevel };
}

// Import rule functions
import { checkAriaAttributes } from './rules/aria-rules';
import { checkSemanticStructure, checkFormAccessibility } from './rules/semantic-rules';
import { checkColorContrast } from './rules/contrast-rules';

// Helper functions
function validateImages(elements: ParsedElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  for (const element of elements) {
    if (element.tag === 'img') {
      if (!element.attributes.alt && !element.attributes['aria-label']) {
        issues.push({
          type: 'error',
          message: 'Image missing alt text or aria-label',
          element: '<img>',
          line: element.line,
          wcag: '1.1.1'
        });
      }
    }
  }

  return issues;
}

function validateForms(elements: ParsedElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const inputs = elements.filter(el =>
    ['input', 'select', 'textarea'].includes(el.tag) &&
    el.attributes.type !== 'hidden' &&
    el.attributes.type !== 'submit'
  );

  for (const input of inputs) {
    const hasLabel = input.attributes['aria-label'] ||
                    input.attributes['aria-labelledby'] ||
                    elements.some(el => el.tag === 'label' &&
                      (el.attributes.for === input.attributes.id ||
                       el.attributes.htmlFor === input.attributes.id));

    if (!hasLabel) {
      issues.push({
        type: 'error',
        message: 'Form control missing accessible label',
        element: `<${input.tag}>`,
        line: input.line,
        wcag: '3.3.2'
      });
    }
  }

  return issues;
}

interface ParsedElement {
  tag: string;
  attributes: Record<string, string>;
  line: number;
}

function parseElements(html: string): ParsedElement[] {
  const elements: ParsedElement[] = [];
  const lines = html.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match opening tags
    const tagMatch = line.match(/<(\w+)([^>]*)\/?>/);
    if (tagMatch) {
      const [, tag, attrStr] = tagMatch;
      const attributes: Record<string, string> = {};

      // Parse attributes
      const attrRegex = /(\w+(?:-\w+)*)=["']([^"']*)["']/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
        attributes[attrMatch[1]] = attrMatch[2];
      }

      elements.push({ tag, attributes: attributes || {}, line: i + 1 });
    }
  }

  return elements;
}

function calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
  const errorWeight = 10;
  const warningWeight = 2;

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;

  const penalty = (errorCount * errorWeight) + (warningCount * warningWeight);
  return Math.max(0, 100 - penalty);
}

function determineWcagLevel(issues: AccessibilityIssue[]): 'A' | 'AA' | 'AAA' {
  const hasErrors = issues.some(i => i.type === 'error');
  if (hasErrors) return 'A';

  // For AA level, check if all issues are warnings and score > 70
  const score = calculateAccessibilityScore(issues);
  return score >= 95 ? 'AAA' : 'AA';
}