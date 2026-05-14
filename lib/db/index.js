import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

/**
 * Unified Database Entry Point for Drizzle ORM.
 * Designed for the Cloudflare Edge runtime.
 */

// Lazy initialization for Edge compatibility
let _db = null;

export function getDb() {
  if (_db) return _db;

  const rawUrl = process.env.TURSO_URL || 'https://placeholder-during-build.turso.io';
  const token = process.env.TURSO_TOKEN || 'placeholder';

  // Handle file: URLs on Edge (build-time safety)
  const isEdge = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
  const isFile = rawUrl.startsWith('file:');
  const url = (isEdge && isFile) ? 'https://placeholder-during-build.turso.io' : rawUrl.replace('libsql://', 'https://');

  const client = createClient({
    url,
    authToken: token,
  });

  _db = drizzle(client, { schema });
  return _db;
}

// Keep a proxy for backwards compatibility with `import { db } from '@/lib/db'`
export const db = new Proxy({}, {
  get: (_, prop) => {
    const instance = getDb();
    return instance[prop];
  }
});

// Re-export core relational utilities
export * from '../db';
