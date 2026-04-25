'use client';
/**
 * components/TabState.js — Persist active tab + filter values across refreshes
 *
 * Uses localStorage (not sessionStorage) so state survives both refresh AND
 * closing/reopening the tab.  Falls back silently in private/incognito mode.
 *
 * Usage:
 *   <TabState storageKey="grades-tab" defaultTab="mt1" tabs={[
 *     { key: 'op1', label: 'Opener'   },
 *     { key: 'mt1', label: 'Mid-Term' },
 *     { key: 'et1', label: 'End-Term' },
 *   ]}>
 *     {(activeTab) => (
 *       <>
 *         {activeTab === 'op1' && <OpenerView />}
 *         {activeTab === 'mt1' && <MidTermView />}
 *         {activeTab === 'et1' && <EndTermView />}
 *       </>
 *     )}
 *   </TabState>
 */

import { useState, useEffect, useCallback } from 'react';

/* ── Thin localStorage wrappers ─────────────────────────────────────────── */
function lsGet(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/**
 * usePersistedState — drop-in replacement for useState that persists to localStorage.
 *
 * const [grade, setGrade] = usePersistedState('paav_grade_sel', 'GRADE 7');
 */
export function usePersistedState(key, defaultValue) {
  const [state, setStateRaw] = useState(() => lsGet(key, defaultValue));

  const setState = useCallback((valueOrFn) => {
    setStateRaw(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      lsSet(key, next);
      return next;
    });
  }, [key]);

  return [state, setState];
}

/**
 * TabState component — wraps tab buttons + panels, persists selection in localStorage.
 */
export default function TabState({
  storageKey,        // localStorage namespace, e.g. 'grades-page-tab'
  defaultTab,        // fallback if nothing stored
  tabs = [],         // [{ key, label, badge? }]
  children,          // render prop: (activeTab, setTab) => ReactNode
  className = '',
  onTabChange,
}) {
  const [active, setActive] = usePersistedState(
    storageKey ? `paav_tab_${storageKey}` : null,
    defaultTab || tabs[0]?.key || ''
  );

  // Ensure stored value is still a valid tab key
  const validActive = tabs.find(t => t.key === active) ? active : (defaultTab || tabs[0]?.key || '');

  const switchTab = useCallback((key) => {
    setActive(key);
    onTabChange?.(key);
  }, [setActive, onTabChange]);

  return (
    <>
      <div className={`tabs ${className}`}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`tab-btn${validActive === t.key ? ' on' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span style={{
                marginLeft: 6, background: '#EF4444', color: '#fff',
                fontSize: 9, fontWeight: 800, padding: '1px 5px',
                borderRadius: 10, verticalAlign: 'middle',
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {typeof children === 'function' ? children(validActive, switchTab) : children}
    </>
  );
}

/**
 * usePersistedTab — hook version of TabState for manual layout control.
 *
 * const [tab, setTab] = usePersistedTab('marks-page', 'mt1');
 */
export function usePersistedTab(storageKey, defaultTab) {
  return usePersistedState(`paav_tab_${storageKey}`, defaultTab);
}
