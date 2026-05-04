import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.js',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_URL || 'file:local.db',
    authToken: process.env.TURSO_TOKEN,
  },
});
