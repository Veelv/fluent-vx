// Fluent VX - Zero-config framework
// Automatic initialization

import { VxRouter } from './router';

// Global VX object for manual control
declare global {
  interface Window {
    VX: any;
  }
}

// VX Framework API
const VX = {
  // Auto-initialize on import in browser
  init: async () => {
    if (typeof window !== 'undefined') {
      console.log('🚀 Initializing Fluent VX...');

      // Initialize router
      const router = new VxRouter({
        pagesDir: './src/pages' // Default for browser
      });
      await router.init();

      // Setup client-side routing
      setupClientSideRouting(router);

      console.log('✅ Fluent VX ready!');
      return router;
    }
  },

  // Manual router creation
  Router: VxRouter
};

// Setup client-side routing for SPA-like behavior
function setupClientSideRouting(router: VxRouter) {
  // Intercept link clicks for client-side navigation
  document.addEventListener('click', (e) => {
    const link = (e.target as Element).closest('a');
    if (link && link.getAttribute('href')?.startsWith('/')) {
      e.preventDefault();
      const path = link.getAttribute('href')!;
      history.pushState(null, '', path);
      // Trigger route change - in a real implementation, this would re-render the page
      console.log('Navigating to:', path);
      // For now, just reload the page to simulate
      window.location.reload();
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    window.location.reload();
  });
}

// Auto-initialize on import in browser
if (typeof window !== 'undefined') {
  VX.init().catch(console.error);
  // Make VX globally available
  window.VX = VX;
}

// Export everything for manual usage
export * from './compiler';
export * from './router';
export * from './runtime';
export * from './reactivity';

// Export VX API
export { VX };

// Re-export with specific names to avoid conflicts
export { VxRouter as Router } from './router';
export { Route as VxRoute } from './router/types';

// Export configuration API
export { defineConfig } from './config';

// Export integrations system
export * from './integrations';

// Default export for convenience
export default {
  Router: VxRouter,
  compile: (await import('./compiler')).compileSource,
  init: () => {
    const router = new VxRouter();
    return router.init();
  }
};