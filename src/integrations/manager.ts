// Fluent VX Integration Manager
// Manages integration lifecycle and execution

import type { FluentIntegration, IntegrationFactory } from './types';
import { validateIntegration, validateIntegrationCompatibility } from './validation';

export interface IntegrationManagerOptions {
  /** Whether to throw on validation errors */
  strict?: boolean;
  /** Logger function */
  logger?: (message: string) => void;
}

/**
 * Integration manager for handling multiple integrations
 */
export class IntegrationManager {
  private integrations: FluentIntegration[] = [];
  private registry = new Map<string, FluentIntegration>();
  private options: Required<IntegrationManagerOptions>;

  constructor(options: IntegrationManagerOptions = {}) {
    this.options = {
      strict: true,
      logger: console.log,
      ...options
    };
  }

  /**
   * Adds an integration to the manager
   */
  add(integration: FluentIntegration | IntegrationFactory): void {
    const resolved = typeof integration === 'function' ? integration() : integration;

    // Validate integration
    validateIntegration(resolved);

    // Check compatibility
    const compatibility = validateIntegrationCompatibility(resolved, this.integrations);
    if (!compatibility.valid) {
      const errorMessage = `Integration validation failed:\n${compatibility.errors.join('\n')}`;
      if (this.options.strict) {
        throw new Error(errorMessage);
      } else {
        this.options.logger(`Warning: ${errorMessage}`);
      }
    }

    this.integrations.push(resolved);
    this.registry.set(resolved.name, resolved);

    // Sort by priority
    this.integrations.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    this.options.logger(`Integration "${resolved.name}" added successfully`);
  }

  /**
   * Removes an integration from the manager
   */
  remove(name: string): boolean {
    const index = this.integrations.findIndex(int => int.name === name);
    if (index === -1) return false;

    const integration = this.integrations[index];
    this.integrations.splice(index, 1);
    this.registry.delete(name);

    this.options.logger(`Integration "${integration.name}" removed`);
    return true;
  }

  /**
   * Gets all registered integrations
   */
  getAll(): FluentIntegration[] {
    return [...this.integrations];
  }

  /**
   * Gets integration by name
   */
  get(name: string): FluentIntegration | undefined {
    return this.registry.get(name);
  }

  /**
   * Checks if an integration is registered
   */
  has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Calls a hook on all integrations
   */
  async callHook(hook: keyof FluentIntegration, ...args: any[]): Promise<void> {
    for (const integration of this.integrations) {
      const hookFn = integration[hook];
      if (typeof hookFn === 'function') {
        try {
          await (hookFn as any).apply(integration, args);
        } catch (error) {
          this.options.logger(`Integration "${integration.name}" failed in hook "${hook}": ${error}`);
          if (this.options.strict) {
            throw error;
          }
        }
      }
    }
  }

  /**
   * Validates all integrations for compatibility
   */
  validateAll(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate names
    const names = new Set<string>();
    for (const integration of this.integrations) {
      if (names.has(integration.name)) {
        errors.push(`Duplicate integration name: "${integration.name}"`);
      }
      names.add(integration.name);
    }

    // Validate each integration individually
    for (const integration of this.integrations) {
      try {
        validateIntegration(integration);
      } catch (error) {
        errors.push(`Invalid integration "${integration.name}": ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets manager statistics
   */
  getStats() {
    return {
      total: this.integrations.length,
      byPriority: this.integrations.reduce((acc, int) => {
        const priority = int.priority || 0;
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      names: this.integrations.map(int => int.name)
    };
  }

  /**
   * Clears all integrations
   */
  clear(): void {
    this.integrations = [];
    this.registry.clear();
    this.options.logger('All integrations cleared');
  }
}

// Global integration manager instance
export const integrationManager = new IntegrationManager();