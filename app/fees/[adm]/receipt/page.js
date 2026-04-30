'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fmtK } from '@/lib/cbe';

export default function LearnerReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const adm = params.adm;

  const [user, setUser] = useState(null);
  const [learner, setLearner] = useState(null);
  const [feeCfg, setFeeCfg] = useState({});
  const [paylog, setPaylog] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const authRes = await fetch('/api/auth');
      const auth = await authRes.json();
      if (!auth.ok) { router.push('/'); return; }
      setUser(auth.user);

      const dbRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [
          { type: 'get', key: 'paav6_learners' },
          { type: 'get', key: 'paav6_feecfg' },
          { type: 'get', key: 'paav6_paylog' },
        ]})
      });
      const db = await dbRes.json();
      const allLearners = db.results[0]?.value || [];
      const l = allLearners.find(x => x.adm === adm);
      if (!l) { alert('Learner not found'); router.push('/fees'); return; }

      setLearner(l);
      setFeeCfg(db.results[1]?.value || {});
      const allLogs = db.results[2]?.value || [];
      const myLogs = allLogs.filter(p => p.adm === adm);
      setPaylog(myLogs.sort((a,b) => new Date(b.date) - new Date(a.date)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [adm, router]);

  useEffect(() => { if (adm) load(); }, [adm, load]);

  if (loading || !user || !learner) return <div style={{ padding: 40 }}>Loading receipt...</div>;

  const cfg = feeCfg[learner.grade] || {};
  const t1Fee = cfg.t1 || 0;
  const t2Fee = cfg.t2 || 0;
  const t3Fee = cfg.t3 || 0;
  const annualFee = (t1Fee + t2Fee + t3Fee) || cfg.annual || 5000;
  const paid = (learner.t1||0) + (learner.t2||0) + (learner.t3||0);
  const arrears = learner.arrears || 0;
  const bal = annualFee + arrears - paid;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '40px', background: '#fff', border: '1px solid #ddd', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Statement / Receipt</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 30, borderBottom: '2px solid var(--maroon)', paddingBottom: 20 }}>
        <div style={{ fontWeight: 900, fontSize: 24, color: 'var(--maroon)' }}>PAAV-GITOMBO COMMUNITY SCHOOL</div>
        <div style={{ fontSize: 14, color: '#666' }}>✝ More Than Academics!</div>
        <div style={{ fontWeight: 800, fontSize: 18, marginTop: 10, background: 'var(--maroon)', color: '#fff', padding: '6px 20px', borderRadius: 20, display: 'inline-block' }}>OFFICIAL FEES STATEMENT / RECEIPT</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
        <div>
          <div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase' }}>Student Details</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{learner.name}</div>
          <div style={{ fontSize: 14, color: '#444' }}>Admission No: <strong>{learner.adm}</strong></div>
          <div style={{ fontSize: 14, color: '#444' }}>Grade: {learner.grade}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase' }}>Statement Date</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div style={{ background: '#F8FAFF', padding: '20px 24px', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 15, marginBottom: 15, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#666' }}>ACCUMULATED FEE</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: arrears > 0 ? '#DC2626' : '#666' }}>KES {arrears.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#666' }}>ANNUAL FEE</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>KES {annualFee.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#666' }}>TOTAL PAID</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>KES {paid.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#666' }}>TOTAL BALANCE</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: bal > 0 ? '#DC2626' : '#059669' }}>KES {bal.toLocaleString()}</div>
          </div>
        </div>
        
        {(t1Fee > 0 || t2Fee > 0 || t3Fee > 0) && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4A5568', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Termly Fee Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #EDF2F7' }}>
              <div style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase' }}>Term 1 Expected</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtK(t1Fee)}</div>
              <div style={{ fontSize: 10, color: '#059669' }}>Paid: {fmtK(learner.t1||0)}</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #EDF2F7' }}>
              <div style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase' }}>Term 2 Expected</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtK(t2Fee)}</div>
              <div style={{ fontSize: 10, color: '#059669' }}>Paid: {fmtK(learner.t2||0)}</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #EDF2F7' }}>
              <div style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase' }}>Term 3 Expected</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtK(t3Fee)}</div>
              <div style={{ fontSize: 10, color: '#059669' }}>Paid: {fmtK(learner.t3||0)}</div>
            </div>
          </div>
        </div>
      )}
      </div>

      <div style={{ fontWeight: 800, marginBottom: 10 }}>PAYMENT HISTORY</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
            <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>Date</th>
            <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>Term</th>
            <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>Method</th>
            <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>Ref</th>
            <th style={{ padding: 10, borderBottom: '2px solid #ddd', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {paylog.map((p, i) => (
            <tr key={i} style={p.status === 'pending' ? { opacity: 0.6, background: '#FFF7ED' } : {}}>
              <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                {p.date}
                {p.status === 'pending' && <div style={{ fontSize: 9, color: '#92400E', fontWeight: 800 }}>⚠️ PENDING APPROVAL</div>}
              </td>
              <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{p.term}</td>
              <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{p.method}</td>
              <td style={{ padding: 10, borderBottom: '1px solid #eee', color: '#666' }}>{p.ref || '—'}</td>
              <td style={{ padding: 10, borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 700 }}>{fmtK(p.amount)}</td>
            </tr>
          ))}
          {paylog.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#999' }}>No payments recorded.</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px dashed #ddd', textAlign: 'center', fontSize: 11, color: '#999' }}>
        This is a computer generated official statement of PAAV-Gitombo Community School.<br/>
        Issued by: {user.name} · Printed on {new Date().toLocaleString()}
      </div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          div { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
