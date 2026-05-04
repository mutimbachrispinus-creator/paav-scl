import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';

const url = process.env.TURSO_URL || 'https://placeholder-to-avoid-build-error.turso.io';
const client = createClient({
  url,
  authToken: process.env.TURSO_TOKEN,
});

export const db = drizzle(client, { schema });
