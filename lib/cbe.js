/**
 * lib/cbe.js — Legacy Wrapper for Multi-Curriculum Support
 *
 * This file maintains backward compatibility for the Kenya CBC system
 * while providing access to British and IB curricula.
 */

import { getCurriculum } from './curriculum/index';
export { getCurriculum };

// Lazy getters to avoid top-level initialization issues
export const PRE         = ['KINDERGARTEN','PP1','PP2'];
export const LOWER       = ['GRADE 1','GRADE 2','GRADE 3'];
export const UPPER       = ['GRADE 4','GRADE 5','GRADE 6'];
export const JSS         = ['GRADE 7','GRADE 8','GRADE 9'];
export const SENIOR      = ['GRADE 10','GRADE 11','GRADE 12'];
export const ALL_GRADES  = [...PRE, ...LOWER, ...UPPER, ...JSS, ...SENIOR];

export const DEFAULT_SUBJECTS = {
  'KINDERGARTEN': ['Language','Reading','Mathematics','Environmental Activity','Creative Activity'],
  'PP1':  ['Mathematics','Languages','Environmental Activity','C.R.E','Creative Activity'],
  'PP2':  ['Language','Reading','Mathematics','Environmental Activity','Creative Activity','C.R.E','Kiswahili','Kusoma'],
  'GRADE 1': ['Mathematics','English','Kiswahili','Environmental','C.R.E','C/A'],
  'GRADE 2': ['Mathematics','English','Kiswahili','Environmental','C.R.E','C/A'],
  'GRADE 3': ['Mathematics','English','Kiswahili','Environmental','C.R.E','C/A'],
  'GRADE 4': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','CRE','Agriculture','Home Science','Art & Craft','Music','Physical Education'],
  'GRADE 5': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','CRE','Agriculture','Home Science','Art & Craft','Music','Physical Education'],
  'GRADE 6': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','CRE','Agriculture','Home Science','Art & Craft','Music','Physical Education'],
  'GRADE 7': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies','Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE'],
  'GRADE 8': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies','Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE'],
  'GRADE 9': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies','Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE']
};
export const JSS_SCALE   = [
  { min: 80, lv: 'EE1', pts: 8 }, { min: 70, lv: 'EE2', pts: 7 },
  { min: 60, lv: 'ME1', pts: 6 }, { min: 50, lv: 'ME2', pts: 5 },
  { min: 40, lv: 'AE1', pts: 4 }, { min: 30, lv: 'AE2', pts: 3 },
  { min: 20, lv: 'BE1', pts: 2 }, { min:  0, lv: 'BE2', pts: 1 }
];
export const PRIMARY_SCALE = [
  { min: 80, lv: 'EE', pts: 4 }, { min: 50, lv: 'ME', pts: 3 },
  { min: 30, lv: 'AE', pts: 2 }, { min:  0, lv: 'BE', pts: 1 }
];

/**
 * Get the grades list for a specific curriculum
 */
export function getAllGrades(curriculum = 'CBC') {
  return getCurriculum(curriculum).ALL_GRADES;
}

/**
 * Get default subjects for a grade and curriculum
 */
export function getDefaultSubjects(grade, curriculum = 'CBC') {
  return getCurriculum(curriculum).DEFAULT_SUBJECTS[grade] || [];
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
  return getCurriculum(curriculum).gInfo(score, grade, cfg);
}

export function maxPts(grade, subjects = null, curriculum = 'CBC') {
  return getCurriculum(curriculum).maxPts(grade, subjects);
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
      const info = curr.gInfo(score, grade, cfg);
      totalPts += info.pts;
      enteredCount++;
      detail.push({ subj, score, ...info });
    } else {
      detail.push({ subj, score: null, lv: '—', pts: 0, c: 'var(--muted)', bg: 'transparent', desc: '' });
    }
  }

  return { totalPts, enteredCount, maxTotal: curr.maxPts(grade, subjects), detail };
}

/**
 * Calculate averages across 3 assessments (Opener, Mid, End)
 */
export function calcLearnerReportData(marks, adm, grade, term, subjects, cfg = null, curriculum = 'CBC') {
  const result = [];
  let totalAvgPts = 0;
  let totalEntered = 0;
  let totalAvgScore = 0;
  const curr = getCurriculum(curriculum);

  for (const s of subjects) {
    const op = getMark(marks, term, grade, s, 'op1', adm);
    const mt = getMark(marks, term, grade, s, 'mt1', adm);
    const et = getMark(marks, term, grade, s, 'et1', adm);
    
    const count = (op !== null ? 1 : 0) + (mt !== null ? 1 : 0) + (et !== null ? 1 : 0);
    const avg = count ? Math.round(((op||0) + (mt||0) + (et||0)) / count) : 0;
    
    const opInfo = op !== null ? curr.gInfo(op, grade, cfg) : { lv: '—', pts: 0 };
    const mtInfo = mt !== null ? curr.gInfo(mt, grade, cfg) : { lv: '—', pts: 0 };
    const etInfo = et !== null ? curr.gInfo(et, grade, cfg) : { lv: '—', pts: 0 };
    const avgInfo = count > 0 ? curr.gInfo(avg, grade, cfg) : { lv: '—', pts: 0 };

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
    overallInfo: totalEntered ? curr.gInfo(Math.round(totalAvgScore / totalEntered), grade, cfg) : { lv: '—', pts: 0 }
  };
}

/**
 * Build a ranked merit list for a grade / assessment.
 */
export function buildMeritList(learners, marks, grade, term = 'T1', assess = 'mt1', cfg = null, curriculum = 'CBC') {
  const curr = getCurriculum(curriculum);
  const subjects = curr.DEFAULT_SUBJECTS[grade] || [];
  
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
