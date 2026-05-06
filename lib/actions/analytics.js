'use server';

import { kvGet } from '@/lib/db';
import { getCurriculum, gInfo } from '@/lib/cbe';

/**
 * lib/actions/analytics.js — High-performance academic aggregations
 */

export async function getAcademicStats({ tenantId, grade, term, curriculum = 'CBC' }) {
  try {
    const [learners, allMarks] = await Promise.all([
      kvGet('paav6_learners', [], tenantId),
      kvGet('paav6_marks', {}, tenantId)
    ]);

    const gradeLearners = learners.filter(l => l.grade === grade);
    // Build a map for O(1) learner lookup
    const learnerMap = new Map();
    gradeLearners.forEach(l => learnerMap.set(l.adm, l));

    // allMarks is { "TERM:GRADE|SUBJ|ASSESS": { ADM: SCORE } }
    const marksForGrade = [];
    
    // Precise match prefix: "TERM 1:GRADE 1"
    const targetPrefix = `${term}:${grade}|`;

    Object.entries(allMarks).forEach(([key, students]) => {
      // Use startsWith or split to avoid matching "GRADE 1" inside "GRADE 11"
      if (key.startsWith(targetPrefix)) {
        Object.entries(students).forEach(([adm, score]) => {
          marksForGrade.push({ key, adm, score: Number(score) });
        });
      }
    });

    if (marksForGrade.length === 0) {
      return {
        success: true,
        data: { subjectMastery: [], genderComparison: [], streamComparison: [], studentCount: gradeLearners.length }
      };
    }

    // 1. Subject Mastery
    const subjectMap = {};
    marksForGrade.forEach(m => {
      // key format: "TERM:GRADE|SUBJ|ASSESS"
      const parts = m.key.split('|');
      const subject = parts[1] || 'Unknown';
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

    // 2. Gender & Stream in one pass
    const genderStats = { Boys: { total: 0, count: 0 }, Girls: { total: 0, count: 0 } };
    const streamMap = {};

    marksForGrade.forEach(m => {
      const student = learnerMap.get(m.adm);
      if (student) {
        // Gender
        if (genderStats[student.sex]) {
          genderStats[student.sex].total += m.score;
          genderStats[student.sex].count++;
        }
        // Stream
        if (student.stream) {
          if (!streamMap[student.stream]) streamMap[student.stream] = { total: 0, count: 0 };
          streamMap[student.stream].total += m.score;
          streamMap[student.stream].count++;
        }
      }
    });

    const genderComparison = Object.entries(genderStats).map(([sex, data]) => ({
      name: sex,
      average: data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0
    }));

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
