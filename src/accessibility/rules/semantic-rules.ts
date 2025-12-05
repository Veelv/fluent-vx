// Semantic HTML accessibility rules

import { AccessibilityIssue } from '../index';

export function checkSemanticStructure(elements: any[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for heading hierarchy
  const headings = elements.filter(el => el.tag.match(/^h[1-6]$/));
  let lastLevel = 0;

  for (const heading of headings) {
    const level = parseInt(heading.tag.charAt(1));
    if (level - lastLevel > 1) {
      issues.push({
        type: 'warning',
        message: `Skipped heading level: went from h${lastLevel} to h${level}`,
        element: `<${heading.tag}>`,
        line: heading.line
      });
    }
    lastLevel = level;
  }

  // Check for main landmark
  const hasMain = elements.some(el => el.tag === 'main' || el.attributes.role === 'main');
  if (!hasMain) {
    issues.push({
      type: 'warning',
      message: 'Missing main landmark (<main> or role="main")'
    });
  }

  // Check for navigation landmark
  const hasNav = elements.some(el => el.tag === 'nav' || el.attributes.role === 'navigation');
  if (!hasNav) {
    issues.push({
      type: 'warning',
      message: 'Missing navigation landmark (<nav> or role="navigation")'
    });
  }

  return issues;
}

export function checkFormAccessibility(elements: any[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const formElements = elements.filter(el =>
    ['input', 'select', 'textarea'].includes(el.tag) &&
    el.attributes.type !== 'hidden' &&
    el.attributes.type !== 'submit'
  );

  for (const formEl of formElements) {
    const hasLabel = checkElementHasLabel(formEl, elements);
    if (!hasLabel) {
      issues.push({
        type: 'error',
        message: `Form element missing associated label`,
        element: `<${formEl.tag}>`,
        line: formEl.line
      });
    }
  }

  return issues;
}

function checkElementHasLabel(element: any, allElements: any[]): boolean {
  // Check for aria-label
  if (element.attributes['aria-label'] || element.attributes['aria-labelledby']) {
    return true;
  }

  // Check for associated label
  const label = allElements.find(el =>
    el.tag === 'label' &&
    (el.attributes.for === element.attributes.id ||
     el.attributes.htmlFor === element.attributes.id)
  );

  return !!label;
}