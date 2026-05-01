import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'super-admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Fetch all tenants and their metadata
    // We join subscriptions with kv to get school names
    const schools = await query(`
      SELECT 
        s.tenant_id, 
        s.plan, 
        s.status, 
        s.updated_at,
        (SELECT value FROM kv WHERE key = 'paav_school_profile' AND tenant_id = s.tenant_id) as profile_raw,
        (SELECT COUNT(*) FROM staff WHERE tenant_id = s.tenant_id AND role = 'parent') as student_count
      FROM subscriptions s
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
        studentCount: s.student_count
      };
    });

    return NextResponse.json({ 
      schools: formatted,
      stats: {
        totalSchools: formatted.length,
        totalStudents: formatted.reduce((sum, s) => sum + s.studentCount, 0),
        activeSchools: formatted.filter(s => s.status === 'active').length
      }
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
