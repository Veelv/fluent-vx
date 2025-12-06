/**
 * Dev server middleware for Fluent VX
 */

import express from 'express';

export function setupSecurityMiddleware(app: express.Application): void {
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

export function setupCompressionMiddleware(app: express.Application): void {
  // Compression is handled by the compression package at app level
}

export function setupCorsMiddleware(app: express.Application): void {
  app.use((req: any, res: any, next: any) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}