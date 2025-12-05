// Fluent VX Secure Fetch
// Advanced security features for API communication

/**
 * Configuration for VX-SecureFetch
 */
export interface SecureFetchConfig {
  /** Expected JSON prefix for hijacking protection */
  jsonPrefix?: string;
  /** Timeout for requests in milliseconds */
  timeout?: number;
  /** Maximum response size in bytes */
  maxResponseSize?: number;
  /** Custom validation schema */
  schema?: ValidationSchema;
  /** CSRF token for requests */
  csrfToken?: string;
  /** CSRF token header name */
  csrfHeader?: string;
  /** Enable input sanitization */
  sanitizeInput?: boolean;
  /** Enable output sanitization */
  sanitizeOutput?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Trusted domains for CORS */
  trustedDomains?: string[];
}

/**
 * Validation schema for response data
 */
export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  required?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

/**
 * Secure fetch response
 */
export interface SecureFetchResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  validated: boolean;
  security: {
    hijackingProtected: boolean;
    prefixRemoved: boolean;
    validationPassed: boolean;
    csrfProtected: boolean;
    sanitized: boolean;
  };
}

/**
 * VX-SecureFetch main class
 */
export class VXSecureFetch {
  private config: SecureFetchConfig;

  constructor(config: SecureFetchConfig = {}) {
    this.config = {
      jsonPrefix: 'for (;;);',
      timeout: 10000,
      maxResponseSize: 10 * 1024 * 1024, // 10MB
      schema: { type: 'object' },
      csrfHeader: 'X-CSRF-Token',
      sanitizeInput: true,
      sanitizeOutput: true,
      debug: false,
      trustedDomains: [],
      ...config
    };
  }

