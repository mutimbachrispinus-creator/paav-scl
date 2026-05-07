import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI === 'true' || process.env.VERCEL === '1' || process.env.CF_PAGES === '1';

const url = process.env.TURSO_URL || 'file:local.db';
const client = createClient({
  url,
  authToken: process.env.TURSO_TOKEN,
});

export const db = drizzle(client, { schema });
