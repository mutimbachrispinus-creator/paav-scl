export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getClient } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'bulkreset') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getClient();
    
    // Hash the default password
    const newHash = await hashPassword('EduVantage@123');
    
    // In SQLite, old legacy hashes are 64-character hex strings without colons.
    // Modern PBKDF2 hashes contain multiple colons (e.g. salt:iterations:len:hash).
    // So we update any row where the password does not contain a colon.
    const res = await db.execute({
      sql: "UPDATE staff SET password = ? WHERE password NOT LIKE '%:%'",
      args: [newHash]
    });

    return NextResponse.json({ 
      success: true, 
      message: 'All legacy users successfully reset to EduVantage@123',
      rows_affected: res.rowsAffected
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
