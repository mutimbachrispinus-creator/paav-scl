import { createClient } from '@libsql/client/web.js';
import fs from 'fs';

const envContent = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : fs.readFileSync('.dev.vars', 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  }
});

const url = env.TURSO_URL;
const token = env.TURSO_TOKEN;

if (!url || !token) {
  console.log('TURSO_URL or TURSO_TOKEN is missing');
  process.exit(1);
}

console.log('Connecting to Turso:', url);

try {
  const client = createClient({ url, authToken: token });
  const result = await client.execute('SELECT COUNT(*) as count FROM staff');
  console.log('✅ Turso is working! Found staff members:', result.rows[0].count);
} catch (e) {
  console.error('❌ Failed to connect to Turso:', e.message);
}
