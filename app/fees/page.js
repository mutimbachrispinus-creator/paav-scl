'use client';
/**
 * app/fees/page.js — Fee management (all receipts)
 *
 * Features:
 *   • Search learner, record payment (T1/T2/T3)
 *   • Payment methods: Cash, M-Pesa, Bank, Cheque
 *   • M-Pesa STK Push (via /api/mpesa) for parent payments
 *   • Fee balance overview table
 *   • Bulk print class receipts
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_GRADES, fmtK } from '@/lib/cbe';
import { usePersistedState } from '@/components/TabState';

const TERMS   = ['T1','T2','T3'];
const METHODS = ['Cash','M-Pesa','Bank','Cheque','Bursary'];

export default function FeesPage() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [learners, setLearners] = useState([]);
  const [feeCfg,   setFeeCfg]   = useState({});
  const [paylog,   setPaylog]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');
  const [gradeF,   setGradeF]   = usePersistedState('paav_fees_grade', '');
  const [modal,    setModal]    = useState(null); // 'pay' | 'config' | null
  const [selLearner, setSelLearner] = useState(null);

  const load = useCallback(async () => {
    const authRes = await fetch('/api/auth');
    const auth    = await authRes.json();
    if (!auth.ok) { router.push('/'); return; }
    if (!['admin','staff'].includes(auth.user?.role)) { router.push('/dashboard'); return; }
    setUser(auth.user);

    const dbRes = await fetch('/api/db', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ requests: [
        { type: 'get', key: 'paav6_learners' },
        { type: 'get', key: 'paav6_feecfg'  },
        { type: 'get', key: 'paav6_paylog'  },
      ]}),
    });
    const db = await dbRes.json();
    setLearners(db.results[0]?.value || []);
    setFeeCfg(  db.results[1]?.value || {});
    setPaylog(  db.results[2]?.value || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  function getAnnualFee(grade) { return feeCfg[grade]?.annual || 5000; }
  function getBal(l) {
    return getAnnualFee(l.grade) - (l.t1||0) - (l.t2||0) - (l.t3||0);
  }

  const filtered = learners.filter(l => {
    const q   = query.toLowerCase();
    const hit = !q || l.name?.toLowerCase().includes(q) || l.adm?.includes(q);
    return hit && (!gradeF || l.grade === gradeF);
  });

  const totalExp     = learners.reduce((s,l) => s + getAnnualFee(l.grade), 0);
  const totalPaid    = learners.reduce((s,l) => s + (l.t1||0)+(l.t2||0)+(l.t3||0), 0);
  const totalBalance = totalExp - totalPaid;
  const cleared      = learners.filter(l => getBal(l) <= 0).length;

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading fees…</div>;

  return (
    <>
      <div className="page on">
        <div className="page-hdr">
          <div>
            <h2>💰 Fees</h2>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              Manage school fee payments and receipts
              {user?.role === 'staff' && (
                <span style={{ background: '#F0FDFA', color: '#0D9488', fontWeight: 700,
                  fontSize: 11, padding: '2px 9px', borderRadius: 20, border: '1.5px solid #A7F3D0' }}>
                  Staff — record payments &amp; receipts
                </span>
              )}
              {user?.role === 'admin' && (
                <span style={{ background: '#FDF2F2', color: '#8B1A1A', fontWeight: 700,
                  fontSize: 11, padding: '2px 9px', borderRadius: 20, border: '1.5px solid #FECACA' }}>
                  Admin — full access incl. fee config
                </span>
              )}
            </p>
          </div>
          <div className="page-hdr-acts">
            {user?.role === 'admin' && (
              <button className="btn btn-ghost btn-sm" onClick={() => setModal('config')}>
                ⚙ Fee Config
              </button>
            )}
            <button className="btn btn-ghost btn-sm no-print" onClick={() => window.print()}>
              🖨️ Print
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="sg sg4" style={{ marginBottom: 18 }}>
          <SCard icon="🎯" label="Expected" value={fmtK(totalExp)}    bg="#EFF6FF" />
          <SCard icon="✅" label="Collected" value={fmtK(totalPaid)}  bg="#ECFDF5" />
          <SCard icon="⚠" label="Balance"   value={fmtK(totalBalance)} bg="#FEF2F2" />
          <SCard icon="🟢" label="Cleared"  value={`${cleared} / ${learners.length}`} bg="#F5F3FF" />
        </div>

        {/* ── Payment log ── */}
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-hdr">
            <h3>📥 Recent Payments</h3>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Adm</th><th>Name</th><th>Term</th>
                  <th>Amount</th><th>Method</th><th>Ref</th><th>By</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paylog.slice(-50).reverse().map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 11 }}>{p.date}</td>
                    <td style={{ fontWeight: 700, fontSize: 11.5 }}>{p.adm}</td>
                    <td>{p.name}</td>
                    <td><span className="badge bg-blue" style={{ fontSize: 10 }}>{p.term}</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--green)' }}>{fmtK(p.amount)}</td>
                    <td><span className="badge bg-teal" style={{ fontSize: 10 }}>{p.method}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{p.ref || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{p.by || '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => router.push(`/fees/${p.adm}/receipt`)}>
                        🧾
                      </button>
                    </td>
                  </tr>
                ))}
                {paylog.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                      No payments recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Learner fee balances ── */}
        <div className="panel">
          <div className="panel-hdr">
            <h3>📋 Learner Fee Balances</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="🔍 Search…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ padding: '7px 11px', border: '2px solid var(--border)',
                  borderRadius: 8, fontSize: 12, width: 200, outline: 'none' }}
              />
              <select value={gradeF} onChange={e => setGradeF(e.target.value)}
                style={{ padding: '7px 11px', border: '2px solid var(--border)',
                  borderRadius: 8, fontSize: 12, outline: 'none' }}>
                <option value="">All Grades</option>
                {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Adm</th><th>Name</th><th>Grade</th>
                  <th>Annual Fee</th><th>T1</th><th>T2</th><th>T3</th>
                  <th>Total Paid</th><th>Balance</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const fee = getAnnualFee(l.grade);
                  const tp  = (l.t1||0)+(l.t2||0)+(l.t3||0);
                  const bal = fee - tp;
                  return (
                    <tr key={l.adm}>
                      <td style={{ fontWeight: 700 }}>{l.adm}</td>
                      <td>{l.name}</td>
                      <td><span className="badge bg-blue" style={{ fontSize: 10 }}>{l.grade}</span></td>
                      <td>{fmtK(fee)}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtK(l.t1||0)}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtK(l.t2||0)}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtK(l.t3||0)}</td>
                      <td style={{ fontWeight: 800 }}>{fmtK(tp)}</td>
                      <td>
                        {bal <= 0
                          ? <span className="badge bg-green">Cleared</span>
                          : <span className="badge bg-amber">{fmtK(bal)}</span>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-success btn-sm"
                          onClick={() => { setSelLearner(l); setModal('pay'); }}>
                          + Pay
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }}
                          onClick={() => router.push(`/fees/${l.adm}/receipt`)}>
                          🧾
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Pay Modal ── */}
      {modal === 'pay' && selLearner && (
        <PayModal
          learner={selLearner}
          feeCfg={feeCfg}
          onClose={() => { setModal(null); setSelLearner(null); load(); }}
          recordedBy={user?.name}
        />
      )}

      {/* ── Fee Config Modal ── */}
      {modal === 'config' && (
        <FeeConfigModal
          feeCfg={feeCfg}
          onClose={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
}

/* ─── Pay Modal ─────────────────────────────────────────────────────────── */
function PayModal({ learner, feeCfg, onClose, recordedBy }) {
  const getAnnualFee = g => feeCfg[g]?.annual || 5000;
  const [term,   setTerm]   = useState('T1');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [ref,    setRef]    = useState('');
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState('');

  async function pay() {
    if (!amount || Number(amount) <= 0) { setErr('Enter a valid amount'); return; }
    setBusy(true);

    // 1. Load current learners list
    const dbRes = await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [
        { type: 'get', key: 'paav6_learners' },
        { type: 'get', key: 'paav6_paylog'  },
      ]}),
    });
    const db     = await dbRes.json();
    const list   = db.results[0]?.value || [];
    const paylog = db.results[1]?.value || [];

    // 2. Update learner's term payment
    const termKey = term.toLowerCase();
    const idx     = list.findIndex(l => l.adm === learner.adm);
    if (idx >= 0) list[idx][termKey] = (list[idx][termKey]||0) + Number(amount);

    // 3. Add to pay log
    paylog.push({
      id:     'p' + Date.now(),
      date:   new Date().toLocaleDateString('en-KE'),
      adm:    learner.adm,
      name:   learner.name,
      grade:  learner.grade,
      term:   term,
      amount: Number(amount),
      method, ref,
      by: recordedBy || 'Staff',
    });

    // 4. Save both
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [
        { type: 'set', key: 'paav6_learners', value: list  },
        { type: 'set', key: 'paav6_paylog',   value: paylog },
      ]}),
    });
    setBusy(false);
    onClose();
  }

  const annualFee = getAnnualFee(learner.grade);
  const totalPaid = (learner.t1||0)+(learner.t2||0)+(learner.t3||0);
  const balance   = annualFee - totalPaid;

  return (
    <ModalOverlay title={`💰 Record Payment — ${learner.name}`} onClose={onClose}>
      {err && <div className="alert alert-err show" style={{ display:'flex' }}>{err}</div>}
      <div style={{ padding: '10px 14px', background: '#F8FAFF', borderRadius: 10,
        marginBottom: 14, fontSize: 12.5 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 4 }}>
          <span style={{ color:'var(--muted)' }}>Adm No</span>
          <strong>{learner.adm}</strong>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 4 }}>
          <span style={{ color:'var(--muted)' }}>Annual Fee</span>
          <strong>{fmtK(annualFee)}</strong>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ color:'var(--muted)' }}>Balance</span>
          <strong style={{ color: balance<=0 ? 'var(--green)':'var(--red)' }}>
            {fmtK(balance)}
          </strong>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Term</label>
          <select value={term} onChange={e => setTerm(e.target.value)}>
            {TERMS.map(t=><option key={t} value={t}>Term {t.replace('T','')}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)}>
            {METHODS.map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Amount (KSH)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          min="1" placeholder="e.g. 3000" />
      </div>
      <div className="field">
        <label>Reference / M-Pesa Code (optional)</label>
        <input value={ref} onChange={e => setRef(e.target.value)}
          placeholder="e.g. QA1234XYZ" />
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:4 }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-success btn-sm" onClick={pay} disabled={busy}
          style={{ width:'auto', opacity: busy ? 0.7:1 }}>
          {busy ? '⏳ Recording…' : '✅ Record Payment'}
        </button>
      </div>
    </ModalOverlay>
  );
}

