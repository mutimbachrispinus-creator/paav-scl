import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [lRes, gRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM learners'),
      query('SELECT COUNT(DISTINCT grade) as count FROM learners')
    ]);
    
    return NextResponse.json({
      learners: lRes[0]?.count || 0,
      classes: gRes[0]?.count || 0,
      year: new Date().getFullYear(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
