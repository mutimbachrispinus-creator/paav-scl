import { NextResponse } from 'next/server';
import { sendWhatsApp, getFeeReminderMessage } from '@/lib/twilio';
import { kvGet } from '@/lib/db';

export async function POST(req) {
  try {
    const { adm, balance } = await req.json();

    if (!adm) return NextResponse.json({ error: 'Admission number required' }, { status: 400 });

    const learners = await kvGet('paav6_learners') || [];
    const learner = learners.find(l => l.adm === adm);

    if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });
    if (!learner.phone) {
      return NextResponse.json({ error: 'Parent phone number not set' }, { status: 400 });
    }

    const message = getFeeReminderMessage(learner.name, balance);

    const result = await sendWhatsApp({
      to: learner.phone,
      body: message
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, sid: result.sid });
  } catch (err) {
    console.error('WhatsApp Reminder API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
