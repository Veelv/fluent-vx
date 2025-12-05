// Fluent VX Integration Validation
// Validation logic for integration compatibility

import type { FluentIntegration } from './types';

/**
 * Validates if an integration is compatible with Fluent VX
 */
export function validateIntegration(integration: any): integration is FluentIntegration {
  if (!integration || typeof integration !== 'object') {
    throw new Error('Integration must be an object');
  }

  if (!integration.name || typeof integration.name !== 'string') {
    throw new Error('Integration must have a valid "name" property');
  }

  if (!integration.version || typeof integration.version !== 'string') {
    throw new Error('Integration must have a valid "version" property');
  }

  // Check for Fluent VX marker
  if (!integration.__fluentIntegration) {
    throw new Error(`Integration "${integration.name}" is not a valid Fluent VX integration. Make sure it's created with createIntegration().`);
  }

  return true;
}

/**
 * Checks if two integrations conflict with each other
 */
export function checkIntegrationConflicts(
  integration: FluentIntegration,
  existingIntegrations: FluentIntegration[]
): string[] {
  const conflicts: string[] = [];

  if (!integration.conflicts) return conflicts;

  for (const conflictName of integration.conflicts) {
    const conflictingIntegration = existingIntegrations.find(int => int.name === conflictName);
    if (conflictingIntegration) {
      conflicts.push(conflictName);
    }
  }

  return conflicts;
}

/**
 * Checks if an integration has all required dependencies
 */
export function checkIntegrationDependencies(
  integration: FluentIntegration,
  existingIntegrations: FluentIntegration[]
): string[] {
  const missing: string[] = [];

  if (!integration.dependencies) return missing;

  for (const depName of integration.dependencies) {
    const dependency = existingIntegrations.find(int => int.name === depName);
    if (!dependency) {
      missing.push(depName);
    }
  }

  return missing;
}

/**
 * Validates integration compatibility and requirements
 */
export function validateIntegrationCompatibility(
  integration: FluentIntegration,
  existingIntegrations: FluentIntegration[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check conflicts
  const conflicts = checkIntegrationConflicts(integration, existingIntegrations);
  if (conflicts.length > 0) {
    errors.push(
      `Integration "${integration.name}" conflicts with: ${conflicts.join(', ')}. ` +
      'Remove conflicting integrations first.'
    );
  }

  // Check dependencies
  const missingDeps = checkIntegrationDependencies(integration, existingIntegrations);
  if (missingDeps.length > 0) {
    errors.push(
      `Integration "${integration.name}" requires: ${missingDeps.join(', ')}. ` +
      'Add required integrations first.'
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}