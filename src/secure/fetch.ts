// Fluent VX Secure Fetch
// Secure API consumption with JSON hijacking mitigation and validation

import { Schema, SchemaValidator } from './schema';
import { getSecurityConfig } from './config';

export interface FetchOptions {
  schema?: Schema;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface FetchResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Secure fetch function with built-in security features
 */
export async function secureFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const config = getSecurityConfig();

  // Enforce HTTPS if configured
  if (config.enforceHttps && !url.startsWith('https://')) {
    return { success: false, error: 'HTTPS required but URL is not secure' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Timeout can be implemented with AbortController
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const text = await response.text();

    // Mitigate JSON hijacking: remove 'for (;;);' prefix
    const cleanText = text.replace(/^for\s*\(\s*;\s*;\s*\)\s*;\s*/, '');

    let data: any;
    try {
      data = JSON.parse(cleanText);
    } catch (e) {
      return { success: false, error: 'Invalid JSON response' };
    }

    // Validate against schema if provided
    if (options.schema) {
      const validator = new SchemaValidator();
      if (!validator.validate(data, options.schema)) {
        return { success: false, error: 'Response does not match expected schema' };
      }
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Obfuscate sensitive data for logging
 */
export function obfuscateForLogging(data: any): any {
  const config = getSecurityConfig();
  if (!config.logObfuscation) return data;

  // Simple obfuscation: mask strings that look like tokens
  if (typeof data === 'object' && data !== null) {
    const obfuscated = { ...data };
    for (const key in obfuscated) {
      if (typeof obfuscated[key] === 'string' && obfuscated[key].length > 10) {
        obfuscated[key] = obfuscated[key].substring(0, 4) + '****' + obfuscated[key].substring(obfuscated[key].length - 4);
      }
    }
    return obfuscated;
  }
  return data;
}