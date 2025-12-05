// Fluent VX Integration Factory
// Factory pattern for creating integrations

import type { FluentIntegration, IntegrationFactory } from './types';

/**
 * Creates a Fluent VX integration with proper typing and validation
 */
export function createIntegration<T = any>(
  config: FluentIntegration,
  setup?: (options: T) => Partial<FluentIntegration>
): IntegrationFactory<T> {
  return (options?: T): FluentIntegration => {
    const userConfig = setup ? setup(options || {} as T) : {};

    const integration: FluentIntegration = {
      priority: 0,
      ...config,
      ...userConfig,
      __fluentIntegration: true // Marker for validation
    };

    // Validate required fields
    if (!integration.name) {
      throw new Error('Integration name is required');
    }

    if (!integration.version) {
      throw new Error('Integration version is required');
    }

    return integration;
  };
}

/**
 * Creates a basic integration with minimal configuration
 */
export function createBasicIntegration(
  name: string,
  version: string,
  hooks?: Partial<FluentIntegration>
): FluentIntegration {
  return {
    name,
    version,
    priority: 0,
    __fluentIntegration: true,
    ...hooks
  };
}

/**
 * Creates an integration with dependency management
 */
export function createDependentIntegration(
  config: FluentIntegration,
  dependencies: string[] = [],
  conflicts: string[] = []
): FluentIntegration {
  return {
    ...config,
    dependencies,
    conflicts,
    __fluentIntegration: true
  };
}