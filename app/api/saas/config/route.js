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
    const tenantId = searchParams.get('tenant') || 'platform-master';

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

    const isMaster = tenantId === 'platform-master';

    return NextResponse.json({
      tenantId,
      profile: config.paav_school_profile || { 
        name: isMaster ? 'EduVantage Master Console' : 'EduVantage School', 
        email: 'portal@eduvantage.app', 
        phone: '+254 792 656 579', 
        logo: '/eduvantage-logo.png' 
      },
      announcement: config.paav_announcement?.text || 'Welcome to the EduVantage School Network.',
      theme: config.paav_theme || { 
        primary: isMaster ? '#1E40AF' : '#2563EB', 
        secondary: '#D4AF37', 
        accent: '#0F172A' 
      }
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
