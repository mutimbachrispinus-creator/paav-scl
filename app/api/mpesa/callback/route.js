import { NextResponse } from 'next/server';
import { parseStkCallback } from '@/lib/mpesa';
import { kvRecordPayment } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('M-Pesa Callback:', JSON.stringify(body, null, 2));

    const result = parseStkCallback(body);

    if (result.paid) {
      // accountRef was formatted as ADM:TERM (e.g. 101:T1)
      const [adm, term] = result.accountRef.split(':');
      
      await kvRecordPayment({
        adm: adm,
        term: term || 'T1',
        amount: result.amount,
        method: 'M-Pesa',
        ref: result.mpesaCode,
        by: 'M-Pesa STK',
        status: 'pending'
      });

      console.log(`Payment recorded: ${adm}, ${result.amount}, ${result.mpesaCode}`);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa Callback Error:', error);
    // Even if we fail, Safaricom wants a 200 OK with ResultCode 0 to stop retrying
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted with internal error' });
  }
}
