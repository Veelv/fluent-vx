// Fluent VX Integrations System
// Professional plugin architecture with modular design

// Core types
export type { FluentIntegration, IntegrationFactory, IntegrationConfig, IntegrationHooks } from './types';

// Validation system
export { validateIntegration, checkIntegrationConflicts, checkIntegrationDependencies, validateIntegrationCompatibility } from './validation';

// Factory pattern
export { createIntegration, createBasicIntegration, createDependentIntegration } from './factory';

// Management system
export { IntegrationManager, integrationManager } from './manager';