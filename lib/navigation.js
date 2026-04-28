/**
 * lib/navigation.js — Centralized navigation definition
 */

export const ALL_NAV = [
  { key:'dashboard',  label:'Home',        icon:'📊', roles:['admin','teacher','staff','member','parent'] },
  { key:'attendance', label:'Attendance',  icon:'📋', roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'timetable',  label:'Timetable',   icon:'📅', roles:['admin','teacher','staff'] },
  { key:'duties',     label:'Duties',      icon:'🎖️', roles:['admin','teacher','staff'] },
  { key:'performance',label:'Performance', icon:'📈', roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'classes',     label:'Classes',     icon:'🏫', roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'learners',   label:'Learners',    icon:'🎓', roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'grades',     label:'Grades',      icon:'📊', roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'merit-list', label:'Merit List',  icon:'🏆', roles:['admin','teacher','jss_teacher','senior_teacher'] },
  { key:'allocations',label:'Allocations', icon:'🗓️', roles:['admin'] },
  { key:'salary',     label:'Salary',      icon:'💵', roles:['admin'] },
  { key:'templates',  label:'Templates',   icon:'📄', roles:['admin'] },
  { key:'fees',       label:'Fees',        icon:'💰', roles:['admin','staff'] },
  { key:'teachers',   label:'Staff',       icon:'👔', roles:['admin'] },
  { key:'settings',   label:'Setup',       icon:'⚙️', roles:['admin'] },
  { key:'analytics',  label:'Analytics',   icon:'📈', roles:['admin'] },
  { key:'messages',   label:'Messages',    icon:'💬', roles:['admin','teacher','jss_teacher','senior_teacher','staff','parent'] },
  { key:'profile',     label:'Profile',     icon:'👤', roles:['admin'] },
  { key:'documents',   label:'Documents',    icon:'📂', roles:['admin','teacher','staff','member','parent'] },
  { key:'sms',        label:'SMS',         icon:'📱', roles:['admin'] },
];
