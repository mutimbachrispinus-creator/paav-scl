'use server';

import { kvGet } from '@/lib/db';
import { getCurriculum, gInfo } from '@/lib/cbe';

/**
 * lib/actions/analytics.js — High-performance academic aggregations
 */

export async function getAcademicStats({ tenantId, grade, term, curriculum = 'CBC' }) {
  try {
    const learners = await kvGet('paav6_learners', [], tenantId);
    const allMarks = await kvGet('paav6_marks', {}, tenantId);

    const gradeLearners = learners.filter(l => l.grade === grade);
    
    // Filter marks for this grade and term
    // allMarks is { "TERM:GRADE|SUBJ|ASSESS": { ADM: SCORE } }
    const marksForGrade = [];
    Object.entries(allMarks).forEach(([gsa, students]) => {
      if (gsa.includes(grade) && gsa.includes(term)) {
        Object.entries(students).forEach(([adm, score]) => {
          marksForGrade.push({ grade_subj_assess: gsa, adm, score: Number(score) });
        });
      }
    });

    // 1. Subject Mastery
    const subjectMap = {};
    marksForGrade.forEach(m => {
      const parts = m.grade_subj_assess.split('_');
      const subject = parts[1];
      if (!subjectMap[subject]) subjectMap[subject] = { total: 0, count: 0 };
      subjectMap[subject].total += m.score;
      subjectMap[subject].count++;
    });

    const subjectMastery = Object.entries(subjectMap).map(([name, data]) => {
      const avg = Number((data.total / data.count).toFixed(2));
      const info = gInfo(avg, grade, {}, curriculum);
      return {
        name,
        average: avg,
        level: info?.lv || '—',
        color: info?.color || '#8B1A1A'
      };
    }).sort((a, b) => b.average - a.average);

    // 2. Gender Performance
    const genderStats = {
      Boys: { total: 0, count: 0 },
      Girls: { total: 0, count: 0 }
    };

    marksForGrade.forEach(m => {
      const student = gradeLearners.find(l => l.adm === m.adm);
      if (student && genderStats[student.sex]) {
        genderStats[student.sex].total += m.score;
        genderStats[student.sex].count++;
      }
    });

    const genderComparison = Object.entries(genderStats).map(([sex, data]) => ({
      name: sex,
      average: data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0
    }));

    // 3. Stream Performance
    const streamMap = {};
    marksForGrade.forEach(m => {
      const student = gradeLearners.find(l => l.adm === m.adm);
      if (student && student.stream) {
        if (!streamMap[student.stream]) streamMap[student.stream] = { total: 0, count: 0 };
        streamMap[student.stream].total += m.score;
        streamMap[student.stream].count++;
      }
    });

    const streamComparison = Object.entries(streamMap).map(([name, data]) => ({
      name,
      average: Number((data.total / data.count).toFixed(2))
    }));

    return {
      success: true,
      data: {
        subjectMastery,
        genderComparison,
        streamComparison,
        studentCount: gradeLearners.length
      }
    };
  } catch (error) {
    console.error('Analytics Error:', error);
    return { success: false, error: error.message };
  }
}
