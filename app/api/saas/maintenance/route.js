export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { recoverOrphanedData } from '@/lib/db';

export async function POST(request) {
  try {
    const { tenantId } = await request.json();
    // Use platform-master or the actual tenant if provided
    const count = await recoverOrphanedData(tenantId || 'platform-master');
    return NextResponse.json({ ok: true, recovered: count });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
