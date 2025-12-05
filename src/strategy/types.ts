// Strategy types

export enum RenderingStrategy {
  SSG = 'SSG', // Static Site Generation
  SSR = 'SSR', // Server-Side Rendering
  ISLANDS = 'ISLANDS', // Islands Architecture
  SPA = 'SPA'  // Single Page Application
}

export interface StrategyAnalysis {
  strategy: RenderingStrategy;
  reasons: string[];
}