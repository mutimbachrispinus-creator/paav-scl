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
    
    const termAliases = [term];
    const termMatch = String(term || '').match(/(\d+)/);
    if (termMatch) {
      termAliases.push(`T${termMatch[1]}`, `TERM ${termMatch[1]}`);
    }
    const targetPrefixes = [...new Set(termAliases)].map(t => `${t}:${grade}|`);

    Object.entries(allMarks).forEach(([key, students]) => {
      // Use startsWith to avoid matching "GRADE 1" inside "GRADE 11"
      if (targetPrefixes.some(prefix => key.startsWith(prefix))) {
        Object.entries(students).forEach(([adm, score]) => {
          marksForGrade.push({ key, adm, score: Number(score) });
        });
      }
    });

    if (marksForGrade.length === 0) {
      return {
        success: true,
        data: {
          subjectMastery: [],
          genderComparison: [],
          streamComparison: [],
          assessmentComparison: [],
          levelDistribution: [],
          studentCount: gradeLearners.length,
          enteredLearners: 0,
          totalEntries: 0,
          completionRate: 0,
          classAverage: 0,
          riskCount: 0,
          excellenceCount: 0
        }
      };
    }

    // 1. Subject Mastery
    const subjectMap = {};
    const learnerTotals = {};
    const assessmentMap = {};
    const levelMap = {};

    marksForGrade.forEach(m => {
      // key format: "TERM:GRADE|SUBJ|ASSESS"
      const parts = m.key.split('|');
      const subject = parts[1] || 'Unknown';
      const assess = parts[2] || 'Assessment';
      if (!subjectMap[subject]) subjectMap[subject] = { total: 0, count: 0 };
      subjectMap[subject].total += m.score;
      subjectMap[subject].count++;

      if (!assessmentMap[assess]) assessmentMap[assess] = { total: 0, count: 0 };
      assessmentMap[assess].total += m.score;
      assessmentMap[assess].count++;

      if (!learnerTotals[m.adm]) learnerTotals[m.adm] = { total: 0, count: 0 };
      learnerTotals[m.adm].total += m.score;
      learnerTotals[m.adm].count++;

      const info = gInfo(m.score, grade, {}, curriculum);
      const lv = info?.lv || '—';
      if (!levelMap[lv]) levelMap[lv] = { name: lv, count: 0, color: info?.color || info?.c || '#64748B' };
      levelMap[lv].count++;
    });

    const subjectMastery = Object.entries(subjectMap).map(([name, data]) => {
      const avg = Number((data.total / data.count).toFixed(2));
      const info = gInfo(avg, grade, {}, curriculum);
      return {
        name,
        average: avg,
        entries: data.count,
        level: info?.lv || '—',
        color: info?.color || info?.c || '#8B1A1A'
      };
    }).sort((a, b) => b.average - a.average);

    const assessmentComparison = Object.entries(assessmentMap).map(([name, data]) => ({
      name,
      average: Number((data.total / data.count).toFixed(2)),
      entries: data.count
    })).sort((a, b) => a.name.localeCompare(b.name));

    const learnerAverages = Object.entries(learnerTotals).map(([adm, data]) => ({
      adm,
      average: data.count ? data.total / data.count : 0,
      entries: data.count
    }));

    const classAverage = learnerAverages.length
      ? Number((learnerAverages.reduce((sum, l) => sum + l.average, 0) / learnerAverages.length).toFixed(2))
      : 0;

    const riskCount = learnerAverages.filter(l => l.average < 40).length;
    const excellenceCount = learnerAverages.filter(l => l.average >= 80).length;

    // 2. Gender & Stream in one pass
    const genderStats = { Boys: { total: 0, count: 0 }, Girls: { total: 0, count: 0 } };
    const streamMap = {};

    marksForGrade.forEach(m => {
      const student = learnerMap.get(m.adm);
      if (student) {
        // Gender
        const sex = String(student.sex || student.gender || '').toLowerCase().startsWith('f') ? 'Girls' : 'Boys';
        if (genderStats[sex]) {
          genderStats[sex].total += m.score;
          genderStats[sex].count++;
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
      average: data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0,
      entries: data.count
    }));

    const streamComparison = Object.entries(streamMap).map(([name, data]) => ({
      name,
      average: Number((data.total / data.count).toFixed(2)),
      entries: data.count
    }));

    const enteredLearners = learnerAverages.length;
    const totalEntries = marksForGrade.length;
    const expectedEntries = Math.max(1, gradeLearners.length * Math.max(1, subjectMastery.length));

    return {
      success: true,
      data: {
        subjectMastery,
        genderComparison,
        streamComparison,
        assessmentComparison,
        levelDistribution: Object.values(levelMap).sort((a, b) => b.count - a.count),
        studentCount: gradeLearners.length,
        enteredLearners,
        totalEntries,
        completionRate: Number(((totalEntries / expectedEntries) * 100).toFixed(1)),
        classAverage,
        riskCount,
        excellenceCount
      }
    };
  } catch (error) {
    console.error('Analytics Error:', error);
    return { success: false, error: error.message };
  }
}
