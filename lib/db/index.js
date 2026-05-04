import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';
export * from './utils';

// Using a dummy URL during build to satisfy the web client's scheme requirements
let url = process.env.TURSO_URL || 'https://dummy-db.turso.io';
if (url.startsWith('file:')) {
  url = 'https://dummy-db.turso.io';
}
const token = process.env.TURSO_TOKEN;

const client = createClient({
  url,
  authToken: token,
});

export const db = drizzle(client, { schema });
