// Fluent VX Server Actions
// Advanced server-side function execution with type safety and validation

import { ServerAction } from '../parser/ast';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ActionContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
}

/**
 * Advanced server action registry with metadata
 */
class ActionRegistry {
  private actions = new Map<string, ServerAction>();
  private middlewares: ActionMiddleware[] = [];

  register(action: ServerAction): void {
    this.actions.set(action.name, action);
  }

  get(name: string): ServerAction | undefined {
    return this.actions.get(name);
  }

  list(): ServerAction[] {
    return Array.from(this.actions.values());
  }

  addMiddleware(middleware: ActionMiddleware): void {
    this.middlewares.push(middleware);
  }

  async execute(name: string, args: any[], context: ActionContext): Promise<ActionResult> {
    const action = this.actions.get(name);
    if (!action) {
      return { success: false, error: `Action '${name}' not found` };
    }

    try {
      // Run middlewares
      for (const middleware of this.middlewares) {
        const result = await middleware(action, args, context);
        if (!result.success) {
          return result;
        }
      }

      // Validate parameters
      const validation = await this.validateParameters(action, args);
      if (!validation.success) {
        return validation;
      }

      // Execute action
      const result = await this.runAction(action, args, context);

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Action execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async validateParameters(action: ServerAction, args: any[]): Promise<ActionResult> {
    // Type validation based on action.params
    for (let i = 0; i < action.params.length; i++) {
      const param = action.params[i];
      const arg = args[i];

      if (param.type) {
        const validation = this.validateType(arg, param.type);
        if (!validation.valid) {
          return {
            success: false,
            validationErrors: [{
              field: param.name,
              message: `Invalid type for parameter '${param.name}': expected ${param.type}, got ${typeof arg}`,
              code: 'TYPE_MISMATCH'
            }]
          };
        }
      }
    }

    return { success: true };
  }

  private validateType(value: any, expectedType: string): { valid: boolean; error?: string } {
    const type = typeof value;

    if (expectedType === 'string' && type !== 'string') return { valid: false };
    if (expectedType === 'number' && type !== 'number') return { valid: false };
    if (expectedType === 'boolean' && type !== 'boolean') return { valid: false };
    if (expectedType.includes('[]') && !Array.isArray(value)) return { valid: false };

    return { valid: true };
  }

  private async runAction(action: ServerAction, args: any[], context: ActionContext): Promise<any> {
    // Create execution context
    const executionContext = {
      ...context,
      args,
      action: action.name
    };

    // Build function with proper async handling
    const paramNames = action.params.map(p => p.name);
    const functionBody = action.isAsync ?
      `return (async () => { ${action.body} })();` :
      `return (() => { ${action.body} })();`;

    const func = new Function(...paramNames, 'context', functionBody);

    return await func(...args, executionContext);
  }
}

export type ActionMiddleware = (
  action: ServerAction,
  args: any[],
  context: ActionContext
) => Promise<ActionResult>;

/**
 * Global action registry instance
 */
const registry = new ActionRegistry();

/**
 * Public API functions
 */
export function registerAction(action: ServerAction): void {
  registry.register(action);
}

export function getActions(): ServerAction[] {
  return registry.list();
}

export async function executeAction(name: string, args: any[], context?: Partial<ActionContext>): Promise<ActionResult> {
  const fullContext: ActionContext = {
    timestamp: Date.now(),
    ...context
  };

  return await registry.execute(name, args, fullContext);
}

export function addActionMiddleware(middleware: ActionMiddleware): void {
  registry.addMiddleware(middleware);
}

/**
 * Client-side action caller with proper error handling
 */
export function createActionCaller(actionName: string) {
  return async (...args: any[]): Promise<any> => {
    try {
      const response = await fetch(`/api/actions/${actionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ args }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        const error = new Error(result.error || 'Action failed');
        (error as any).validationErrors = result.validationErrors;
        throw error;
      }

      return result.data;
    } catch (error) {
      // Re-throw with additional context
      throw new Error(`Server action '${actionName}' failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

/**
 * Built-in middlewares
 */
export const middlewares = {
  rateLimit: (maxRequests: number, windowMs: number): ActionMiddleware => {
    const requests = new Map<string, number[]>();

    return async (action, args, context) => {
      const key = context.ipAddress || 'anonymous';
      const now = Date.now();
      const windowStart = now - windowMs;

      const userRequests = requests.get(key) || [];
      const recentRequests = userRequests.filter(time => time > windowStart);

      if (recentRequests.length >= maxRequests) {
        return {
          success: false,
          error: `Rate limit exceeded. Try again in ${Math.ceil((recentRequests[0] + windowMs - now) / 1000)} seconds.`
        };
      }

      recentRequests.push(now);
      requests.set(key, recentRequests);

      return { success: true };
    };
  },

  authentication: (requireAuth: boolean = true): ActionMiddleware => {
    return async (action, args, context) => {
      if (requireAuth && !context.userId) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      return { success: true };
    };
  }
};