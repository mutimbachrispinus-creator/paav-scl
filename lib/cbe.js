/**
 * lib/cbe.js — Legacy Wrapper for Multi-Curriculum Support
 *
 * This file maintains backward compatibility for the Kenya CBC system
 * while providing access to British and IB curricula.
 */

import { getCurriculum as getCurriculumFactory } from './curriculum/index';
import { 
  PRE, LOWER, UPPER, JSS, SENIOR, ALL_GRADES, 
  DEFAULT_SUBJECTS as CBC_DEFAULT_SUBJECTS, 
  JSS_SCALE, PRIMARY_SCALE 
} from './curriculum/cbc';

// Explicitly use the curriculum factory internally
const getCurriculum = getCurriculumFactory;

// Default (Kenya CBC) constants exported for legacy support
export { PRE, LOWER, UPPER, JSS, SENIOR, ALL_GRADES, JSS_SCALE, PRIMARY_SCALE, getCurriculumFactory as getCurriculum };
export const DEFAULT_SUBJECTS = CBC_DEFAULT_SUBJECTS;

/**
 * Get the grades list for a specific curriculum
 */
export function getAllGrades(curriculum = 'CBC') {
  return getCurriculum(curriculum).ALL_GRADES || [];
}

/**
 * Get default subjects for a grade and curriculum
 */
export function getDefaultSubjects(grade, curriculum = 'CBC') {
  const curr = getCurriculum(curriculum);
  return curr.DEFAULT_SUBJECTS?.[grade] || [];
}

export function gradeGroup(grade, curriculum = 'CBC') {
  return getCurriculum(curriculum).gradeGroup(grade);
}

export function isJSSGrade(grade, curriculum = 'CBC') {
  const curr = getCurriculum(curriculum);
  if (curr.isJSSGrade) return curr.isJSSGrade(grade);
  if (curr.isSecondary) return curr.isSecondary(grade);
  return false;
}

export function gInfo(score, grade, cfg = null, curriculum = 'CBC') {
  const curr = getCurriculum(curriculum);
  if (!curr.gInfo) return { lv: '—', pts: 0, c: '#333', bg: '#eee', desc: '' };
  return curr.gInfo(score, grade, cfg);
}

export function maxPts(grade, subjects = null, curriculum = 'CBC') {
  const curr = getCurriculum(curriculum);
  if (!curr.maxPts) return 0;
  return curr.maxPts(grade, subjects);
}

export function getDistributionBuckets(grade, curriculum = 'CBC') {
  const curr = getCurriculum(curriculum);
  if (!curr.getDistributionBuckets) return {};
  return curr.getDistributionBuckets(grade);
}

export function getGradeColors(curriculum = 'CBC') {
  const curr = getCurriculum(curriculum);
  if (!curr.getGradeColors) return {};
  return curr.getGradeColors();
}

/**
 * Utility to fetch a mark for a specific student, subject, and assessment.
 */
export function getMark(marks, term, grade, subject, assess, adm) {
  if (!marks) return null;
  const k1 = `${term}:${grade}|${subject}|${assess}`;
  const k0 = `${grade}|${subject}|${assess}`;
  const score = marks[k1]?.[adm] ?? marks[k0]?.[adm];
  return (score !== undefined && score !== null && score !== '') ? Number(score) : null;
}

/**
 * Calculate total points for one learner across all their subjects.
 */
export function calcLearnerPoints(marks, adm, grade, term, assess, subjects, cfg = null, curriculum = 'CBC') {
  let totalPts = 0;
  let enteredCount = 0;
  const detail = [];
  const curr = getCurriculum(curriculum);

  for (const subj of subjects) {
    const score = getMark(marks, term, grade, subj, assess, adm);

    if (score !== null) {
      const info = gInfo(score, grade, cfg, curriculum);
      totalPts += info.pts;
      enteredCount++;
      detail.push({ subj, score, ...info });
    } else {
      detail.push({ subj, score: null, lv: '—', pts: 0, c: 'var(--muted)', bg: 'transparent', desc: '' });
    }
  }

  return { totalPts, enteredCount, maxTotal: maxPts(grade, subjects, curriculum), detail };
}

