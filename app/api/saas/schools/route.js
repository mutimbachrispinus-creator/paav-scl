import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'super-admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const schools = await query(`
      SELECT 
        s.tenant_id, 
        s.plan, 
        s.status, 
        s.updated_at,
        (SELECT value FROM kv WHERE key = 'paav_school_profile' AND tenant_id = s.tenant_id) as profile_raw,
        (SELECT COUNT(*) FROM learners WHERE tenant_id = s.tenant_id) as student_count,
        (SELECT phone FROM staff WHERE tenant_id = s.tenant_id AND role = 'admin' LIMIT 1) as admin_phone,
        (SELECT name FROM staff WHERE tenant_id = s.tenant_id AND role = 'admin' LIMIT 1) as admin_name
      FROM subscriptions s
      UNION
      SELECT 
        'paav-gitombo' as tenant_id,
        'premium' as plan,
        'active' as status,
        0 as updated_at,
        (SELECT value FROM kv WHERE key = 'paav_school_profile' AND tenant_id = 'paav-gitombo') as profile_raw,
        (SELECT COUNT(*) FROM learners WHERE tenant_id = 'paav-gitombo') as student_count,
        (SELECT phone FROM staff WHERE tenant_id = 'paav-gitombo' AND role = 'admin' LIMIT 1) as admin_phone,
        (SELECT name FROM staff WHERE tenant_id = 'paav-gitombo' AND role = 'admin' LIMIT 1) as admin_name
      WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE tenant_id = 'paav-gitombo')
    `);

    const formatted = schools.map(s => {
      let profile = {};
      try { profile = JSON.parse(s.profile_raw || '{}'); } catch {}
      return {
        tenantId: s.tenant_id,
        name: profile.name || s.tenant_id,
        plan: s.plan,
        status: s.status,
        updatedAt: s.updated_at,
        studentCount: s.student_count,
        adminContact: s.admin_phone ? `${s.admin_name} (${s.admin_phone})` : 'N/A'
      };
    });

    return NextResponse.json({ 
      schools: formatted,
      stats: {
        totalSchools: formatted.length,
        totalStudents: formatted.reduce((sum, s) => sum + s.studentCount, 0),
        activeSchools: formatted.filter(s => s.status === 'active' || s.plan === 'premium').length
      }
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
