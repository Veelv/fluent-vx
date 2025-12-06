/**
 * Hot Module Replacement (HMR) System for Fluent VX
 * Professional HMR with selective updates and state preservation
 */

import WebSocket from 'ws';
import { DevCache } from './cache';

export interface HMREvent {
  type: 'reload' | 'update' | 'style-update' | 'component-update' | 'route-update';
  moduleId: string;
  filePath: string;
  content?: string;
  dependencies?: string[];
  timestamp: number;
  metadata?: any;
}

export interface HMRClient {
  id: string;
  ws: WebSocket;
  connectedAt: number;
}

/**
 * HMR Server with intelligent module tracking
 */
export class HMRServer {
  private wss: WebSocket.Server | null = null;
  private clients = new Map<string, HMRClient>();
  private cache: DevCache;
  private port: number;

  constructor(port: number, cache: DevCache) {
    this.port = port;
    this.cache = cache;
    this.initialize();
  }

  private initialize(): void {
    try {
      this.wss = new WebSocket.Server({ 
        port: this.port,
        perMessageDeflate: false
      });

      this.wss.on('connection', (ws: WebSocket) => {
        const clientId = this.generateClientId();
        const client: HMRClient = {
          id: clientId,
          ws,
          connectedAt: Date.now()
        };

        this.clients.set(clientId, client);
        console.log(`🔗 HMR client connected: ${clientId}`);

        ws.on('close', () => {
          this.clients.delete(clientId);
          console.log(`🔌 HMR client disconnected: ${clientId}`);
        });

        ws.on('error', (error) => {
          console.warn(`HMR client error ${clientId}:`, error.message);
          this.clients.delete(clientId);
        });
      });

      this.wss.on('error', (error) => {
        console.warn('HMR server error:', error.message);
      });

      console.log(`🔥 HMR server started on port ${this.port}`);
    } catch (error) {
      console.error('Failed to initialize HMR server:', error);
      throw error;
    }
  }

  /**
   * Handle file change with intelligent HMR
   */
  async handleFileChange(filePath: string, content: string): Promise<void> {
    const moduleId = this.getModuleId(filePath);
    const hash = this.generateHash(content);

    // Check if module needs update
    if (this.cache.isValid(moduleId, hash)) {
      return; // No change
    }

    // Invalidate affected modules
    const invalidated = this.cache.invalidate(moduleId);

    // Determine HMR event type
    const event = this.createHMREvent(filePath, content, invalidated);

    // Send to all clients
    this.broadcast(event);

    console.log(`🔥 HMR: ${event.type} for ${moduleId}`);
  }

  /**
   * Create appropriate HMR event based on file type and impact
   */
  private createHMREvent(filePath: string, content: string, invalidated: string[]): HMREvent {
    const moduleId = this.getModuleId(filePath);
    const moduleGraph = this.cache.getModuleGraph();
    const moduleInfo = moduleGraph.get(moduleId);

    // Style changes - hot injection
    if (filePath.endsWith('.css') || filePath.includes('#style')) {
      return {
        type: 'style-update',
        moduleId,
        filePath,
        content,
        timestamp: Date.now()
      };
    }

    // Layout changes - full reload
    if (filePath.includes('/app.vx')) {
      return {
        type: 'reload',
        moduleId,
        filePath,
        dependencies: invalidated,
        timestamp: Date.now()
      };
    }

    // Page changes - route update
    if (filePath.includes('/pages/')) {
      return {
        type: 'route-update',
        moduleId,
        filePath,
        content,
        timestamp: Date.now()
      };
    }

    // Component changes - selective update
    return {
      type: 'component-update',
      moduleId,
      filePath,
      content,
      dependencies: invalidated,
      timestamp: Date.now()
    };
  }

  /**
   * Broadcast HMR event to all clients
   */
  private broadcast(event: HMREvent): void {
    const message = JSON.stringify(event);

    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Generate client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get module ID from file path
   */
  private getModuleId(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Generate content hash
   */
  private generateHash(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
  }

  /**
   * Close HMR server
   */
  close(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.clients.clear();
      console.log('🛑 HMR server stopped');
    }
  }
}

/**
 * HMR Client-side runtime
 */
export class HMRRuntime {
  private ws: WebSocket | null = null;
  private port: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(port: number) {
    this.port = port;
    this.connect();
  }

  private connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(`ws://localhost:${this.port}`);

      this.ws.onopen = () => {
        console.log('🔗 HMR connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const hmrEvent: HMREvent = JSON.parse(event.data.toString());
          this.handleEvent(hmrEvent);
        } catch (error) {
          console.error('HMR: Failed to parse event:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 HMR disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('HMR connection error:', error);
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('HMR: Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('HMR: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`HMR: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    setTimeout(() => this.connect(), delay);
  }

  private handleEvent(event: HMREvent): void {
    console.log(`🔥 HMR: ${event.type} for ${event.moduleId}`);

    switch (event.type) {
      case 'reload':
        window.location.reload();
        break;

      case 'style-update':
        this.updateStyles(event.content!);
        break;

      case 'route-update':
        this.updateRoute(event.moduleId);
        break;

      case 'component-update':
        this.updateComponent(event);
        break;

      default:
        console.warn('HMR: Unknown event type:', event.type);
    }
  }

  private updateStyles(cssContent: string): void {
    // Remove old styles
    const existing = document.querySelector('style[data-hmr]');
    if (existing) {
      existing.remove();
    }

    // Add new styles
    const style = document.createElement('style');
    style.setAttribute('data-hmr', 'true');
    style.textContent = cssContent;
    document.head.appendChild(style);
  }

  private updateRoute(moduleId: string): void {
    // Trigger route re-render (would integrate with router)
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('hmr:route-update', {
        detail: { moduleId }
      }));
    }
  }

  private updateComponent(event: HMREvent): void {
    // Selective component update (would integrate with reactivity system)
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('hmr:component-update', {
        detail: event
      }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}