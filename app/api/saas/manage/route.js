import { NextResponse } from 'next/server';
import { execute, batch, getClient } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/saas/manage
 * Actions: delete_school, update_billing
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || (session.tenantId !== 'platform-master' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized. Super-Admin access required.' }, { status: 403 });
    }

    const { action, tenantId, amount, cycle, plan, status, expiresAt } = await request.json();

    if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    if (tenantId === 'platform-master') return NextResponse.json({ error: 'Cannot manage platform-master' }, { status: 400 });

    if (action === 'delete_school') {
      const tables = ['kv', 'learners', 'staff', 'paylog', 'marks', 'attendance', 'messages', 'staff_requests', 'presence', 'duties', 'subscriptions'];
      const stmts = tables.map(t => ({
        sql: `DELETE FROM ${t} WHERE ${t === 'subscriptions' ? 'tenant_id' : 'tenant_id'} = ?`,
        args: [tenantId]
      }));
      
      // For subscriptions the primary key is tenant_id, others have it as a column
      await batch(stmts);
      return NextResponse.json({ ok: true, msg: `School ${tenantId} and all associated data deleted.` });
    }

    if (action === 'update_billing') {
      const sql = `
        INSERT INTO subscriptions (tenant_id, plan, status, amount, cycle, expires_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, strftime('%s','now'))
        ON CONFLICT(tenant_id) DO UPDATE SET
          plan = excluded.plan,
          status = excluded.status,
          amount = excluded.amount,
          cycle = excluded.cycle,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `;
      await execute(sql, [
        tenantId, 
        plan || 'basic', 
        status || 'active', 
        Number(amount || 0), 
        cycle || 'annual', 
        expiresAt || null
      ]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('[api/saas/manage] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
