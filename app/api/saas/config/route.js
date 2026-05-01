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

    let stats = null;
    if (isMaster) {
      try {
        const schoolsRows = await query("SELECT COUNT(*) as count FROM subscriptions WHERE tenant_id != 'platform-master'");
        const learnersRows = await query("SELECT COUNT(*) as count FROM learners");
        stats = {
          schools: Number(schoolsRows[0]?.count || 0),
          learners: Number(learnersRows[0]?.count || 0)
        };
      } catch (e) {
        console.error('Failed to fetch public stats:', e);
      }
    }

    // Override profile if it's the master tenant to prevent flickering or incorrect DB data
    let profileData = config.paav_school_profile;
    if (isMaster) {
      profileData = {
        name: 'EduVantage School Management System',
        email: 'portal@eduvantage.app',
        phone: '+254 792 656 579',
        logo: '/ev-brand-v3.png',
        tagline: 'Global Education SaaS Network'
      };
    }

    const response = NextResponse.json({
      tenantId,
      profile: profileData || { 
        name: 'EduVantage School Management System', 
        email: 'portal@eduvantage.app', 
        phone: '+254 792 656 579', 
        logo: '/ev-brand-v3.png' 
      },
      stats,
      announcement: isMaster ? 'Welcome to the EduVantage Global Network.' : (config.paav_announcement?.text || 'Welcome to the EduVantage School Network.'),
      theme: isMaster ? { 
        primary: '#1E40AF', 
        secondary: '#D4AF37', 
        accent: '#0F172A' 
      } : (config.paav_theme || { 
        primary: '#2563EB', 
        secondary: '#D4AF37', 
        accent: '#0F172A' 
      })
    });

    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
