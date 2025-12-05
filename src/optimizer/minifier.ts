// Code minification utilities

/**
 * Minifies HTML by removing unnecessary whitespace.
 */
export function minifyHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * Minifies CSS by removing unnecessary whitespace.
 */
export function minifyCss(css: string): string {
  return css
    .replace(/\s+/g, ' ')
    .replace(/;\s*}/g, '}')
    .replace(/{\s*/g, '{')
    .trim();
}

/**
 * Minifies JS by removing unnecessary whitespace.
 */
export function minifyJs(js: string): string {
  return js
    .replace(/\s+/g, ' ')
    .replace(/;\s*}/g, '}')
    .replace(/{\s*/g, '{')
    .trim();
}