/**
 * lib/cbe.js — Kenya CBC (Competency-Based Curriculum) Grading Engine
 *
 * Faithfully ported from the gInfo() / maxPts() functions in index-122.html.
 * Used server-side (report cards, merit lists) and re-exported to the client
 * via a lightweight JSON API so the browser never needs to reimplement it.
 *
 * Grade bands:
 *   Pre-School (KG, PP1, PP2)   → 4-level scale (EE / ME / AE / BE), 4 pts/subject
 *   Lower Primary (Gr 1–3)      → 4-level scale, 4 pts/subject
 *   Upper Primary (Gr 4–6)      → 4-level scale, 4 pts/subject
 *   JSS (Gr 7–9)                → 8-level scale (EE1–BE2), 8 pts/subject
 *   Senior School (Gr 10–12)    → same 8-level scale as JSS
 */

/* ─── Grade group constants ─────────────────────────────────────────────── */
export const PRE    = ['KINDERGARTEN','PP1','PP2'];
export const LOWER  = ['GRADE 1','GRADE 2','GRADE 3'];
export const UPPER  = ['GRADE 4','GRADE 5','GRADE 6'];
export const JSS    = ['GRADE 7','GRADE 8','GRADE 9'];
export const SENIOR = ['GRADE 10','GRADE 11','GRADE 12'];
export const ALL_GRADES = [...PRE, ...LOWER, ...UPPER, ...JSS, ...SENIOR];

export function gradeGroup(grade) {
  if (PRE.includes(grade))    return 'pre_school';
  if (LOWER.includes(grade))  return 'lower_primary';
  if (UPPER.includes(grade))  return 'upper_primary';
  if (SENIOR.includes(grade)) return 'senior_school';
  return 'jss';  // default for GRADE 7-9
}

/* ─── Default subjects per grade ────────────────────────────────────────── */
export const DEFAULT_SUBJECTS = {
  'KINDERGARTEN': ['Language','Reading','Mathematics','Environmental Activity','Creative Activity'],
  'PP1':  ['Mathematics','Languages','Environmental Activity','C.R.E','Creative Activity'],
  'PP2':  ['Language','Reading','Mathematics','Environmental Activity','Creative Activity','C.R.E','Kiswahili','Kusoma'],
  'GRADE 1': ['Mathematics','English','Kiswahili','Environmental','C.R.E','C/A'],
  'GRADE 2': ['Mathematics','English','Kiswahili','Environmental','C.R.E','C/A'],
  'GRADE 3': ['Mathematics','English','Kiswahili','Environmental','C.R.E','C/A'],
  'GRADE 4': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','CRE',
              'Agriculture','Home Science','Art & Craft','Music','Physical Education'],
  'GRADE 5': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','CRE',
              'Agriculture','Home Science','Art & Craft','Music','Physical Education'],
  'GRADE 6': ['Mathematics','English','Kiswahili','Science & Technology','Social Studies','CRE',
              'Agriculture','Home Science','Art & Craft','Music','Physical Education'],
  'GRADE 7': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies',
              'Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE'],
  'GRADE 8': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies',
              'Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE'],
  'GRADE 9': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies',
              'Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE'],
  // Senior uses same CBC JSS subjects by default; school can customise in Settings
  'GRADE 10': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies',
               'Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE'],
  'GRADE 11': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies',
               'Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE'],
  'GRADE 12': ['Mathematics','English','Kiswahili','Integrated Science','Social Studies',
               'Pre-Technical Studies','Agriculture & Nutrition','Creative Arts & Sports','CRE/IRE'],
};

