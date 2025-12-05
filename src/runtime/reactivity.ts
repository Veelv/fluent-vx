// Fluent VX Reactivity System
// Advanced fine-grained reactivity without Virtual DOM

/**
 * Reactive object that tracks dependencies and triggers updates
 */
export class ReactiveObject {
  private dependencies: Map<string | symbol, Set<Effect>> = new Map();
  private proxy: any;

  constructor(target: any) {
    this.proxy = this.createReactiveProxy(target);
    // Mark as reactive to prevent double wrapping
    this.proxy.__isReactive = true;
  }

  /**
   * Get the reactive proxy
   */
  get value(): any {
    return this.proxy;
  }

  /**
   * Track a dependency for a property
   */
  track(property: string | symbol, effect: Effect): void {
    if (!this.dependencies.has(property)) {
      this.dependencies.set(property, new Set());
    }
    this.dependencies.get(property)!.add(effect);
    effect.addDependency(this, property);
  }

  /**
   * Trigger updates for a property
   */
  trigger(property: string | symbol): void {
    const deps = this.dependencies.get(property);
    if (deps) {
      deps.forEach(effect => effect.run());
    }
  }

  /**
   * Remove an effect from a property's dependencies
   */
  removeEffect(property: string | symbol, effect: Effect): void {
    const deps = this.dependencies.get(property);
    if (deps) {
      deps.delete(effect);
    }
  }

  /**
   * Create a reactive proxy
   */
  private createReactiveProxy(target: any): any {
    const self = this;

    return new Proxy(target, {
      get(target, property, receiver) {
        const value = Reflect.get(target, property, receiver);

        // Track access for reactivity if we have an active effect
        if (activeEffect && typeof property === 'string' && property !== 'length' && property !== '__isReactive') {
          self.track(property, activeEffect);
        }

        // Make nested objects reactive
        if (typeof value === 'object' && value !== null && !value.__isReactive) {
          return self.createReactiveProxy(value);
        }

        return value;
      },

      set(target, property, value, receiver) {
        const oldValue = Reflect.get(target, property, receiver);

        if (oldValue !== value) {
          Reflect.set(target, property, value, receiver);

          // Trigger updates
          self.trigger(property);
        }

        return true;
      }
    });
  }
}

/**
 * Effect function that tracks dependencies
 */
export class Effect {
  private fn: () => void;
  private dependencies: Set<{ reactive: ReactiveObject; property: string | symbol }> = new Set();
  private active = false;

  constructor(fn: () => void) {
    this.fn = fn;
  }

  /**
   * Run the effect and track dependencies
   */
  run(): void {
    if (this.active) return; // Prevent infinite loops

    this.active = true;
    this.cleanup();

    // Set this as the active effect
    activeEffect = this;

    try {
      this.fn();
    } finally {
      activeEffect = null;
      this.active = false;
    }
  }

  /**
   * Add a dependency
   */
  addDependency(reactive: ReactiveObject, property: string | symbol): void {
    this.dependencies.add({ reactive, property });
  }

  /**
   * Clean up dependencies
   */
  private cleanup(): void {
    this.dependencies.forEach(({ reactive, property }) => {
      // Remove this effect from the reactive object's dependencies
      reactive.removeEffect(property, this);
    });
    this.dependencies.clear();
  }
}

// Global active effect for tracking
let activeEffect: Effect | null = null;

/**
 * Track a dependency access
 */
export function track(target: any, property: string | symbol): void {
  if (activeEffect) {
    // In a full implementation, we'd add the dependency
    // For now, this is a placeholder
  }
}

/**
 * Trigger updates for a property
 */
export function trigger(target: any, property: string | symbol): void {
  // In a full implementation, we'd trigger all effects
  // For now, this is a placeholder
}

/**
 * Create a reactive object
 */
export function reactive<T extends object>(target: T): T {
  const reactiveObj = new ReactiveObject(target);
  return reactiveObj.value;
}

/**
 * Create a computed property
 */
export function computed<T>(getter: () => T): { value: T } {
  let value: T;
  let dirty = true;

  const effect = new Effect(() => {
    value = getter();
    dirty = false;
  });

  return {
    get value() {
      if (dirty) {
        effect.run();
      }
      return value!;
    }
  };
}

/**
 * Watch for changes
 */
export function watch<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T) => void
): () => void {
  let oldValue: T;

  const effect = new Effect(() => {
    const newValue = source();
    if (oldValue !== undefined) {
      callback(newValue, oldValue);
    }
    oldValue = newValue;
  });

  effect.run();

  // Return cleanup function
  return () => {
    // Cleanup logic
  };
}

/**
 * Next tick for batching updates
 */
export function nextTick(callback: () => void): void {
  // Simple implementation - in production would use microtasks
  setTimeout(callback, 0);
}

/**
 * Batch multiple updates
 */
export function batch(callback: () => void): void {
  // Simple implementation - in production would batch updates
  callback();
}