// lib/timetable-gen.js

const SIMILAR = [['English','Kiswahili'],['Mathematics','Science'],['Physics','Chemistry'],['Biology','Agriculture'],['Integrated Science','Mathematics']];

export function isSimilar(a,b) {
  return SIMILAR.some(g => g.includes(a) && g.includes(b));
}

// Default subject configurations per level for generating
export function getDefaultSubjectConfig(subjName, lvl) {
  const defaults = {
    'primary13': [
      {n:'English', l:6, d:false, p:'morning'}, {n:'Kiswahili', l:5, d:false, p:'morning'},
      {n:'Mathematics', l:6, d:false, p:'morning'}, {n:'Science', l:4, d:true, p:'any'},
      {n:'Social Studies', l:3, d:false, p:'any'}, {n:'CRE', l:2, d:false, p:'any'},
      {n:'PE', l:2, d:false, p:'afternoon'}, {n:'Creative Arts', l:3, d:true, p:'afternoon'}
    ],
    'primary46': [
      {n:'English', l:6, d:false, p:'morning'}, {n:'Kiswahili', l:5, d:false, p:'morning'},
      {n:'Mathematics', l:6, d:false, p:'morning'}, {n:'Science', l:5, d:true, p:'any'},
      {n:'Social Studies', l:4, d:false, p:'any'}, {n:'CRE', l:2, d:false, p:'any'},
      {n:'Agriculture', l:3, d:false, p:'any'}, {n:'Home Science', l:2, d:true, p:'afternoon'},
      {n:'PE', l:2, d:false, p:'afternoon'}
    ],
    'jss': [
      {n:'English', l:6, d:false, p:'morning'}, {n:'Kiswahili', l:5, d:false, p:'morning'},
      {n:'Mathematics', l:6, d:false, p:'morning'}, {n:'Integrated Science', l:6, d:true, p:'any'},
      {n:'Social Studies', l:4, d:false, p:'any'}, {n:'CRE', l:2, d:false, p:'any'},
      {n:'Agriculture', l:3, d:false, p:'any'}, {n:'Home Science', l:3, d:true, p:'afternoon'},
      {n:'Business Studies', l:3, d:false, p:'any'}, {n:'Computer Studies', l:3, d:false, p:'any'},
      {n:'PE', l:2, d:false, p:'afternoon'}, {n:'Creative Arts', l:2, d:true, p:'afternoon'},
      {n:'PPI', l:1, d:false, p:'morning'}
    ],
    'senior': [
      {n:'English', l:5, d:false, p:'morning'}, {n:'Kiswahili', l:4, d:false, p:'morning'},
      {n:'Mathematics', l:5, d:false, p:'morning'}, {n:'Physics', l:5, d:true, p:'any'},
      {n:'Chemistry', l:5, d:true, p:'any'}, {n:'Biology', l:4, d:true, p:'any'},
      {n:'History', l:4, d:false, p:'any'}, {n:'Geography', l:4, d:false, p:'any'},
      {n:'CRE', l:2, d:false, p:'any'}, {n:'PE', l:2, d:false, p:'afternoon'}
    ]
  };
  
  const defs = defaults[lvl] || defaults['jss'];
  const match = defs.find(d => d.n.toLowerCase() === subjName.toLowerCase());
  if (match) return { lessons: match.l, dbl: match.d, priority: match.p };
  // fallback for unknown subjects
  return { lessons: 4, dbl: false, priority: 'any' };
}

