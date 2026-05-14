import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

/**
 * Unified Database Entry Point for Drizzle ORM.
 * Designed for the Cloudflare Edge runtime.
 */

const url = (process.env.TURSO_URL || 'https://placeholder-during-build.turso.io').replace('libsql://', 'https://');
const token = process.env.TURSO_TOKEN || 'placeholder';

const client = createClient({
  url,
  authToken: token,
});

export const db = drizzle(client, { schema });

// Re-export core relational utilities
export * from '../db';
