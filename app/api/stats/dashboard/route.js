export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { getAnnualFee, PRE, LOWER, UPPER, JSS, SENIOR } from '@/lib/school-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const tenantId = session.tenantId || 'platform-master';

  try {
    // 1. Basic counts
    const countRows = await query('SELECT COUNT(*) as count FROM learners WHERE tenant_id = ?', [tenantId]);
    const totalLearners = countRows[0].count;

    // 2. Financial summary
    const finRows = await query('SELECT SUM(t1 + t2 + t3) as totalPaid FROM learners WHERE tenant_id = ?', [tenantId]);
    const totalPaid = finRows[0].totalPaid || 0;

    // 2.5 Fetch Learner Limit
    const subRows = await query('SELECT learner_limit FROM subscriptions WHERE tenant_id = ?', [tenantId]);
    const learnerLimit = Number(subRows[0]?.learner_limit || 50);

    // 3. Enrolment by grade
    const gradeRows = await query('SELECT grade, COUNT(*) as count FROM learners WHERE tenant_id = ? GROUP BY grade', [tenantId]);
    const enrolmentByGrade = {};
    gradeRows.forEach(r => { enrolmentByGrade[r.grade] = r.count; });

    // 4. Calculate total expected (this still requires grade-level fee config knowledge)
    let totalExpected = 0;
    gradeRows.forEach(r => {
      totalExpected += r.count * getAnnualFee(r.grade);
    });

    // 5. Unread messages
    const msgRows = await query('SELECT COUNT(*) as count FROM messages WHERE tenant_id = ? AND msg_json NOT LIKE ?', [tenantId, `%${session.username}%`]);
    const unread = msgRows[0].count;

    // 6. Attendance Red-Flags (Students missing 3+ days in the last 14 school days)
    // We filter for status='A' (Absent)
    const redFlags = await query(`
      SELECT 
        SUBSTR(grade_date_adm, INSTR(grade_date_adm, '|') + 11) as adm,
        COUNT(*) as absent_count
      FROM attendance 
      WHERE tenant_id = ? 
        AND status = 'A'
        AND grade_date_adm LIKE '%' || STRFTIME('%Y-', 'now') || '%'
      GROUP BY adm
      HAVING absent_count >= 3
      ORDER BY absent_count DESC
      LIMIT 10
    `, [tenantId]);

    // Fetch names for these ADMs
    let redFlagDetails = [];
    if (redFlags.length > 0) {
      const adms = redFlags.map(r => r.adm);
      const placeholders = adms.map(() => '?').join(',');
      const learnerNames = await query(`SELECT adm, name, phone FROM learners WHERE tenant_id = ? AND adm IN (${placeholders})`, [tenantId, ...adms]);
      redFlagDetails = redFlags.map(rf => {
        const l = learnerNames.find(n => n.adm === rf.adm);
        return { ...rf, name: l?.name || 'Unknown', phone: l?.phone || '' };
      });
    }

    return NextResponse.json({
      ok: true,
      stats: {
        totalLearners,
        learnerLimit,
        totalPaid,
        totalExpected,
        enrolmentByGrade,
        unread,
        redFlags: redFlagDetails,
        collectionPct: totalExpected ? Math.round((totalPaid / totalExpected) * 100) : 0
      }
    });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
