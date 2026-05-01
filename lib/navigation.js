/**
 * lib/navigation.js — Centralized navigation definition
 */

export const ALL_NAV = [
  { key:'dashboard',  label:'Home', icon:'📊', roles:['admin','teacher','staff','member','parent'], 
    prefetch: ['paav6_learners', 'paav6_paylog', 'paav6_msgs', 'paav6_feecfg', 'paav_announcement', 'paav_hero_img'] },
  
  { key:'super-admin', label:'Command Center', icon:'👑', roles:['super-admin'],
    prefetch: ['paav_schools', 'paav_stats_global'] },
  
  { 
    key:'academics', 
    label:'Academics', 
    icon:'🎓', 
    roles:['admin','super-admin','teacher','jss_teacher','senior_teacher'],
    children: [
      { label: 'Attendance', href: '/attendance' },
      { label: 'Timetable', href: '/timetable' },
      { label: 'Learners', href: '/learners' },
      { label: 'Grades/Marks', href: '/grades' },
      { label: 'Performance', href: '/performance' },
      { label: 'Merit List', href: '/merit-list' },
      { label: 'Classes', href: '/classes' },
      { label: 'Duties', href: '/duties' },
      { label: 'Learning Hub', href: '/learning' },
    ]
  },

  { 
    key:'finance', 
    label:'Finances', 
    icon:'💰', 
    roles:['admin','super-admin'],
    children: [
      { label: 'Fee Collection', href: '/fees' },
      { label: 'Ledger/Accounts', href: '/finance' },
      { label: 'Expenses', href: '/finance/expenses' },
      { label: 'Payroll', href: '/finance/payroll' },
      { label: 'Reconciliation', href: '/finance/reconcile' },
      { label: 'Allocations', href: '/allocations' },
    ]
  },

  { 
    key:'mgmt', 
    label:'Management', 
    icon:'👔', 
    roles:['admin','super-admin','teacher','staff'],
    children: [
      { label: 'Staff Records', href: '/teachers' },
      { label: 'Welfare/Discipline', href: '/welfare' },
      { label: 'Achievements', href: '/welfare/portfolio' },
      { label: 'Department Reports', href: '/reports' },
      { label: 'Documents', href: '/documents' },
    ]
  },

  { 
    key:'comms', 
    label:'Connect', 
    icon:'💬', 
    roles:['admin','super-admin','teacher','staff','parent'],
    children: [
      { label: 'Messages', href: '/messages' },
      { label: 'SMS Center', href: '/sms' },
      { label: 'Push Broadcast', href: '/comms/push' },
    ]
  },

  { 
    key:'settings', 
    label:'Setup', 
    icon:'⚙️', 
    roles:['admin','super-admin'],
    children: [
      { label: 'School Setup', href: '/settings' },
      { label: 'Billing/Plan', href: '/settings/billing' },
      { label: 'Templates', href: '/templates' },
      { label: 'Database Admin', href: '/database' },
      { label: 'Activity Log', href: '/analytics/activity' },
    ]
  },

  { key:'profile', label:'Profile', icon:'👤', roles:['admin','super-admin','teacher','staff','parent'] },
];

