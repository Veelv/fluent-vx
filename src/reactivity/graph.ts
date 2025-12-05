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
}