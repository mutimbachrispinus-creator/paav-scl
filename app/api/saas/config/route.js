import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/saas/config?tenant=xxx
 * Returns public branding info for a school (name, logo, announcement).
 * No auth required.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant') || 'paav-gitombo';

    const keys = ['paav_school_profile', 'paav_announcement', 'paav_theme'];
    const placeholders = keys.map(() => '?').join(',');
    
    const rows = await query(
      `SELECT key, value FROM kv WHERE key IN (${placeholders}) AND tenant_id = ?`,
      [...keys, tenantId]
    );

    const config = {};
    rows.forEach(r => {
      try { config[r.key] = JSON.parse(r.value); } catch { config[r.key] = r.value; }
    });

    return NextResponse.json({
      tenantId,
      profile: config.paav_school_profile || { name: 'PAAV Gitombo', email: '', phone: '', logo: '' },
      announcement: config.paav_announcement?.text || 'Welcome to our school portal.',
      theme: config.paav_theme || { primary: '#8B1A1A', secondary: '#D4AF37', accent: '#1E293B' }
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
