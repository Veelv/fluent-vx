import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate hash for cache busting
 */
export function generateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

/**
 * Generate hashed filename
 */
export function getHashedFilename(filename: string, content: string): string {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const hash = generateHash(content);
  return `${name}.${hash}${ext}`;
}

/**
 * Create professional .vx directory structure
 */
export function createVxStructure(baseDir: string): void {
  const dirs = [
    'assets',
    'assets/css',
    'assets/js',
    'assets/images',
    'assets/fonts'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
}

/**
 * Generate PWA manifest
 */
export function generatePWAManifest(appName: string = 'Fluent VX App'): string {
  return JSON.stringify({
    name: appName,
    short_name: appName,
    description: 'A Fluent VX application',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0070f3',
    icons: [
      {
        src: '/assets/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/assets/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }, null, 2);
}

/**
 * Generate robots.txt
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
`;
}

/**
 * Generate basic service worker
 */
export function generateServiceWorker(): string {
  return `// Fluent VX Service Worker v0.1.13
const CACHE_NAME = 'fluent-vx-v0.1.13';
const STATIC_CACHE = 'fluent-vx-static-v0.1.13';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/assets/style.css',
        '/assets/app.js',
        '/manifest.json'
      ]);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});
`;
}

/**
 * Generate build stats
 */
export interface BuildStats {
  totalSize: number;
  files: Array<{
    name: string;
    size: number;
    hashed?: string;
  }>;
  buildTime: number;
}

export function generateBuildStats(files: Array<{path: string, content: string}>, buildTime: number): BuildStats {
  const stats: BuildStats = {
    totalSize: 0,
    files: [],
    buildTime
  };

  files.forEach(({path: filePath, content}) => {
    const size = Buffer.byteLength(content, 'utf8');
    stats.totalSize += size;
    stats.files.push({
      name: path.basename(filePath),
      size,
      hashed: getHashedFilename(path.basename(filePath), content)
    });
  });

  return stats;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}