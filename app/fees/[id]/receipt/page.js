'use client';
/**
 * app/fees/[id]/receipt/page.js — Single learner fee receipt (printable)
 *
 * Renders a school-branded A5 receipt card for one learner,
 * matching the receipt-card layout from index-122.html.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fmtK } from '@/lib/cbe';

export default function ReceiptPage() {
  const router = useRouter();
  const { id: admNo } = useParams();

  const [learner, setLearner] = useState(null);
  const [feeCfg,  setFeeCfg]  = useState({});
  const [paylog,  setPaylog]  = useState([]);
  const [paybill, setPaybill] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const authRes = await fetch('/api/auth');
      const auth    = await authRes.json();
      if (!auth.ok) { router.push('/'); return; }

      const dbRes = await fetch('/api/db', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ requests: [
          { type: 'get', key: 'paav6_learners' },
          { type: 'get', key: 'paav6_feecfg'  },
          { type: 'get', key: 'paav6_paylog'  },
          { type: 'get', key: 'paav_paybill'  },
        ]}),
      });
      const db = await dbRes.json();

      const all = db.results[0]?.value || [];
      const found = all.find(l => l.adm === admNo);
      if (!found) { router.push('/fees'); return; }

      setLearner(found);
      setFeeCfg( db.results[1]?.value || {});
      setPaylog( (db.results[2]?.value || []).filter(p => p.adm === admNo));
      setPaybill(db.results[3]?.value || '');
      setLoading(false);
    }
    load();
  }, [admNo, router]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading receipt…</div>;
  if (!learner) return null;

  const annualFee = feeCfg[learner.grade]?.annual || 5000;
  const totalPaid = (learner.t1||0)+(learner.t2||0)+(learner.t3||0);
  const balance   = annualFee - totalPaid;
  const today     = new Date().toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <>
      {/* ── Controls ── */}
      <div className="no-print" style={{ padding: '14px 22px', background: 'var(--navy)',
        display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
          onClick={() => router.push('/fees')}>
          ← Fees
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
          Receipt — {learner.name}
        </span>
        <button onClick={() => window.print()} className="btn btn-gold btn-sm">
          🖨️ Print Receipt
        </button>
      </div>

      {/* ── Receipt card ── */}
      <div style={{ background: '#F0F4FF', minHeight: '100vh', padding: '30px 20px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div className="receipt-card" style={{ maxWidth: 420, width: '100%',
          fontFamily: 'Inter,sans-serif', fontSize: 12 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '3px double #8B1A1A',
            paddingBottom: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontFamily: 'Sora,sans-serif', fontWeight: 800,
              color: '#8B1A1A', marginBottom: 2 }}>
              🏫 PAAV-GITOMBO COMMUNITY SCHOOL
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              PAAV-Gitombo, Embu County &nbsp;|&nbsp; Tel: 0758 922 915
            </div>
            <div style={{ marginTop: 8, fontFamily: 'Sora,sans-serif', fontSize: 13,
              fontWeight: 700, color: 'var(--navy)', letterSpacing: '.3px' }}>
              OFFICIAL FEE RECEIPT
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              Generated: {today}
            </div>
          </div>

          {/* Learner info */}
          <InfoRow label="Name"     value={learner.name}  />
          <InfoRow label="Adm No."  value={learner.adm}   />
          <InfoRow label="Grade"    value={learner.grade} />
          {learner.parent && <InfoRow label="Parent" value={learner.parent} />}
          {learner.phone  && <InfoRow label="Phone"  value={learner.phone}  />}

          <div style={{ margin: '12px 0', borderTop: '1.5px dashed var(--border)' }} />

          {/* Fee breakdown */}
          <InfoRow label="Annual Fee" value={fmtK(annualFee)} bold />
          {['T1','T2','T3'].map((t, i) => {
            const amt = learner[t.toLowerCase()] || 0;
            return amt > 0 ? (
              <InfoRow key={t} label={`Term ${i+1} Paid`}
                value={fmtK(amt)} color="var(--green)" />
            ) : null;
          })}
          <InfoRow label="Total Paid" value={fmtK(totalPaid)} bold color="var(--green)" />

          <div style={{ display: 'flex', justifyContent: 'space-between',
            background: balance <= 0 ? '#ECFDF5' : '#FEF2F2',
            borderRadius: 8, padding: '10px 12px', marginTop: 10,
            fontWeight: 800, fontSize: 13 }}>
            <span>Balance Outstanding</span>
            <span style={{ color: balance <= 0 ? 'var(--green)' : 'var(--red)' }}>
              {balance <= 0 ? '✅ CLEARED' : fmtK(balance)}
            </span>
          </div>

          {/* Payment history */}
          {paylog.length > 0 && (
            <>
              <div style={{ margin: '14px 0 8px', fontWeight: 700, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)' }}>
                Payment History
              </div>
              {paylog.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '5px 0', borderBottom: '1px dashed var(--border)', fontSize: 11 }}>
                  <span style={{ color: 'var(--muted)' }}>{p.date} · {p.method}</span>
                  <span style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtK(p.amount)}</span>
                </div>
              ))}
            </>
          )}

          {/* M-Pesa payment info */}
          {paybill && balance > 0 && (
            <div style={{ marginTop: 14, padding: 12, background: '#ECFDF5',
              borderRadius: 10, fontSize: 11.5, border: '1.5px solid #A7F3D0' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>💚 Pay via M-Pesa</div>
              <div>Paybill: <strong>{paybill}</strong></div>
              <div>Account: <strong>{learner.adm}</strong></div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 20, textAlign: 'center', borderTop: '1px dashed #ccc',
            paddingTop: 10, fontSize: 10, color: 'var(--muted)' }}>
            <div>This is a computer-generated receipt</div>
            <div style={{ marginTop: 2 }}>&quot;More Than Academics!&quot; — PAAV Portal</div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value, bold, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
      padding: '5px 0', borderBottom: '1px dashed var(--border)', fontSize: 12 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: color || 'var(--navy)' }}>{value}</span>
    </div>
  );
}
