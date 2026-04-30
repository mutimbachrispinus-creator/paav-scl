/**
 * lib/navigation.js — Centralized navigation definition
 */

export const ALL_NAV = [
  { key:'dashboard',  label:'Home',        icon:'📊', roles:['admin','teacher','staff','member'], 
    prefetch: ['paav6_learners', 'paav6_paylog', 'paav6_msgs', 'paav6_feecfg', 'paav_announcement', 'paav_hero_img'] },
  
  { key:'parent-home', label:'Home',       icon:'🏠', roles:['parent'],
    prefetch: ['paav6_learners', 'paav6_msgs', 'paav6_feecfg', 'paav6_marks', 'paav_paybill_accounts'] },
  
  { key:'attendance', label:'Attendance',  icon:'📋', roles:['admin','teacher','jss_teacher','senior_teacher'],
    prefetch: ['paav6_learners', 'paav_student_attendance', 'paav_class_teachers'] },
  
  { key:'timetable',  label:'Timetable',   icon:'📅', roles:['admin','teacher','staff'],
    prefetch: ['paav6_timetable', 'paav_tt22'] },
  
  { key:'duties',     label:'Duties',      icon:'🎖️', roles:['admin','teacher','staff'],
    prefetch: ['paav7_duties', 'paav6_staff', 'paav_presence'] },
  
  { key:'performance',label:'Performance', icon:'📈', roles:['admin','teacher','jss_teacher','senior_teacher'],
    prefetch: ['paav6_learners', 'paav6_marks'] },
  
  { 
    key:'classes',     
    label:'Classes',     
    icon:'🏫', 
    roles:['admin','teacher','jss_teacher','senior_teacher'],
    prefetch: ['paav6_learners', 'paav_class_teachers'],
    children: [
      { label: 'Kindergarten', href: '/classes/KINDERGARTEN' },
      { label: 'PP1', href: '/classes/PP1' },
      { label: 'PP2', href: '/classes/PP2' },
      { label: 'Grade 1', href: '/classes/GRADE 1' },
      { label: 'Grade 2', href: '/classes/GRADE 2' },
      { label: 'Grade 3', href: '/classes/GRADE 3' },
      { label: 'Grade 4', href: '/classes/GRADE 4' },
      { label: 'Grade 5', href: '/classes/GRADE 5' },
      { label: 'Grade 6', href: '/classes/GRADE 6' },
      { label: 'Grade 7', href: '/classes/GRADE 7' },
      { label: 'Grade 8', href: '/classes/GRADE 8' },
      { label: 'Grade 9', href: '/classes/GRADE 9' },
      { label: 'Grade 10', href: '/classes/GRADE 10' },
      { label: 'Grade 11', href: '/classes/GRADE 11' },
      { label: 'Grade 12', href: '/classes/GRADE 12' },
    ]
  },

  { key:'learners',   label:'Learners',    icon:'🎓', roles:['admin','teacher','jss_teacher','senior_teacher'],
    prefetch: ['paav6_learners', 'paav6_feecfg'] },
  
  { key:'grades',     label:'Grades',      icon:'📊', roles:['admin','teacher','jss_teacher','senior_teacher'],
    prefetch: ['paav6_learners', 'paav6_marks', 'paav_marks_locked'] },
  
  { key:'merit-list', label:'Merit List',  icon:'🏆', roles:['admin','teacher','jss_teacher','senior_teacher'],
    prefetch: ['paav6_learners', 'paav6_marks', 'paav6_grading'] },
  
  { key:'allocations',label:'Allocations', icon:'🗓️', roles:['admin'],
    prefetch: ['paav6_staff', 'paav_teacher_assignments'] },
  
  { key:'salary',     label:'Salary',      icon:'💵', roles:['admin'],
    prefetch: ['paav6_staff', 'paav7_salary'] },
  
  { key:'templates',  label:'Templates',   icon:'📄', roles:['admin'] },
  
  { key:'fees',       label:'Fees',        icon:'💰', roles:['admin'],
    prefetch: ['paav6_learners', 'paav6_feecfg', 'paav6_paylog'] },
  
  { key:'teachers',   label:'Staff',       icon:'👔', roles:['admin'],
    prefetch: ['paav6_staff'] },
  
  { key:'settings',   label:'Setup',       icon:'⚙️', roles:['admin'] },
  
  { key:'analytics',  label:'Analytics',   icon:'📈', roles:['admin'],
    prefetch: ['paav6_learners', 'paav6_paylog'] },
  
  { key:'analytics/activity', label:'Activity Log', icon:'📜', roles:['admin'],
    prefetch: ['paav7_activity_log'] },
  
  { key:'reports',    label:'Reports',     icon:'📊', roles:['admin','teacher','staff'],
    prefetch: ['paav6_dept_reports'] },
  
  { key:'database',   label:'Database',    icon:'⚙️', roles:['admin'] },
  
  { key:'messages',   label:'Messages',    icon:'💬', roles:['admin','teacher','jss_teacher','senior_teacher','staff','parent'],
    prefetch: ['paav6_msgs'] },
  
  { key:'profile',     label:'Profile',     icon:'👤', roles:['admin'] },
  
  { key:'documents',   label:'Documents',    icon:'📂', roles:['admin','teacher','staff','member','parent'],
    prefetch: ['paav6_reports'] },
  
  { key:'sms',        label:'SMS',         icon:'📱', roles:['admin'],
    prefetch: ['paav7_sms'] },
  
  { key:'comms/push',  label:'Push Comms',  icon:'🚀', roles:['admin'],
    prefetch: ['paav6_learners', 'paav6_feecfg'] },

  { key:'analytics/trends', label:'Analytics', icon:'📈', roles:['admin', 'teacher'],
    prefetch: ['paav6_learners', 'paav6_marks'] },

  { key:'learning',      label:'Learning Hub', icon:'📚', roles:['admin', 'teacher', 'parent', 'learner'],
    prefetch: ['paav7_learning_docs'] },

  { key:'welfare',       label:'Welfare',      icon:'🛡', roles:['admin', 'teacher'],
    prefetch: ['paav6_learners', 'paav7_discipline', 'paav7_health'] },
];

