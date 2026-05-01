import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant') || 'platform-master';

    // If it's the platform master, we don't show any specific school stats
    if (tenantId === 'platform-master') {
      return NextResponse.json({
        learners: 0,
        classes: 0,
        year: new Date().getFullYear(),
      });
    }

    const [lRes, gRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM learners WHERE tenant_id = ?', [tenantId]),
      query('SELECT COUNT(DISTINCT grade) as count FROM learners WHERE tenant_id = ?', [tenantId])
    ]);
    
    return NextResponse.json({
      learners: lRes[0]?.count || 0,
      classes: gRes[0]?.count || 0,
      year: new Date().getFullYear(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
