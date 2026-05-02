import { NextResponse } from 'next/server';
import { stkPush } from '@/lib/mpesa';
import { getSession } from '@/lib/auth';
import { kvGet } from '@/lib/db';

export async function POST(req) {
  try {
    const { phone, amount, accountRef, description, term, paybillId } = await req.json();

    if (!phone || !amount || !accountRef) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const paybills = (await kvGet('paav_paybill_accounts', {}, session.tenantId)) || [];
    const paybill = paybills.find(p => String(p.id) === String(paybillId)) || paybills[0];

    if (!paybill || !paybill.shortcode || !paybill.passkey) {
      return NextResponse.json({ success: false, error: 'School Paybill not properly configured by Super Admin' }, { status: 400 });
    }

    const shortcode = paybill.shortcode;
    const passkey = paybill.passkey;

    const result = await stkPush({
      phone,
      amount,
      accountRef,
      description: description || 'School Fees',
      term,
      shortcode,
      passkey
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('STK Push API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
