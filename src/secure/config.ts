// Fluent VX Security Configuration

export interface SecurityConfig {
  enforceHttps: boolean;
  logObfuscation: boolean;
  corsEnabled: boolean;
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export const defaultConfig: SecurityConfig = {
  enforceHttps: false, // Disabled by default for development
  logObfuscation: true,
  corsEnabled: true,
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
};

let currentConfig: SecurityConfig = { ...defaultConfig };

export function setSecurityConfig(config: Partial<SecurityConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function getSecurityConfig(): SecurityConfig {
  return { ...currentConfig };
}