// Optimizer types

import { AccessibilityReport } from '../accessibility';

export interface OptimizationResult {
  html: string;
  css: string;
  js: string;
  criticalCss: string;
  bundles: Bundle[];
  estimatedLcp: number; // in ms
  estimatedBundleSize: number; // in KB
  accessibility: AccessibilityReport;
}

export interface Bundle {
  name: string;
  code: string;
  size: number;
}