  /**
   * Perform a secure fetch request
   */
  async fetch<T = any>(url: string, options: RequestInit = {}): Promise<SecureFetchResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 10000);

    try {
      // Sanitize input URL and options
      const sanitizedUrl = this.sanitizeUrl(url);
      const sanitizedOptions = this.sanitizeRequestOptions(options);

      // Add CSRF protection
      const headersWithCSRF = this.addCSRFProtection(this.headersToRecord(sanitizedOptions.headers || {}));

      const response = await fetch(sanitizedUrl, {
        ...sanitizedOptions,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          ...headersWithCSRF
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Validate CORS
      this.validateCORS(response.url);

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > (this.config.maxResponseSize || 10 * 1024 * 1024)) {
        throw new Error(`Response too large: ${contentLength} bytes`);
      }

      const text = await response.text();
      const security = this.processSecurity(text);

      if (!security.hijackingProtected) {
        this.log('Warning: Response not protected against JSON hijacking');
      }

      const data = this.parseJSON(security.cleanText);

      // Sanitize output if enabled
      const sanitizedData = this.config.sanitizeOutput ? this.sanitizeData(data) : data;

      const validated = this.validateData(sanitizedData);

      if (!validated) {
        throw new Error('Response data failed validation');
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        data: sanitizedData as T,
        status: response.status,
        headers,
        validated,
        security: {
          ...security,
          csrfProtected: !!this.config.csrfToken,
          sanitized: this.config.sanitizeOutput || false
        }
      };

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout || 10000}ms`);
        }
        throw error;
      }

      throw new Error('Unknown fetch error');
    }
  }

  /**
   * Process security measures on response text
   */
  private processSecurity(text: string): {
    hijackingProtected: boolean;
    prefixRemoved: boolean;
    cleanText: string;
    validationPassed: boolean;
  } {
    let cleanText = text.trim();
    let prefixRemoved = false;
    let hijackingProtected = false;

    // Check for JSON hijacking protection prefix
    const prefix = this.config.jsonPrefix || 'for (;;);';
    if (cleanText.startsWith(prefix)) {
      hijackingProtected = true;
      prefixRemoved = true;
      cleanText = cleanText.slice(prefix.length).trim();

      // Handle multiple prefixes (defense in depth)
      while (cleanText.startsWith(prefix)) {
        cleanText = cleanText.slice(prefix.length).trim();
      }
    }

    // Additional security checks
    if (cleanText.includes('/*') || cleanText.includes('*/')) {
      this.log('Warning: Response contains comment syntax');
    }

    return {
      hijackingProtected,
      prefixRemoved,
      cleanText,
      validationPassed: true // Will be set by validation
    };
  }

  /**
   * Safely parse JSON with additional security checks
   */
  private parseJSON(text: string): any {
    // Basic security checks before parsing
    if (text.length === 0) {
      throw new Error('Empty response');
    }

    // Only check for dangerous patterns if sanitization is disabled
    if (!this.config.sanitizeOutput) {
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(text)) {
          throw new Error('Response contains potentially dangerous content');
        }
      }
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate response data against schema
   */
  private validateData(data: any): boolean {
    try {
      const schema = this.config.schema || { type: 'object' };
      return this.validateAgainstSchema(data, schema);
    } catch (error) {
      this.log(`Validation error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return false;
    }
  }

  /**
   * Validate data against validation schema
   */
  private validateAgainstSchema(data: any, schema: ValidationSchema): boolean {
    switch (schema.type) {
      case 'object':
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          return false;
        }

        // Check required properties
        if (schema.required) {
          for (const prop of schema.required) {
            if (!(prop in data)) {
              return false;
            }
          }
        }

        // Validate properties
        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (key in data && !this.validateAgainstSchema(data[key], propSchema)) {
              return false;
            }
          }
        }
        break;

      case 'array':
        if (!Array.isArray(data)) {
          return false;
        }
        if (schema.items) {
          for (const item of data) {
            if (!this.validateAgainstSchema(item, schema.items)) {
              return false;
            }
          }
        }
        break;

      case 'string':
        if (typeof data !== 'string') {
          return false;
        }
        if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
          return false;
        }
        if (schema.minLength !== undefined && data.length < schema.minLength) {
          return false;
        }
        if (schema.maxLength !== undefined && data.length > schema.maxLength) {
          return false;
        }
        break;

      case 'number':
        if (typeof data !== 'number' || isNaN(data)) {
          return false;
        }
        if (schema.minimum !== undefined && data < schema.minimum) {
          return false;
        }
        if (schema.maximum !== undefined && data > schema.maximum) {
          return false;
        }
        break;

      case 'boolean':
        if (typeof data !== 'boolean') {
          return false;
        }
        break;

      default:
        return false;
    }

    return true;
  }

  /**
   * Sanitize URL for security
   */
  private sanitizeUrl(url: string): string {
    // Basic URL validation and sanitization
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL');
    }

    // Prevent protocol-relative URLs that could be exploited
    if (url.startsWith('//')) {
      throw new Error('Protocol-relative URLs not allowed');
    }

    // Ensure HTTPS for production (optional)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Allow relative URLs
      if (!url.startsWith('/')) {
        throw new Error('Invalid URL format');
      }
    }

    return url;
  }

  /**
   * Sanitize request options
   */
  private sanitizeRequestOptions(options: RequestInit): RequestInit {
    const sanitized = { ...options };

    // Sanitize headers
    if (sanitized.headers && this.config.sanitizeInput) {
      sanitized.headers = this.sanitizeHeaders(sanitized.headers as any);
    }

    // Sanitize body for dangerous content
    if (sanitized.body && typeof sanitized.body === 'string' && this.config.sanitizeInput) {
      sanitized.body = this.sanitizeString(sanitized.body);
    }

    return sanitized;
  }

  /**
   * Add CSRF protection to headers
   */
  private addCSRFProtection(headers: Record<string, string>): Record<string, string> {
    const protectedHeaders = { ...headers };

    if (this.config.csrfToken) {
      const csrfHeader = this.config.csrfHeader || 'X-CSRF-Token';
      protectedHeaders[csrfHeader] = this.config.csrfToken;
    }

    return protectedHeaders;
  }

  /**
   * Validate CORS policy
   */
  private validateCORS(responseUrl: string): void {
    if (!this.config.trustedDomains || this.config.trustedDomains.length === 0) {
      return; // No domain restrictions
    }

    try {
      const url = new URL(responseUrl);
      const isTrusted = this.config.trustedDomains.some(domain => {
        return url.hostname === domain || url.hostname.endsWith('.' + domain);
      });

      if (!isTrusted) {
        throw new Error(`Response from untrusted domain: ${url.hostname}`);
      }
    } catch (error) {
      // For relative URLs or invalid URLs, check if the URL string contains trusted domains
      const isTrusted = this.config.trustedDomains.some(domain => {
        return responseUrl.includes(domain);
      });

      if (!isTrusted) {
        throw new Error(`Response from untrusted domain: ${responseUrl}`);
      }
    }
  }

  /**
   * Sanitize response data
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSafeKey(key)) {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      // Remove any prototype pollution attempts (even if not enumerable)
      try {
        delete sanitized.__proto__;
        delete sanitized.constructor;
        delete sanitized.prototype;
      } catch (e) {
        // Ignore errors when deleting non-existent properties
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Convert HeadersInit to Record<string, string>
   */
  private headersToRecord(headers: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else if (typeof headers === 'object') {
      Object.assign(result, headers);
    }

    return result;
  }

  /**
   * Sanitize headers
   */
  private sanitizeHeaders(headers: Record<string, string> | Headers): Record<string, string> {
    const sanitized: Record<string, string> = {};

    const headerEntries = headers instanceof Headers
      ? Array.from(headers.entries())
      : Object.entries(headers);

    for (const [key, value] of headerEntries) {
      // Skip dangerous headers
      if (!this.isDangerousHeader(key)) {
        sanitized[key] = this.sanitizeString(value);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize string content
   */
  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;

    // Remove or escape dangerous patterns
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove objects
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '') // Remove embeds
      .trim();
  }

  /**
   * Check if header is dangerous
   */
  private isDangerousHeader(headerName: string): boolean {
    const dangerousHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-csrf-token',
      'x-xsrf-token'
    ];

    return dangerousHeaders.includes(headerName.toLowerCase());
  }

  /**
   * Check if object key is safe
   */
  private isSafeKey(key: string): boolean {
    // Reject keys that could be used for prototype pollution
    const dangerousKeys = [
      '__proto__',
      'constructor',
      'prototype',
      'toString',
      'valueOf',
      'toLocaleString'
    ];

    return !dangerousKeys.includes(key) && !key.startsWith('__');
  }

  /**
   * Log debug information
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[VX-SecureFetch] ${message}`);
    }
  }
}

/**
 * Global VX-SecureFetch instance
 */
export const vxSecureFetch = new VXSecureFetch();

/**
 * Convenience function for secure fetch
 */
export async function vxFetch<T = any>(
  url: string,
  options: RequestInit = {},
  config: SecureFetchConfig = {}
): Promise<SecureFetchResponse<T>> {
  const fetcher = new VXSecureFetch(config);
  return fetcher.fetch<T>(url, options);
}

/**
 * Create a configured secure fetch instance
 */
export function createSecureFetch(config: SecureFetchConfig): VXSecureFetch {
  return new VXSecureFetch(config);
}

/**
 * Pre-configured fetch for common API patterns
 */
export const apiFetch = createSecureFetch({
  jsonPrefix: 'for (;;);',
  timeout: 15000,
  schema: {
    type: 'object',
    properties: {
      data: { type: 'object' },
      success: { type: 'boolean' },
      message: { type: 'string' }
    },
    required: ['success']
  },
  debug: false
});

/**
 * Utility to create API schema
 */
export function createAPISchema(properties: Record<string, ValidationSchema>): ValidationSchema {
  return {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties
      },
      success: { type: 'boolean' },
      message: { type: 'string' },
      timestamp: { type: 'string' }
    },
    required: ['data', 'success']
  };
}