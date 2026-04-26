import { NextResponse } from 'next/server';
import { stkPush } from '@/lib/mpesa';

export async function POST(req) {
  try {
    const { phone, amount, accountRef, description, term, shortcode, passkey } = await req.json();

    if (!phone || !amount || !accountRef) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

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