/* ─── JSS / Senior 8-level scale ────────────────────────────────────────── */
export const JSS_SCALE = [
  { min: 80, lv: 'EE1', pts: 8, c: '#065F46', bg: '#D1FAE5', desc: 'Exceeds Expectation — Outstanding' },
  { min: 70, lv: 'EE2', pts: 7, c: '#059669', bg: '#A7F3D0', desc: 'Exceeds Expectation' },
  { min: 60, lv: 'ME1', pts: 6, c: '#1D4ED8', bg: '#BFDBFE', desc: 'Meets Expectation — Above Average' },
  { min: 50, lv: 'ME2', pts: 5, c: '#2563EB', bg: '#DBEAFE', desc: 'Meets Expectation' },
  { min: 40, lv: 'AE1', pts: 4, c: '#B45309', bg: '#FDE68A', desc: 'Approaching Expectation' },
  { min: 30, lv: 'AE2', pts: 3, c: '#92400E', bg: '#FEF3C7', desc: 'Approaching Expectation — Needs Support' },
  { min: 20, lv: 'BE1', pts: 2, c: '#DC2626', bg: '#FEE2E2', desc: 'Below Expectation' },
  { min:  0, lv: 'BE2', pts: 1, c: '#991B1B', bg: '#FCA5A5', desc: 'Below Expectation — Urgent Support Needed' },
];

/* ─── Primary / Pre-School 4-level scale ────────────────────────────────── */
export const PRIMARY_SCALE = [
  { min: 80, lv: 'EE', pts: 4, c: '#065F46', bg: '#D1FAE5', desc: 'Exceeds Expectation' },
  { min: 50, lv: 'ME', pts: 3, c: '#1D4ED8', bg: '#DBEAFE', desc: 'Meets Expectation' },
  { min: 30, lv: 'AE', pts: 2, c: '#92400E', bg: '#FEF3C7', desc: 'Approaching Expectation' },
  { min:  0, lv: 'BE', pts: 1, c: '#991B1B', bg: '#FEE2E2', desc: 'Below Expectation' },
];

/**
 * Determine whether a grade uses the JSS (8-level) scale.
 * Admin can override thresholds via Settings → Grading; pass customScale to apply.
 */
export function isJSSGrade(grade) {
  return JSS.includes(grade) || SENIOR.includes(grade);
}

/**
 * Core grading function — mirrors gInfo() in index-122.html.
 *
 * @param {number} score     0–100
 * @param {string} grade     e.g. 'GRADE 9'
 * @param {object} [cfg]     optional custom grading config from DB (paav8_grad)
 * @returns {{ lv, pts, c, bg, desc }}
 */
export function gInfo(score, grade, cfg = null) {
  let scale;

  if (SENIOR.includes(grade)) {
    scale = cfg?.senior || JSS_SCALE;
  } else if (JSS.includes(grade)) {
    scale = cfg?.junior || JSS_SCALE;
  } else {
    scale = cfg?.k6 || PRIMARY_SCALE;
  }

  const entry = scale.find(x => score >= x.min) || scale[scale.length - 1];
  return { lv: entry.lv, pts: entry.pts, c: entry.c, bg: entry.bg, desc: entry.desc };
}

/**
 * Maximum possible total points for a grade (all subjects at top level).
 * JSS/Senior: n_subjects × 8   |   Others: n_subjects × 4
 */
export function maxPts(grade, subjects = null) {
  const subjs = subjects || DEFAULT_SUBJECTS[grade] || [];
  return subjs.length * (isJSSGrade(grade) ? 8 : 4);
}

/**
 * Calculate total points for one learner across all their subjects.
 *
 * @param {object} marks   flat marks store  { 'GRADE 9|Math|mt1': { adm: score } }
 * @param {string} adm     admission number
 * @param {string} grade
 * @param {string} term    'T1' | 'T2' | 'T3'
 * @param {string} assess  'op1' | 'mt1' | 'et1'
 * @param {string[]} subjects
 * @param {object}  [cfg]  custom grading config
 */
