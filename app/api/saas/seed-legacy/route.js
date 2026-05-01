import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function GET() {
  try {
    await execute("INSERT INTO subscriptions (tenant_id, plan, status, expires_at) VALUES ('paav-gitombo', 'premium', 'active', '2030-12-31') ON CONFLICT(tenant_id) DO NOTHING");
    return NextResponse.json({ ok: true, message: 'PAAV Gitombo seeded successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
