// Fluent VX Runtime - Island Hydration
// Minimal runtime for selective hydration of interactive components

/**
 * Hydrates an island component with its JavaScript
 */
export function hydrateIsland(islandId: string, componentCode: string): void {
  try {
    // Find the island placeholder in DOM
    const placeholder = document.querySelector(`[data-island="${islandId}"]`);
    if (!placeholder) {
      console.warn(`Island ${islandId} not found in DOM`);
      return;
    }

    // Execute the component code in a safe context
    const componentFunction = new Function('props', componentCode);

    // Get props from data attributes
    const props: Record<string, any> = {};
    for (let i = 0; i < placeholder.attributes.length; i++) {
      const attr = placeholder.attributes[i];
      if (attr.name.startsWith('data-prop-')) {
        const propName = attr.name.slice(10); // Remove 'data-prop-'
        props[propName] = parsePropValue(attr.value);
      }
    }

    // Hydrate the component
    const componentInstance = componentFunction(props);

    // Replace placeholder with hydrated content
    if (componentInstance && typeof componentInstance.render === 'function') {
      const hydratedElement = componentInstance.render();
      placeholder.parentNode?.replaceChild(hydratedElement, placeholder);
    }

    console.log(`Island ${islandId} hydrated successfully`);
  } catch (error) {
    console.error(`Failed to hydrate island ${islandId}:`, error);
  }
}

/**
 * Hydrates all islands on the page
 */
export function hydrateAllIslands(): void {
  // Find all island scripts
  const islandScripts = document.querySelectorAll('script[data-island]');

  islandScripts.forEach(script => {
    const islandId = script.getAttribute('data-island');
    const componentCode = script.textContent;

    if (islandId && componentCode) {
      hydrateIsland(islandId, componentCode);
    }
  });
}

/**
 * Parses prop values from strings
 */
function parsePropValue(value: string): any {
  // Simple parsing - in production, use a proper JSON parser
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(Number(value))) return Number(value);

  return value;
}

/**
 * Auto-hydrate on page load
 */
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateAllIslands);
  } else {
    hydrateAllIslands();
  }
}