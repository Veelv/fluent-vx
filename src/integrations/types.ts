// Fluent VX Integrations Types
// Type definitions for the integration system

export interface IntegrationConfig {
  /** Unique integration identifier */
  name: string;
  /** Semantic version */
  version: string;
  /** Human-readable title */
  title?: string;
  /** Integration description */
  description?: string;
}

export interface IntegrationHooks {
  /** Called when integration is first loaded */
  'integration:init'?: (config: any) => Promise<void> | void;

  /** Called before config is resolved */
  'config:setup'?: (config: any) => Promise<any> | any;

  /** Called after config is resolved */
  'config:done'?: (config: any) => Promise<void> | void;

  /** Called before build starts */
  'build:start'?: (buildConfig: any) => Promise<void> | void;

  /** Called after build completes */
  'build:done'?: (buildResult: any) => Promise<void> | void;

  /** Called when dev server starts */
  'server:start'?: (server: any) => Promise<void> | void;

  /** Called when dev server stops */
  'server:stop'?: () => Promise<void> | void;
}

export interface FluentIntegration extends IntegrationConfig, IntegrationHooks {
  /** Fluent VX version compatibility */
  fluentVersion?: string;

  /** Required dependencies */
  dependencies?: string[];

  /** Conflicting integrations */
  conflicts?: string[];

  /** Optional integrations this one extends */
  extends?: string[];

  /** Priority order (higher = runs later) */
  priority?: number;

  /** Internal marker for validation */
  __fluentIntegration?: boolean;
}

/**
 * Integration factory function type
 */
export type IntegrationFactory<T = any> = (options?: T) => FluentIntegration;