/* ─── Fee Config Modal ───────────────────────────────────────────────────── */
function FeeConfigModal({ feeCfg, onClose }) {
  const [cfg,  setCfg]  = useState({ ...feeCfg });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav6_feecfg', value: cfg }] }),
    });
    setBusy(false);
    onClose();
  }

  return (
    <ModalOverlay title="⚙ Fee Configuration" onClose={onClose}>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        Set the annual fee amount for each grade.
      </p>
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {ALL_GRADES.map(g => (
          <div key={g} className="field-row" style={{ marginBottom: 6 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 10, color: 'var(--muted)' }}>{g} — Annual Fee (KSH)</label>
              <input
                type="number"
                value={cfg[g]?.annual || ''}
                onChange={e => setCfg(prev => ({ ...prev, [g]: { ...(prev[g]||{}), annual: Number(e.target.value) } }))}
                placeholder="5000"
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}
          style={{ width:'auto', opacity: busy ? 0.7:1 }}>
          {busy ? '⏳ Saving…' : '💾 Save Config'}
        </button>
      </div>
    </ModalOverlay>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function SCard({ icon, label, value, bg }) {
  return (
    <div className="stat-card">
      <div className="sc-inner">
        <div className="sc-icon" style={{ background: bg }}>{icon}</div>
        <div>
          <div className="sc-n" style={{ fontSize: 16 }}>{value}</div>
          <div className="sc-l">{label}</div>
        </div>
      </div>
    </div>
  );
}

function ModalOverlay({ title, onClose, children }) {
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-hdr">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
