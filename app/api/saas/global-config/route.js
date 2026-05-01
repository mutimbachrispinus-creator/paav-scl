import { NextResponse } from 'next/server';
import { kvGet, kvSet } from '@/lib/db';
import { getSession } from '@/lib/auth';

const CONFIG_KEY = 'edu_global_config';
const MASTER_TENANT = 'platform-master';

export async function GET() {
  try {
    const config = await kvGet(CONFIG_KEY, MASTER_TENANT) || {
      paymentMethods: ['M-Pesa Paybill', 'Bank Deposit', 'Cash']
    };
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'super-admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    await kvSet(CONFIG_KEY, body, MASTER_TENANT);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
