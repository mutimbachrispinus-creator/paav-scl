export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { kvGet, kvSet } from '@/lib/db';

export async function POST(req) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    const messageId = params.get('id');
    const status = params.get('status');
    const phoneNumber = params.get('phoneNumber');
    const networkCode = params.get('networkCode');
    const failureReason = params.get('failureReason');

    if (!messageId || !status) {
      return NextResponse.json({ ok: false, error: 'Missing id or status' }, { status: 400 });
    }

    console.log(`[SMS Delivery] ID: ${messageId}, Status: ${status}, Phone: ${phoneNumber}`);

    // Update global SMS delivery log in KV
    const deliveryLog = (await kvGet('paav_sms_delivery_log', [], 'platform-master')) || [];
    deliveryLog.unshift({
      messageId,
      status,
      phoneNumber,
      networkCode,
      failureReason,
      timestamp: new Date().toISOString()
    });

    // Keep the last 1000 delivery receipts
    if (deliveryLog.length > 1000) deliveryLog.splice(1000);
    await kvSet('paav_sms_delivery_log', deliveryLog, 'platform-master');

    // Africa's Talking expects a 200 OK response
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[SMS Delivery Webhook Error]:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
