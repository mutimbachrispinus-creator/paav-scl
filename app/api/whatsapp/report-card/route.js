import { NextResponse } from 'next/server';
import { sendWhatsApp, getResultNotificationMessage } from '@/lib/twilio';
import { kvGet } from '@/lib/db';
import { DEFAULT_SUBJECTS, gInfo, maxPts } from '@/lib/cbe';

export async function POST(req) {
  try {
    const { adm, term } = await req.json();

    if (!adm || !term) return NextResponse.json({ error: 'ADM and Term required' }, { status: 400 });

    const [learners, marks, gradCfg] = await Promise.all([
      kvGet('paav6_learners'),
      kvGet('paav6_marks'),
      kvGet('paav8_grad'),
    ]);

    const learner = (learners || []).find(l => l.adm === adm);
    if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });
    if (!learner.phone) {
      return NextResponse.json({ error: 'Parent phone number not set' }, { status: 400 });
    }

    // Calculate performance
    const subjects = DEFAULT_SUBJECTS[learner.grade] || [];
    let totalPts = 0;
    let enteredCount = 0;

    subjects.forEach(subj => {
      const assessments = ['op1', 'mt1', 'et1'];
      const scores = assessments
        .map(a => {
          const k1 = `${term}:${learner.grade}|${subj}|${a}`;
          const k0 = `${learner.grade}|${subj}|${a}`;
          return marks[k1]?.[adm] ?? marks[k0]?.[adm];
        })
        .filter(s => s !== undefined && s !== null);

      if (scores.length > 0) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const info = gInfo(avg, learner.grade, gradCfg);
        totalPts += info.pts;
        enteredCount++;
      }
    });

    const mPts = maxPts(learner.grade, subjects);
    const message = getResultNotificationMessage(learner.name, term.replace('T',''), totalPts, mPts);

    const result = await sendWhatsApp({
      to: learner.phone,
      body: message
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('WhatsApp Results API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
