'use client';
export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti, invalidateDB } from '@/lib/client-cache';
import { useProfile } from '@/app/PortalShell';
import { fmtK } from '@/lib/cbe';
import QuickReceipt from '@/components/nexed/QuickReceipt';
import ExpenseVoucher from '@/components/nexed/ExpenseVoucher';

export default function NexedPage() {
  const router = useRouter();
  const { profile: school } = useProfile();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [paylog, setPaylog] = useState([]);
  const [feeCfg, setFeeCfg] = useState({});
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // 'cleared' | 'owing' | ''
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'balance' | 'grade'

  useEffect(() => {
    async function load() {
      try {
        const [u, db] = await Promise.all([
          getCachedUser(),
          getCachedDBMulti(['paav6_learners', 'paav6_paylog', 'paav6_feecfg'])
        ]);
        if (!u) { router.push('/login'); return; }
        if (!['admin', 'staff'].includes(u.role)) { router.push('/dashboard'); return; }
        setUser(u);
        setLearners(db.paav6_learners || []);
        setPaylog(db.paav6_paylog || []);
        setFeeCfg(db.paav6_feecfg || {});
      } catch (e) {
        console.error('Nexed load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const handler = (e) => {
      const changed = e.detail?.changed || [];
      if (changed.some(k => ['paav6_learners', 'paav6_paylog', 'paav6_feecfg'].includes(k))) load();
    };
    window.addEventListener('paav:sync', handler);
    return () => window.removeEventListener('paav:sync', handler);
  }, [router]);

  function getAnnualFee(grade) { return feeCfg[grade]?.annual || 0; }
  function getBalance(l) {
    return getAnnualFee(l.grade) + (l.arrears || 0) - (l.t1 || 0) - (l.t2 || 0) - (l.t3 || 0);
  }
  function getPaid(l) { return (l.t1 || 0) + (l.t2 || 0) + (l.t3 || 0); }

  // === Finance Stats ===
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayPayments = paylog.filter(p => (p.date || '').startsWith(today));
    const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalExpected = learners.reduce((sum, l) => sum + getAnnualFee(l.grade) + (l.arrears || 0), 0);
    const totalCollected = learners.reduce((sum, l) => sum + getPaid(l), 0);
    const totalOwing = learners.reduce((sum, l) => sum + Math.max(0, getBalance(l)), 0);
    const cleared = learners.filter(l => getBalance(l) <= 0).length;
    const owing = learners.filter(l => getBalance(l) > 0).length;
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    return { todayTotal, totalExpected, totalCollected, totalOwing, cleared, owing, collectionRate, todayCount: todayPayments.length };
  }, [learners, paylog, feeCfg]);

  // === Filtered Ledger ===
  const grades = useMemo(() => [...new Set(learners.map(l => l.grade))].sort(), [learners]);
  
  const filtered = useMemo(() => {
    let list = learners.map(l => ({ ...l, balance: getBalance(l), paid: getPaid(l) }));
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(l => l.name?.toLowerCase().includes(q) || l.adm?.includes(q));
    }
    if (filterGrade) list = list.filter(l => l.grade === filterGrade);
    if (filterStatus === 'cleared') list = list.filter(l => l.balance <= 0);
    if (filterStatus === 'owing') list = list.filter(l => l.balance > 0);
    if (sortBy === 'balance') list.sort((a, b) => b.balance - a.balance);
    else if (sortBy === 'grade') list.sort((a, b) => a.grade.localeCompare(b.grade));
    else list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [learners, searchQ, filterGrade, filterStatus, sortBy, feeCfg]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Nexed Financial Core…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>💳 Nexed Financial Core</h2>
          <p>Institutional Ledger & Fee Management — {learners.length} enrolled learners</p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowExpense(true)}>
            💸 New Expense
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowReceipt(true)}>
            🖨️ Quick Receipt
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="sg sg4" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
          <div className="sc-inner">
            <div className="sc-icon" style={{ background: '#ecfdf5' }}>💰</div>
            <div>
              <div className="sc-l">Today's Collections</div>
              <div className="sc-n">KES {fmtK(stats.todayTotal)}</div>
              <div className="sc-sub" style={{ background: '#ecfdf5', color: '#059669' }}>
                {stats.todayCount} transaction{stats.todayCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="sc-inner">
            <div className="sc-icon" style={{ background: '#eff6ff' }}>📊</div>
            <div>
              <div className="sc-l">Collection Rate</div>
              <div className="sc-n">{stats.collectionRate}%</div>
              <div className="sc-sub" style={{ background: '#eff6ff', color: '#2563eb' }}>
                KES {fmtK(stats.totalCollected)} of {fmtK(stats.totalExpected)}
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="sc-inner">
            <div className="sc-icon" style={{ background: '#fef2f2' }}>⚠️</div>
            <div>
              <div className="sc-l">Total Outstanding</div>
              <div className="sc-n" style={{ color: '#dc2626' }}>KES {fmtK(stats.totalOwing)}</div>
              <div className="sc-sub" style={{ background: '#fef2f2', color: '#dc2626' }}>
                {stats.owing} learner{stats.owing !== 1 ? 's' : ''} with balance
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div className="sc-inner">
            <div className="sc-icon" style={{ background: '#f5f3ff' }}>✅</div>
            <div>
              <div className="sc-l">Cleared Learners</div>
              <div className="sc-n" style={{ color: '#7c3aed' }}>{stats.cleared}</div>
              <div className="sc-sub" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                of {learners.length} total enrolled
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Collection Rate Bar ── */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-hdr">
          <h3>📈 Annual Collection Progress</h3>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>
            KES {fmtK(stats.totalCollected)} collected · KES {fmtK(stats.totalOwing)} pending
          </span>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ height: 14, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              width: `${stats.collectionRate}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${stats.collectionRate >= 80 ? '#059669' : stats.collectionRate >= 50 ? '#2563EB' : '#DC2626'}, ${stats.collectionRate >= 80 ? '#10b981' : stats.collectionRate >= 50 ? '#3b82f6' : '#ef4444'})`,
              borderRadius: 10,
              transition: 'width 0.6s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
            <span>0%</span>
            <span style={{ fontWeight: 800, color: '#1e293b' }}>{stats.collectionRate}% collected</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* ── Learner Fee Ledger ── */}
      <div className="panel">
        <div className="panel-hdr">
          <h3>🏛️ Learner Fee Ledger</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Search name or adm…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ padding: '7px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, width: 180, outline: 'none' }}
            />
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              style={{ padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12 }}>
              <option value="">All Grades</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12 }}>
              <option value="">All Status</option>
              <option value="cleared">✅ Cleared</option>
              <option value="owing">⚠️ Owing</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12 }}>
              <option value="name">Sort: Name</option>
              <option value="balance">Sort: Balance ↓</option>
              <option value="grade">Sort: Grade</option>
            </select>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{filtered.length} learners</span>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Adm</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Annual Fee</th>
                <th>Arrears</th>
                <th>T1 Paid</th>
                <th>T2 Paid</th>
                <th>T3 Paid</th>
                <th>Total Paid</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
                    No learners match your filters.
                  </td>
                </tr>
              ) : filtered.map(l => (
                <tr key={l.adm} style={{ background: l.balance <= 0 ? '#f0fdf433' : l.balance > 5000 ? '#fef2f233' : '' }}>
                  <td><strong>{l.adm}</strong></td>
                  <td>
                    <button className="btn-link" style={{ fontWeight: 700, textAlign: 'left' }}
                      onClick={() => router.push(`/learners/${encodeURIComponent(l.adm)}`)}>
                      {l.name}
                    </button>
                  </td>
                  <td><span className="badge bg-blue" style={{ fontSize: 10 }}>{l.grade}</span></td>
                  <td style={{ fontWeight: 700 }}>KES {fmtK(getAnnualFee(l.grade))}</td>
                  <td style={{ color: l.arrears > 0 ? '#dc2626' : 'var(--muted)', fontWeight: l.arrears > 0 ? 700 : 400 }}>
                    {l.arrears > 0 ? `+${fmtK(l.arrears)}` : '—'}
                  </td>
                  <td style={{ color: l.t1 > 0 ? '#059669' : 'var(--muted)' }}>{l.t1 > 0 ? fmtK(l.t1) : '—'}</td>
                  <td style={{ color: l.t2 > 0 ? '#059669' : 'var(--muted)' }}>{l.t2 > 0 ? fmtK(l.t2) : '—'}</td>
                  <td style={{ color: l.t3 > 0 ? '#059669' : 'var(--muted)' }}>{l.t3 > 0 ? fmtK(l.t3) : '—'}</td>
                  <td style={{ fontWeight: 800, color: '#059669' }}>KES {fmtK(l.paid)}</td>
                  <td style={{ fontWeight: 900, color: l.balance <= 0 ? '#059669' : l.balance > 5000 ? '#dc2626' : '#d97706' }}>
                    {l.balance <= 0 ? '✓ 0' : `KES ${fmtK(l.balance)}`}
                  </td>
                  <td>
                    {l.balance <= 0
                      ? <span className="badge bg-green">✅ Cleared</span>
                      : l.balance > 5000
                        ? <span className="badge bg-red">🔴 High Balance</span>
                        : <span className="badge bg-amber">⚠️ Partial</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grade Summary Footer */}
        {!filterGrade && !searchQ && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {grades.map(g => {
              const gl = learners.filter(l => l.grade === g);
              const gOwing = gl.reduce((sum, l) => sum + Math.max(0, getBalance(l)), 0);
              const gPaid = gl.reduce((sum, l) => sum + getPaid(l), 0);
              return (
                <div key={g} onClick={() => setFilterGrade(g)} style={{
                  padding: '6px 12px', borderRadius: 8, background: '#F8FAFC',
                  border: '1.5px solid var(--border)', cursor: 'pointer', fontSize: 11, fontWeight: 700
                }}>
                  <span>{g}</span>
                  <span style={{ color: '#059669', marginLeft: 8 }}>✓{fmtK(gPaid)}</span>
                  {gOwing > 0 && <span style={{ color: '#dc2626', marginLeft: 6 }}>⚠{fmtK(gOwing)}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuickReceipt isOpen={showReceipt} onClose={() => { setShowReceipt(false); invalidateDB('paav6_learners'); invalidateDB('paav6_paylog'); }} />
      <ExpenseVoucher isOpen={showExpense} onClose={() => setShowExpense(false)} />
    </div>
  );
}
