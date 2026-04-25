import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  const url = process.env.TURSO_URL;
  const token = process.env.TURSO_TOKEN;

  let dbStatus = 'Not connected';
  let staffCount = 0;
  let dbError = null;

  try {
    if (!url || !token) {
      throw new Error('Missing environment variables');
    }

    const client = createClient({
      url: url,
      authToken: token,
    });

    const result = await client.execute('SELECT COUNT(*) as count FROM staff');
    staffCount = result.rows[0].count;
    dbStatus = 'Connected successfully';
  } catch (err) {
    dbStatus = 'Connection failed';
    dbError = err.message;
  }

  return NextResponse.json({
    env_vars_present: {
      TURSO_URL: !!url,
      TURSO_TOKEN: !!token,
    },
    database_status: dbStatus,
    staff_rows_found: staffCount,
    error: dbError
  });
}
