import { NextResponse } from 'next/server';
import { kvGet } from '@/lib/db';

export async function GET() {
  try {
    const learners = (await kvGet('paav6_learners')) || [];
    
    const grades = new Set();
    learners.forEach(l => {
      if (l.grade) grades.add(l.grade);
    });

    return NextResponse.json({
      learners: learners.length,
      classes: grades.size,
      year: new Date().getFullYear(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
