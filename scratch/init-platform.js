import { execute, batch } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';

async function init() {
  console.log('🚀 Initializing Platform Master...');
  
  const now = Math.floor(Date.now() / 1000);
  const hashedPw = await hashPassword('Junior@#1'); // New super admin password
  
  const stmts = [
    // 1. Create Master Tenant
    {
      sql: "INSERT INTO subscriptions (tenant_id, plan, status, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING",
      args: ['platform-master', 'infinite', 'active', now]
    },
    // 2. Create Super Admin
    {
      sql: `INSERT INTO staff (id, tenant_id, name, username, role, password, status, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
            ON CONFLICT DO NOTHING`,
      args: ['sa-1', 'platform-master', 'PLATFORM OWNER', 'mutimba.junior', 'super-admin', hashedPw, 'active', new Date().toISOString()]
    },
    // 3. Set Master Branding
    {
      sql: "INSERT INTO kv (key, tenant_id, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET value=excluded.value",
      args: ['paav_school_profile', 'platform-master', JSON.stringify({ name: 'PAAV Platform Console', motto: 'Global Education Management' }), now]
    },
    {
      sql: "INSERT INTO kv (key, tenant_id, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET value=excluded.value",
      args: ['paav_theme', 'platform-master', JSON.stringify({ primary: '#1E293B', secondary: '#FCD34D', accent: '#334155' }), now]
    }
  ];

  try {
    await batch(stmts);
    console.log('✅ Platform Master Initialized!');
    console.log('Username: mutimba.junior');
    console.log('Password: Junior@#1');
    console.log('Tenant URL: /?tenant=platform-master');
  } catch (e) {
    console.error('❌ Initialization failed:', e);
  }
}

init();
