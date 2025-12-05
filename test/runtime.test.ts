/**
 * @jest-environment jsdom
 */
import { Router, createLink } from '../src/runtime';

describe('Runtime', () => {
  describe('Router', () => {
    it('should create router instance', () => {
      const routes = [
        { path: '/', component: '() => ({ render: () => document.createElement("div") })' }
      ];
      const router = new Router(routes);
      expect(router).toBeDefined();
    });

    it('should find routes', () => {
      const routes = [
        { path: '/', component: 'home' },
        { path: '/about', component: 'about' }
      ];
      const router = new Router(routes);

      const current = router.getCurrentRoute();
      expect(current).toBeDefined();
      expect(current?.path).toBe('/');
      expect(current?.component).toBe('home');
    });
  });

  describe('createLink', () => {
    it('should create link element', () => {
      const link = createLink('/test', 'Test Link');
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toBe('/test');
      expect(link.textContent).toBe('Test Link');
    });
  });
});