
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client/web';

export async function GET() {
  const url = 'https://paav-school-portal-mutimba.aws-ap-south-1.turso.io';
  const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzgyNjIwMDIsImlkIjoiMDE5ZGM2NWYtODkwMS03MjA1LWIyYzEtOWQ1ODE2NDczMWU1IiwicmlkIjoiMWFmMzc1N2MtZjNlOS00YzI5LThlMjYtNTg3ODViNzJkMGNiIn0.mq7xtXfkF_DnT9fXb0o7axIxGoK2Vo-nP5VsvuoDsrvk0xjkXro9wOiCoBsaAh-EDIPBQ5-5shu4If-dnzagAQ';
  const client = createClient({ url, authToken: token });

  try {
    const tenantId = 'paav-gitombo';
    const learners = await client.execute({ sql: "SELECT COUNT(*) as c FROM learners WHERE tenant_id = ?", args: [tenantId] });
    const marks = await client.execute({ sql: "SELECT COUNT(*) as c FROM marks WHERE tenant_id = ?", args: [tenantId] });
    const paylog = await client.execute({ sql: "SELECT COUNT(*) as c FROM paylog WHERE tenant_id = ?", args: [tenantId] });
    const deleted = await client.execute({ sql: "SELECT COUNT(*) as c FROM deleted_learners WHERE tenant_id = ?", args: [tenantId] });
    const kv = await client.execute({ sql: "SELECT key, length(value) as len FROM kv WHERE tenant_id = ?", args: [tenantId] });

    return NextResponse.json({
      ok: true,
      counts: {
        learners: learners.rows[0].c,
        marks: marks.rows[0].c,
        paylog: paylog.rows[0].c,
        deleted_learners: deleted.rows[0].c
      },
      kv_keys: kv.rows
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
