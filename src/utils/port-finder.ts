import * as net from 'net';

/**
 * Configuration options for port finding
 */
export interface PortFinderOptions {
  /** Host to bind to for testing */
  host?: string;
  /** Timeout in milliseconds for port check */
  timeout?: number;
  /** Maximum port number to check */
  maxPort?: number;
  /** Minimum port number to check */
  minPort?: number;
  /** Logger function for debug information */
  logger?: (message: string) => void;
}

/**
 * Result of port availability check
 */
export interface PortCheckResult {
  port: number;
  available: boolean;
  error?: string;
}

/**
 * Advanced port finder for Fluent VX development server
 * Provides robust port detection with configurable options
 */
export class PortFinder {
  private options: Required<PortFinderOptions>;

  constructor(options: PortFinderOptions = {}) {
    this.options = {
      host: options.host || '127.0.0.1',
      timeout: options.timeout || 1000,
      maxPort: options.maxPort || 65535,
      minPort: options.minPort || 1024,
      logger: options.logger || (() => {}),
    };
  }

  /**
   * Checks if a specific port is available
   * @param port Port number to check
   * @returns Promise resolving to port check result
   */
  async checkPort(port: number): Promise<PortCheckResult> {
    if (port < this.options.minPort || port > this.options.maxPort) {
      return {
        port,
        available: false,
        error: `Port ${port} is outside valid range [${this.options.minPort}, ${this.options.maxPort}]`
      };
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        server.close();
        resolve({
          port,
          available: false,
          error: `Port check timed out after ${this.options.timeout}ms`
        });
      }, this.options.timeout);

      const server = net.createServer();

      server.once('error', (err: NodeJS.ErrnoException) => {
        clearTimeout(timeout);
        let error: string;

        switch (err.code) {
          case 'EADDRINUSE':
            error = 'Port is already in use';
            break;
          case 'EACCES':
            error = 'Permission denied (try a port > 1024)';
            break;
          case 'EADDRNOTAVAIL':
            error = 'Address not available';
            break;
          default:
            error = `Unexpected error: ${err.message}`;
        }

        resolve({
          port,
          available: false,
          error
        });
      });

      server.once('listening', () => {
        clearTimeout(timeout);
        server.close(() => {
          // Add small delay to ensure port is fully released
          setTimeout(() => {
            resolve({
              port,
              available: true
            });
          }, 100);
        });
      });

      try {
        server.listen(port, this.options.host);
      } catch (err) {
        clearTimeout(timeout);
        resolve({
          port,
          available: false,
          error: `Failed to start server: ${err instanceof Error ? err.message : String(err)}`
        });
      }
    });
  }

  /**
   * Finds the first available port starting from a given port
   * @param startPort Port to start searching from
   * @returns Promise resolving to available port number
   */
  async findAvailablePort(startPort: number = DEFAULT_DEV_PORT): Promise<number> {
    let port = Math.max(startPort, this.options.minPort);

    this.options.logger(`Searching for available port starting from ${port}...`);

    while (port <= this.options.maxPort) {
      const result = await this.checkPort(port);

      if (result.available) {
        this.options.logger(`Found available port: ${port}`);
        return port;
      } else {
        this.options.logger(`Port ${port} unavailable: ${result.error}`);
        port++;
      }
    }

    throw new Error(
      `Could not find an available port between ${this.options.minPort} and ${this.options.maxPort}. ` +
      `Last checked port: ${port - 1}`
    );
  }

  /**
   * Finds multiple available ports
   * @param count Number of ports to find
   * @param startPort Port to start searching from
   * @returns Promise resolving to array of available ports
   */
  async findMultiplePorts(count: number, startPort: number = DEFAULT_DEV_PORT): Promise<number[]> {
    const ports: number[] = [];
    let currentPort = startPort;

    for (let i = 0; i < count; i++) {
      const port = await this.findAvailablePort(currentPort);
      ports.push(port);
      currentPort = port + 1; // Start next search from next port
    }

    return ports;
  }

  /**
   * Gets port finder statistics
   * @returns Object with port range information
   */
  getStats() {
    return {
      host: this.options.host,
      timeout: this.options.timeout,
      portRange: {
        min: this.options.minPort,
        max: this.options.maxPort,
        total: this.options.maxPort - this.options.minPort + 1
      }
    };
  }
}

/**
 * Convenience function for finding available port
 * @param startPort Port to start searching from
 * @param options Port finder options
 * @returns Promise resolving to available port
 */
export async function findAvailablePort(
  startPort: number = DEFAULT_DEV_PORT,
  options: PortFinderOptions = {}
): Promise<number> {
  const finder = new PortFinder(options);
  return finder.findAvailablePort(startPort);
}

/**
 * Convenience function for checking port availability
 * @param port Port to check
 * @param options Port finder options
 * @returns Promise resolving to port check result
 */
export async function checkPort(
  port: number,
  options: PortFinderOptions = {}
): Promise<PortCheckResult> {
  const finder = new PortFinder(options);
  return finder.checkPort(port);
}

// Default ports for Fluent VX
export const DEFAULT_DEV_PORT = 5002;
export const DEFAULT_PREVIEW_PORT = 4100;

/**
 * Pre-configured port finder for development
 */
export const devPortFinder = new PortFinder({
  host: '127.0.0.1',
  timeout: 2000,
  logger: (message: string) => console.log(`[PortFinder] ${message}`)
});
