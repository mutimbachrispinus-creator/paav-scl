export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client/web';
import { getSession, hashPassword } from '@/lib/auth';
import { getClient } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'resetadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getClient();
    const newHash = await hashPassword('Junior@#1');
    
    // Update both global and tenant-specific admin accounts just in case
    const res = await db.execute({
      sql: "UPDATE staff SET password = ? WHERE username = 'admin'",
      args: [newHash]
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Admin password successfully reset to Junior@#1',
      rows_affected: res.rowsAffected
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
