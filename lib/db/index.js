import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

/**
 * Unified Database Entry Point for Drizzle ORM.
 * Designed for the Cloudflare Edge runtime.
 */

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

export const db = drizzle(client, { schema });

// Re-export core relational utilities
export * from '../db';