/**
 * Calculate averages across 3 assessments (Opener, Mid, End)
 */
export function calcLearnerReportData(marks, adm, grade, term, subjects, cfg = null, curriculum = 'CBC') {
  const result = [];
  let totalAvgPts = 0;
  let totalEntered = 0;
  let totalAvgScore = 0;

  for (const s of subjects) {
    const op = getMark(marks, term, grade, s, 'op1', adm);
    const mt = getMark(marks, term, grade, s, 'mt1', adm);
    const et = getMark(marks, term, grade, s, 'et1', adm);
    
    const count = (op !== null ? 1 : 0) + (mt !== null ? 1 : 0) + (et !== null ? 1 : 0);
    const avg = count ? Number((((op||0) + (mt||0) + (et||0)) / count).toFixed(2)) : 0;
    
    const opInfo = op !== null ? gInfo(op, grade, cfg, curriculum) : { lv: '—', pts: 0 };
    const mtInfo = mt !== null ? gInfo(mt, grade, cfg, curriculum) : { lv: '—', pts: 0 };
    const etInfo = et !== null ? gInfo(et, grade, cfg, curriculum) : { lv: '—', pts: 0 };
    const avgInfo = count > 0 ? gInfo(avg, grade, cfg, curriculum) : { lv: '—', pts: 0 };

    if (count > 0) {
      totalAvgPts += avgInfo.pts;
      totalAvgScore += avg;
      totalEntered++;
    }

    result.push({
      subj: s,
      op, opLv: opInfo.lv,
      mt, mtLv: mtInfo.lv,
      et, etLv: etInfo.lv,
      avg, avgLv: avgInfo.lv,
      pts: avgInfo.pts,
      desc: avgInfo.desc
    });
  }

  return {
    subjects: result,
    totalAvgPts,
    totalAvgScore,
    totalEntered,
    overallInfo: totalEntered ? gInfo(Number((totalAvgScore / totalEntered).toFixed(2)), grade, cfg, curriculum) : { lv: '—', pts: 0 }
  };
}

/**
 * Build a ranked merit list for a grade / assessment.
 */
export function buildMeritList(learners, marks, grade, term = 'T1', assess = 'mt1', cfg = null, curriculum = 'CBC') {
  const curr = getCurriculum(curriculum);
  const subjects = curr.DEFAULT_SUBJECTS?.[grade] || [];
  
  const prevAssess = assess === 'et1' ? 'mt1' : assess === 'mt1' ? 'op1' : null;

  const graded = learners
    .filter(l => l.grade === grade)
    .map(l => {
      const current = calcLearnerPoints(marks, l.adm, grade, term, assess, subjects, cfg, curriculum);
      
      let vap = 0;
      if (prevAssess) {
        const prev = calcLearnerPoints(marks, l.adm, grade, term, prevAssess, subjects, cfg, curriculum);
        if (prev.enteredCount > 0) {
          vap = current.totalPts - prev.totalPts;
        }
      }

      return { ...l, ...current, vap };
    })
    .filter(l => l.enteredCount > 0)
    .sort((a, b) => b.totalPts - a.totalPts);

  let rank = 1;
  for (let i = 0; i < graded.length; i++) {
    if (i > 0 && graded[i].totalPts < graded[i - 1].totalPts) {
      rank = i + 1;
    }
    graded[i].rank = rank;
  }

  return graded;
}

export function promotionStatus(totalPts, maxTotal) {
  if (maxTotal === 0) return 'review';
  const pct = (totalPts / maxTotal) * 100;
  if (pct >= 50) return 'promote';
  if (pct >= 30) return 'review';
  return 'retain';
}

export function fmtK(n) {
  return 'KSH ' + Number(n || 0).toLocaleString('en-KE');
}

export function today() {
  return new Date().toISOString().split('T')[0];
}
