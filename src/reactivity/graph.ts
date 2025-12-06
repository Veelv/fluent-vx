/**
 * Interfaces for the reactivity graph.
 */

export interface ReactiveVariable {
  name: string;
  dependencies: string[];
  usedIn: string[]; // where it's used (e.g., 'view', 'data')
}

export interface ReactivityGraph {
  variables: Map<string, ReactiveVariable>;
  addVariable(name: string, value: any): void;
  getVariable(name: string): ReactiveVariable | undefined;
}

/**
 * Implementation of the reactivity graph
 */
export class ReactivityGraphImpl implements ReactivityGraph {
  variables: Map<string, ReactiveVariable> = new Map();

  addVariable(name: string, value: any): void {
    this.variables.set(name, {
      name,
      dependencies: [],
      usedIn: ['data']
    });
  }

  getVariable(name: string): ReactiveVariable | undefined {
    return this.variables.get(name);
  }
}