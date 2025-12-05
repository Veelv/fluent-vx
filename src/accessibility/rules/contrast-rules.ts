// Color contrast accessibility rules

import { AccessibilityIssue } from '../index';

export function checkColorContrast(css: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Extract color and background-color pairs
  const colorDeclarations = extractColorDeclarations(css);

  for (const decl of colorDeclarations) {
    if (decl.color && decl.backgroundColor) {
      const contrast = calculateContrastRatio(decl.color, decl.backgroundColor);
      if (contrast < 4.5) {
        issues.push({
          type: 'error',
          message: `Insufficient color contrast: ${contrast.toFixed(2)}:1 (minimum 4.5:1 required)`,
          element: `Color: ${decl.color}, Background: ${decl.backgroundColor}`
        });
      } else if (contrast < 7) {
        issues.push({
          type: 'warning',
          message: `Low color contrast: ${contrast.toFixed(2)}:1 (7:1 recommended for AAA)`,
          element: `Color: ${decl.color}, Background: ${decl.backgroundColor}`
        });
      }
    }
  }

  return issues;
}

interface ColorDeclaration {
  color?: string;
  backgroundColor?: string;
  selector: string;
}

function extractColorDeclarations(css: string): ColorDeclaration[] {
  const declarations: ColorDeclaration[] = [];

  // Simple CSS parsing - split by }
  const rules = css.split('}');

  for (const rule of rules) {
    const [selector, properties] = rule.split('{');
    if (!selector || !properties) continue;

    const decl: ColorDeclaration = { selector: selector.trim() };
    const props = properties.split(';');

    for (const prop of props) {
      const [name, value] = prop.split(':').map(s => s.trim());
      if (name === 'color') {
        decl.color = value;
      } else if (name === 'background-color' || name === 'background') {
        decl.backgroundColor = value;
      }
    }

    if (decl.color || decl.backgroundColor) {
      declarations.push(decl);
    }
  }

  return declarations;
}

function calculateContrastRatio(color1: string, color2: string): number {
  // Convert colors to RGB
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) return 1; // Default if parsing fails

  // Calculate relative luminance
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  // Return contrast ratio
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
  }

  // Handle rgb() colors
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }

  return null;
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;

  // Convert to linear RGB
  const toLinear = (c: number) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}