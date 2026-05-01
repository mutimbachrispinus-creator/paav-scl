import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { tenant, username, newPassword } = await request.json();
    if (!tenant || !username || !newPassword) {
      return NextResponse.json({ error: 'tenant, username, and newPassword are required' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    
    // Check if user exists
    const users = await query('SELECT id FROM staff WHERE username = ? AND tenant_id = ?', [username, tenant]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found in this tenant' }, { status: 404 });
    }

    await execute('UPDATE staff SET password = ? WHERE username = ? AND tenant_id = ?', [hashed, username, tenant]);
    
    return NextResponse.json({ ok: true, message: `Password for ${username} in ${tenant} has been reset.` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
