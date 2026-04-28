import { NextResponse } from 'next/server';
import { parseStkCallback } from '@/lib/mpesa';
import { kvRecordPayment, kvGet } from '@/lib/db';

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

      // Optional: Trigger email receipt
      try {
        const learners = await kvGet('paav6_learners') || [];
        const l = learners.find(x => x.adm === adm);
        const feeCfg = await kvGet('paav6_feecfg') || {};
        const gradeCfg = feeCfg[l?.grade] || {};
        const annual = gradeCfg.annual || 5000;
        const paid = (l?.t1||0) + (l?.t2||0) + (l?.t3||0);
        const balance = annual - paid;

        if (l?.parentEmail) {
          // We can call our internal API route or the helper directly
          // Since we're in an API route already, let's just trigger it silently
          fetch(`${req.nextUrl.origin}/api/email/receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adm: adm,
              amount: result.amount,
              term: term || 'T1',
              ref: result.mpesaCode,
              balance: balance
            })
          }).catch(e => console.error('M-Pesa email trigger error:', e));
        }
      } catch (e) { console.error('M-Pesa email fetch error:', e); }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa Callback Error:', error);
    // Even if we fail, Safaricom wants a 200 OK with ResultCode 0 to stop retrying
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted with internal error' });
  }
}
