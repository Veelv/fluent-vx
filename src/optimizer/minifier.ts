// Professional code minification utilities using industry-standard tools

/**
 * Minifies HTML using html-minifier-terser
 */
export async function minifyHtml(html: string): Promise<string> {
  try {
    const { minify } = await import('html-minifier-terser');
    return await minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true
    });
  } catch (error) {
    // Fallback to basic minification if html-minifier-terser fails
    console.warn('HTML minification failed, using fallback:', error);
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }
}

/**
 * Minifies CSS using clean-css
 */
export async function minifyCss(css: string): Promise<string> {
  try {
    const CleanCSS = (await import('clean-css')).default;
    const result = new CleanCSS({
      level: {
        1: {
          all: true,
          normalizeUrls: false
        },
        2: {
          all: false,
          removeDuplicateRules: true,
          removeUnusedAtRules: true
        }
      }
    }).minify(css);

    if (result.errors.length > 0) {
      console.warn('CSS minification errors:', result.errors);
    }

    return result.styles;
  } catch (error) {
    // Fallback to basic minification if clean-css fails
    console.warn('CSS minification failed, using fallback:', error);
    return css
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/{\s*/g, '{')
      .trim();
  }
}

/**
 * Minifies JavaScript using Terser
 */
export async function minifyJs(js: string): Promise<string> {
  try {
    const { minify } = await import('terser');
    const result = await minify(js, {
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
        pure_funcs: ['console.log']
      },
      mangle: {
        toplevel: true,
        properties: false // Keep property names for reactivity
      },
      format: {
        comments: false
      }
    });

    // Terser returns an object with 'code' property on success
    if (result && typeof result === 'object' && 'code' in result) {
      return (result as any).code || js;
    }

    return js;
  } catch (error: any) {
    // Handle terser errors and fallback to basic minification
    if (error.name === 'SyntaxError') {
      console.warn('JS syntax error during minification, using fallback:', error.message);
    } else {
      console.warn('JS minification failed, using fallback:', error.message);
    }

    return js
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/{\s*/g, '{')
      .trim();
  }
}