export function calcLearnerPoints(marks, adm, grade, term, assess, subjects, cfg = null) {
  let totalPts = 0;
  let enteredCount = 0;
  const detail = [];

  for (const subj of subjects) {
    const key  = `${term}:${grade}|${subj}|${assess}`;
    const key0 = `${grade}|${subj}|${assess}`;  // legacy key format
    const score = marks[key]?.[adm] ?? marks[key0]?.[adm];

    if (score !== undefined) {
      const info = gInfo(Number(score), grade, cfg);
      totalPts += info.pts;
      enteredCount++;
      detail.push({ subj, score: Number(score), ...info });
    } else {
      detail.push({ subj, score: null, lv: '—', pts: 0, c: 'var(--muted)', bg: 'transparent', desc: '' });
    }
  }

  return { totalPts, enteredCount, maxTotal: maxPts(grade, subjects), detail };
}

/**
 * Calculate averages across 3 assessments (Opener, Mid, End)
 */
export function calcLearnerReportData(marks, adm, grade, term, subjects, cfg = null) {
  const result = [];
  let totalAvgPts = 0;
  let totalEntered = 0;
  let totalAvgScore = 0;

  for (const s of subjects) {
    const op = Number(marks[`${term}:${grade}|${s}|op1`]?.[adm] || 0);
    const mt = Number(marks[`${term}:${grade}|${s}|mt1`]?.[adm] || 0);
    const et = Number(marks[`${term}:${grade}|${s}|et1`]?.[adm] || 0);
    
    const count = (op ? 1 : 0) + (mt ? 1 : 0) + (et ? 1 : 0);
    const avg = count ? Math.round((op + mt + et) / count) : 0;
    
    const opInfo = op ? gInfo(op, grade, cfg) : { lv: '—', pts: 0 };
    const mtInfo = mt ? gInfo(mt, grade, cfg) : { lv: '—', pts: 0 };
    const etInfo = et ? gInfo(et, grade, cfg) : { lv: '—', pts: 0 };
    const avgInfo = avg ? gInfo(avg, grade, cfg) : { lv: '—', pts: 0 };

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
    overallInfo: totalEntered ? gInfo(Math.round(totalAvgScore / totalEntered), grade, cfg) : { lv: '—', pts: 0 }
  };
}


/**
 * Build a ranked merit list for a grade / assessment.
 * Returns learners sorted by total points descending, with rank and tie handling.
 *
 * @param {object[]} learners  full learner list
 * @param {object}   marks     full marks store
 * @param {string}   grade
 * @param {string}   term
 * @param {string}   assess
 * @param {object}   [cfg]
 */
export function buildMeritList(learners, marks, grade, term = 'T1', assess = 'mt1', cfg = null) {
  const subjects = DEFAULT_SUBJECTS[grade] || [];
  const graded = learners
    .filter(l => l.grade === grade)
    .map(l => {
      const { totalPts, enteredCount, maxTotal, detail } = calcLearnerPoints(
        marks, l.adm, grade, term, assess, subjects, cfg
      );
      return { ...l, totalPts, enteredCount, maxTotal, detail };
    })
    .filter(l => l.enteredCount > 0)
    .sort((a, b) => b.totalPts - a.totalPts);

  // Assign ranks — ties share the same rank
  let rank = 1;
  for (let i = 0; i < graded.length; i++) {
    if (i > 0 && graded[i].totalPts < graded[i - 1].totalPts) {
      rank = i + 1;
    }
    graded[i].rank = rank;
  }

  return graded;
}

/**
 * Determine if a learner's overall performance meets promotion criteria.
 * Returns 'promote' | 'review' | 'retain'.
 */
export function promotionStatus(totalPts, maxTotal) {
  if (maxTotal === 0) return 'review';
  const pct = (totalPts / maxTotal) * 100;
  if (pct >= 50) return 'promote';
  if (pct >= 30) return 'review';
  return 'retain';
}

/**
 * Utility: format a KSH amount exactly like fmtK() in the HTML.
 */
export function fmtK(n) {
  return 'KSH ' + Number(n || 0).toLocaleString('en-KE');
}

/**
 * Today's date in YYYY-MM-DD.
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}
