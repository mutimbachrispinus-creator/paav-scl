import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
export * from './utils';

const url = process.env.TURSO_URL || 'file:local.db';
const token = process.env.TURSO_TOKEN;

const client = createClient({
  url,
  authToken: token,
});

export const db = drizzle(client, { schema });
