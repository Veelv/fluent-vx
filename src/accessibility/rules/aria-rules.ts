// ARIA accessibility rules

import { AccessibilityIssue } from '../index';

export function checkAriaAttributes(element: any): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for invalid ARIA roles
  const validRoles = [
    'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
    'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
    'contentinfo', 'definition', 'dialog', 'directory', 'document',
    'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
    'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
    'marquee', 'math', 'meter', 'menu', 'menubar', 'menuitem',
    'menuitemcheckbox', 'menuitemradio', 'navigation', 'none',
    'note', 'option', 'presentation', 'progressbar', 'radio',
    'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
    'scrollbar', 'search', 'searchbox', 'separator', 'slider',
    'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
    'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip',
    'tree', 'treegrid', 'treeitem'
  ];

  if (element.attributes?.role && !validRoles.includes(element.attributes.role)) {
    issues.push({
      type: 'error',
      message: `Invalid ARIA role: ${element.attributes.role}`,
      element: `<${element.tag}>`,
      line: element.line
    });
  }

  // Check ARIA properties require valid roles
  const ariaProps = element.attributes ? Object.keys(element.attributes).filter(attr => attr.startsWith('aria-')) : [];
  for (const prop of ariaProps) {
    if (prop === 'aria-label' || prop === 'aria-labelledby') {
      // These are generally allowed
      continue;
    }

    // Check if element has appropriate role for the property
    const requiredRole = getRequiredRoleForAriaProperty(prop);
    if (requiredRole && element.attributes.role !== requiredRole) {
      issues.push({
        type: 'warning',
        message: `ARIA property ${prop} requires role="${requiredRole}"`,
        element: `<${element.tag}>`,
        line: element.line
      });
    }
  }

  return issues;
}

function getRequiredRoleForAriaProperty(prop: string): string | null {
  const roleMap: Record<string, string> = {
    'aria-checked': 'checkbox',
    'aria-selected': 'option',
    'aria-expanded': 'button',
    'aria-pressed': 'button',
    'aria-valuenow': 'progressbar',
    'aria-valuemin': 'progressbar',
    'aria-valuemax': 'progressbar'
  };

  return roleMap[prop] || null;
}