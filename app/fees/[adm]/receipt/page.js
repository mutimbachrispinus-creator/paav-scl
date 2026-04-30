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
    <>
    <div className="receipt-statement-wrap" style={{ maxWidth: 500, margin: '20px auto' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '0 20px' }}>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Statement / Receipt</button>
      </div>

      <div style={{ margin: '0 auto', padding: '20px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '105mm', minHeight: '148mm' }} className="standard-statement">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottom: '2px solid var(--maroon)', paddingBottom: 10 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--maroon)', letterSpacing: -0.5 }}>PAAV-GITOMBO SCHOOL</div>
          <div style={{ fontSize: 10, color: '#444', fontWeight: 600 }}>✝ More Than Academics!</div>
          <div style={{ fontSize: 9, color: '#666' }}>Tel: 0758 922 915</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 12, background: 'var(--maroon)', color: '#fff', padding: '4px 12px', borderRadius: 4 }}>FEES STATEMENT</div>
          <div style={{ fontSize: 9, marginTop: 4, color: '#666' }}>Year: {new Date().getFullYear()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
        <div>
          <div style={{ color: '#666', fontSize: 9, textTransform: 'uppercase' }}>Learner</div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{learner.name}</div>
          <div style={{ fontSize: 11, color: '#444' }}>ADM: <strong>{learner.adm}</strong> | {learner.grade}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#666', fontSize: 9, textTransform: 'uppercase' }}>Date</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div style={{ background: '#F8FAFF', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 15 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
          <div>
            <div style={{ fontSize: 8, color: '#666', fontWeight: 700 }}>ARREARS</div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>{arrears.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, color: '#666', fontWeight: 700 }}>ANNUAL</div>
            <div style={{ fontSize: 12, fontWeight: 900 }}>{annualFee.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, color: '#666', fontWeight: 700 }}>PAYABLE</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--maroon)' }}>{(annualFee + arrears).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, color: '#666', fontWeight: 700 }}>PAID</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#059669' }}>{paid.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '5px 0' }}>
          <div>
            <div style={{ fontSize: 7, color: '#666' }}>T1 EXP</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>{t1Fee.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 7, color: '#666' }}>T2 EXP</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>{t2Fee.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 7, color: '#666' }}>T3 EXP</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>{t3Fee.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, color: '#666', fontWeight: 800 }}>BALANCE</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: bal > 0 ? '#DC2626' : '#059669' }}>{bal.toLocaleString()}</div>
          </div>
        </div>
      </div>
        
        {(t1Fee > 0 || t2Fee > 0 || t3Fee > 0) && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4A5568', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Termly Fee Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #EDF2F7' }}>
              <div style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase' }}>Term 1</div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>Exp: {fmtK(t1Fee)}</div>
              <div style={{ fontSize: 10, color: '#059669' }}>Paid: {fmtK(learner.t1||0)}</div>
              <div style={{ fontSize: 10, color: t1Fee - (learner.t1||0) > 0 ? '#DC2626' : '#059669', fontWeight: 700 }}>Bal: {fmtK(t1Fee - (learner.t1||0))}</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #EDF2F7' }}>
              <div style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase' }}>Term 2</div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>Exp: {fmtK(t2Fee)}</div>
              <div style={{ fontSize: 10, color: '#059669' }}>Paid: {fmtK(learner.t2||0)}</div>
              <div style={{ fontSize: 10, color: t2Fee - (learner.t2||0) > 0 ? '#DC2626' : '#059669', fontWeight: 700 }}>Bal: {fmtK(t2Fee - (learner.t2||0))}</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #EDF2F7' }}>
              <div style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase' }}>Term 3</div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>Exp: {fmtK(t3Fee)}</div>
              <div style={{ fontSize: 10, color: '#059669' }}>Paid: {fmtK(learner.t3||0)}</div>
              <div style={{ fontSize: 10, color: t3Fee - (learner.t3||0) > 0 ? '#DC2626' : '#059669', fontWeight: 700 }}>Bal: {fmtK(t3Fee - (learner.t3||0))}</div>
            </div>
          </div>
        </div>
      )}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '15px 0' }}></div>

      <div style={{ fontSize: 11, marginBottom: 5 }}>PAYMENT HISTORY</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
        <thead>
          <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
            <th style={{ padding: 6, borderBottom: '1px solid #ddd' }}>Date</th>
            <th style={{ padding: 6, borderBottom: '1px solid #ddd' }}>Term</th>
            <th style={{ padding: 6, borderBottom: '1px solid #ddd' }}>Method</th>
            <th style={{ padding: 6, borderBottom: '1px solid #ddd', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {paylog.slice(0, 8).map((p, i) => (
            <tr key={i}>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{p.date.split('-').slice(1).join('/')}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{p.term}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{p.method}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 700 }}>{p.amount}</td>
            </tr>
          ))}
          {paylog.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#999' }}>No payments recorded.</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '20px 0' }}></div>
      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--maroon)' }}>
        Thank you for your payment!
      </div>
      <div style={{ textAlign: 'center', fontSize: 9, color: '#666', marginTop: 8 }}>
        This is a computer generated official statement.<br/>
        Issued by: {user.name} · {new Date().toLocaleDateString()}
      </div>
      </div>
    </div>
  </div>

  <style jsx>{`
        @media print {
          @page { size: portrait; margin: 0; }
          .no-print { display: none !important; }
          body { background: white !important; padding: 0; margin: 0; }
          .receipt-statement-wrap { margin: 0 !important; padding: 0 !important; max-width: none !important; }
          .standard-statement { 
            box-shadow: none !important; 
            border: 1px solid #eee !important; 
            margin: 0 !important; 
            padding: 10mm !important; 
            width: 105mm !important;
            height: 148mm !important;
            overflow: hidden;
          }
        }
      `}</style>
    </>
  );
}
