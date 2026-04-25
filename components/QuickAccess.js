'use client';
/**
 * components/QuickAccess.js — Smart shortcut grid
 *
 * Shown on the dashboard and parent home.
 * Renders role-aware shortcut tiles that deep-link into the portal.
 *
 * Usage:
 *   <QuickAccess role="admin" grade="GRADE 7" admNo="101" />
 */

import { useRouter } from 'next/navigation';

/* ── All possible shortcuts ── */
const ALL_SHORTCUTS = [
  /* admin */
  {
    roles:  ['admin'],
    icon:   '➕',
    label:  'Add Learner',
    color:  '#2563EB',
    bg:     '#EFF6FF',
    path:   '/learners',
    query:  '?add=1',
  },
  {
    roles:  ['admin','staff'],
    icon:   '💰',
    label:  'Record Payment',
    color:  '#059669',
    bg:     '#ECFDF5',
    path:   '/fees',
  },
  {
    roles:  ['admin'],
    icon:   '📱',
    label:  'Send SMS',
    color:  '#7C3AED',
    bg:     '#F5F3FF',
    path:   '/sms',
  },
  {
    roles:  ['admin'],
    icon:   '👔',
    label:  'Manage Staff',
    color:  '#0D9488',
    bg:     '#F0FDFA',
    path:   '/teachers',
  },
  {
    roles:  ['admin','teacher'],
    icon:   '📊',
    label:  'Enter Marks',
    color:  '#8B1A1A',
    bg:     '#FDF2F2',
    path:   '/grades',
  },
  {
    roles:  ['admin','teacher'],
    icon:   '🏆',
    label:  'Merit List',
    color:  '#D97706',
    bg:     '#FFFBEB',
    path:   '/merit-list',
  },
  {
    roles:  ['admin','teacher','staff'],
    icon:   '🎓',
    label:  'Learners',
    color:  '#2563EB',
    bg:     '#EFF6FF',
    path:   '/learners',
  },
  {
    roles:  ['admin','teacher'],
    icon:   '📋',
    label:  'Report Cards',
    color:  '#8B1A1A',
    bg:     '#FDF2F2',
    path:   null,          // grade-specific — resolved at render time
    action: 'report-cards',
  },
  /* parent */
  {
    roles:  ['parent'],
    icon:   '📋',
    label:  'My Child\'s Report',
    color:  '#8B1A1A',
    bg:     '#FDF2F2',
    action: 'child-report',
  },
  {
    roles:  ['parent'],
    icon:   '💰',
    label:  'Pay Fees',
    color:  '#059669',
    bg:     '#ECFDF5',
    path:   '/fees/pay',
  },
  {
    roles:  ['parent'],
    icon:   '🧾',
    label:  'Fee Receipt',
    color:  '#0D9488',
    bg:     '#F0FDFA',
    action: 'fee-receipt',
  },
];

export default function QuickAccess({ role, grade, admNo, cols = 4 }) {
  const router = useRouter();

  const shortcuts = ALL_SHORTCUTS.filter(s => s.roles.includes(role));

  function navigate(s) {
    if (s.path) {
      router.push(s.path + (s.query || ''));
      return;
    }
    switch (s.action) {
      case 'report-cards':
        router.push(grade ? `/classes/${encodeURIComponent(grade)}` : '/learners');
        break;
      case 'child-report':
        if (admNo) router.push(`/grades/report-card/${admNo}`);
        break;
      case 'fee-receipt':
        if (admNo) router.push(`/fees/${admNo}/receipt`);
        break;
      default:
        router.push('/dashboard');
    }
  }

  if (!shortcuts.length) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(cols, shortcuts.length)}, 1fr)`,
      gap: 12,
      marginBottom: 20,
    }}>
      {shortcuts.map((s, i) => (
        <button
          key={i}
          onClick={() => navigate(s)}
          style={{
            background:   s.bg,
            border:       `2px solid ${s.color}22`,
            borderRadius: 14,
            padding:      '16px 12px',
            cursor:       'pointer',
            textAlign:    'center',
            transition:   'all .18s',
            display:      'flex',
            flexDirection:'column',
            alignItems:   'center',
            gap:          8,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform   = 'translateY(-3px)';
            e.currentTarget.style.boxShadow   = `0 8px 24px ${s.color}33`;
            e.currentTarget.style.borderColor = s.color;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform   = '';
            e.currentTarget.style.boxShadow   = '';
            e.currentTarget.style.borderColor = `${s.color}22`;
          }}
        >
          <div style={{
            width: 48, height: 48,
            background: s.color + '18',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}>
            {s.icon}
          </div>
          <span style={{
            fontSize:   11.5,
            fontWeight: 700,
            color:      s.color,
            lineHeight: 1.2,
          }}>
            {s.label}
          </span>
        </button>
      ))}
    </div>
  );
}