export function generateTimetableData(subjects, cfg, DAYS) {
  const maxPeriods = cfg.perDay[0];
  
  // pool of lessons
  let pool = [];
  subjects.forEach(s => {
    for(let i=0; i<s.lessons; i++) pool.push({...s, double:false});
    if (s.dbl && s.lessons >= 2) {
      // combine 2 single lessons into 1 double
      const idx = pool.findIndex(x => x.name === s.name);
      if(idx >= 0) { pool.splice(idx, 2); pool.push({...s, double:true}); }
    }
  });

  pool = pool.sort(() => Math.random() - 0.5);

  // Sorting: morning-priority first, PPI very first
  pool.sort((a,b) => {
    if(a.name==='PPI') return -1; if(b.name==='PPI') return 1;
    if(a.priority==='morning' && b.priority!=='morning') return -1;
    if(b.priority==='morning' && a.priority!=='morning') return 1;
    if(a.priority==='afternoon' && b.priority!=='afternoon') return 1;
    if(b.priority==='afternoon' && a.priority!=='afternoon') return -1;
    return 0;
  });

  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; for(let p=1; p<=maxPeriods; p++) grid[d][p] = null; });

  const teacherBusy = {}; // "TeacherName" -> Set("Day-Period")

  function canPlace(day, period, item) {
    if(period > maxPeriods) return false;
    if(grid[day][period] !== null) return false;
    if(item.double && (period >= maxPeriods || grid[day][period+1] !== null)) return false;
    
    // Teacher clash
    if(item.teacher) {
      if(!teacherBusy[item.teacher]) teacherBusy[item.teacher] = new Set();
      if(teacherBusy[item.teacher].has(day+'-'+period)) return false;
      if(item.double && teacherBusy[item.teacher].has(day+'-'+(period+1))) return false;
    }
    
    // Similar
    const prev = grid[day][period-1];
    if(prev && isSimilar(prev.name, item.name)) return false;
    const next = grid[day][period+1];
    if(next && isSimilar(next.name, item.name)) return false;

    // Morning/Afternoon priority
    if(item.priority === 'morning' && period > Math.ceil(maxPeriods/2)) return false;
    if(item.priority === 'afternoon' && period <= Math.ceil(maxPeriods/2)) return false;

    // Teacher consecutive lessons (max 3)
    if(item.teacher) {
      const isConsecutive = (d, p) => teacherBusy[item.teacher]?.has(d+'-'+(p-1)) && 
                                     teacherBusy[item.teacher]?.has(d+'-'+(p-2)) && 
                                     teacherBusy[item.teacher]?.has(d+'-'+(p-3));
      if (isConsecutive(day, period)) return false;
    }

    return true;
  }

  function place(day, period, item) {
    grid[day][period] = { subject: item.name, teacher: item.teacher };
    if(item.teacher) {
      if(!teacherBusy[item.teacher]) teacherBusy[item.teacher] = new Set();
      teacherBusy[item.teacher].add(day+'-'+period);
    }
    if(item.double) {
      grid[day][period+1] = { subject: item.name, teacher: item.teacher, cont: true };
      if(item.teacher) teacherBusy[item.teacher].add(day+'-'+(period+1));
    }
  }

  // Place PPI automatically across all days
  const ppi = pool.find(x => x.name === 'PPI');
  if(ppi) {
    for(let p=1; p<=maxPeriods; p++) {
      if(DAYS.every(d => grid[d][p] === null)) {
        DAYS.forEach(d => place(d, p, ppi));
        pool = pool.filter(x => x.name !== 'PPI');
        break;
      }
    }
  }

  // Place remaining
  let unplaced = [];
  pool.forEach(item => {
    let placed = false;
    for(const day of DAYS) {
      for(let p=1; p<=maxPeriods; p++) {
        if(canPlace(day, p, item)) { place(day, p, item); placed = true; break; }
      }
      if(placed) break;
    }
    if(!placed) unplaced.push(item);
  });

  // Relax priorities for unplaced
  unplaced = unplaced.filter(item => {
    if(item.priority === 'afternoon' || item.priority === 'morning') {
      const orig = item.priority; item.priority = 'any';
      for(const day of DAYS) {
        for(let p=1; p<=maxPeriods; p++) {
          if(canPlace(day, p, item)) { place(day, p, item); item.priority = orig; return false; }
        }
      }
      item.priority = orig;
    }
    return true;
  });

  return { grid, unplaced };
}
