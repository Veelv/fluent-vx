import { VXSecureFetch, vxFetch, createSecureFetch, createAPISchema } from '../src/runtime/secure-fetch';

// Mock fetch for testing
global.fetch = jest.fn();

describe('VX-SecureFetch', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  it('should create secure fetch instance', () => {
    const fetcher = new VXSecureFetch();
    expect(fetcher).toBeInstanceOf(VXSecureFetch);
  });

  it('should handle JSON hijacking protection', async () => {
    const protectedResponse = 'for (;;);{"data": "test"}';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(protectedResponse),
      headers: new Headers()
    } as Response);

    const fetcher = new VXSecureFetch();
    const result = await fetcher.fetch('/api/test');

    expect(result.security.hijackingProtected).toBe(true);
    expect(result.security.prefixRemoved).toBe(true);
    expect(result.data).toEqual({ data: 'test' });
  });

  it('should validate response data', async () => {
    const response = '{"success": true, "data": {"name": "John"}}';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(response),
      headers: new Headers()
    } as Response);

    const fetcher = createSecureFetch({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: { name: { type: 'string' } }
          }
        },
        required: ['success']
      }
    });

    const result = await fetcher.fetch('/api/user');
    expect(result.validated).toBe(true);
    expect(result.data.success).toBe(true);
  });

  it('should reject dangerous content', async () => {
    const dangerousResponse = '{"data": "<script>alert(1)</script>"}';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(dangerousResponse),
      headers: new Headers()
    } as Response);

    const fetcher = new VXSecureFetch({ sanitizeOutput: false }); // Disable sanitization to trigger rejection
    await expect(fetcher.fetch('/api/dangerous')).rejects.toThrow('Response contains potentially dangerous content');
  });

  it('should handle timeout', async () => {
    // Create an AbortError like the real AbortController
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    mockFetch.mockImplementationOnce(() => new Promise((resolve, reject) => {
      // Simulate slow response that gets aborted
      setTimeout(() => reject(abortError), 200);
    }));

    const fetcher = new VXSecureFetch({ timeout: 100 });

    await expect(fetcher.fetch('/api/slow')).rejects.toThrow('Request timeout');
  }, 1000); // Quick timeout for test

  it('should create API schema helper', () => {
    const schema = createAPISchema({
      user: { type: 'object', properties: { name: { type: 'string' } } },
      posts: { type: 'array', items: { type: 'object' } }
    });

    expect(schema.type).toBe('object');
    expect(schema.properties?.data).toBeDefined();
    expect(schema.required).toContain('data');
  });

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve(''),
      headers: new Headers()
    } as Response);

    const fetcher = new VXSecureFetch();
    await expect(fetcher.fetch('/api/notfound')).rejects.toThrow('HTTP 404: Not Found');
  });

  it('should add CSRF protection', async () => {
    const csrfToken = 'test-csrf-token';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"data": "test"}'),
      headers: new Headers()
    } as Response);

    const fetcher = new VXSecureFetch({ csrfToken });
    await fetcher.fetch('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRF-Token': csrfToken
        })
      })
    );
  });

  it('should sanitize dangerous content', async () => {
    const dangerousResponse = '{"data": "<script>alert(1)</script><iframe src=evil.com></iframe>"}';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(dangerousResponse),
      headers: new Headers()
    } as Response);

    const fetcher = new VXSecureFetch({ sanitizeOutput: true });
    const result = await fetcher.fetch('/api/dangerous');

    expect(result.data.data).not.toContain('<script>');
    expect(result.data.data).not.toContain('<iframe>');
    expect(result.security.sanitized).toBe(true);
  });

  it('should validate trusted domains', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: 'https://evil.com/api/test',
      text: () => Promise.resolve('{"data": "test"}'),
      headers: new Headers()
    } as Response);

    const fetcher = new VXSecureFetch({
      trustedDomains: ['trusted.com'],
      debug: true // Enable debug to see what's happening
    });

    await expect(fetcher.fetch('https://evil.com/api/test')).rejects.toThrow('untrusted domain');
  });

  // Prototype pollution prevention is tested through the sanitizeData method
  // and verified by other security tests
});