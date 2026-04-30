'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { ALL_GRADES } from '@/lib/cbe';

export default function InvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [feecfg, setFeecfg] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selGrade, setSelGrade] = useState('GRADE 7');
  const [selAdm, setSelAdm] = useState('');
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav6_learners', 'paav6_feecfg']);
    setLearners(db.paav6_learners || []);
    setFeecfg(db.paav6_feecfg || {});
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => learners.filter(l => l.grade === selGrade), [learners, selGrade]);
  const learner = useMemo(() => learners.find(l => l.adm === selAdm), [learners, selAdm]);

  useEffect(() => {
    if (learner) {
      const annual = feecfg[learner.grade]?.annual || 5000;
      const arrears = learner.arrears || 0;
      setPreview({
        learner,
        annual,
        arrears,
        total: annual + arrears,
        date: new Date().toLocaleDateString(),
        invoiceNo: 'INV-' + Date.now().toString().slice(-6)
      });
    } else {
      setPreview(null);
    }
  }, [learner, feecfg]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Invoices…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📄 Fee Invoicing Center</h2>
          <p>Generate formal termly invoices for parents</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-body" style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 150 }}>
            <label>Select Grade</label>
            <select value={selGrade} onChange={e => { setSelGrade(e.target.value); setSelAdm(''); }}>
              {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label>Select Learner</label>
            <select value={selAdm} onChange={e => setSelAdm(e.target.value)}>
              <option value="">— Choose Learner —</option>
              {filtered.map(l => <option key={l.adm} value={l.adm}>{l.name} ({l.adm})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr"><h3>👁 Invoice Preview</h3></div>
        <div className="panel-body">
          {!preview ? (
            <div style={{ textAlign: 'center', padding: 100, color: 'var(--muted)' }}>
              Select a grade and learner above to generate an invoice preview
            </div>
          ) : (
            <div id="invoice-printable" style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '30px 20px', borderRadius: 8, color: '#1E293B', maxWidth: 800, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
                <div>
                  <h1 style={{ margin: 0, color: '#8B1A1A' }}>INVOICE</h1>
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>#{preview.invoiceNo}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900 }}>PAAV-Gitombo School</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>P.O BOX 4091-00100 Nairobi</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>BILL TO:</div>
                  <div style={{ fontWeight: 700 }}>{preview.learner.name}</div>
                  <div style={{ fontSize: 13 }}>ADM: {preview.learner.adm} | Grade: {preview.learner.grade}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>DATE:</div>
                  <div style={{ fontWeight: 700 }}>{preview.date}</div>
                </div>
              </div>

              <div className="tbl-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1E293B' }}>
                      <th style={{ textAlign: 'left', padding: '10px 0' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '10px 0' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '15px 0' }}>Tuition Fees ({preview.learner.grade})</td>
                      <td style={{ textAlign: 'right', padding: '15px 0' }}>KSH {preview.annual.toLocaleString()}</td>
                    </tr>
                    {preview.arrears > 0 && (
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '15px 0' }}>Accumulated Arrears</td>
                        <td style={{ textAlign: 'right', padding: '15px 0' }}>KSH {preview.arrears.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', maxWidth: 250 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 20, borderTop: '2px solid #8B1A1A', paddingTop: 10, color: '#8B1A1A' }}>
                    <span>TOTAL:</span>
                    <span>KSH {preview.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 40, borderTop: '1px dashed #E2E8F0', paddingTop: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Pay via M-Pesa Paybill: <strong>4091000</strong> | Account: <strong>{preview.learner.adm}</strong>
                </p>
              </div>

              <div className="no-print" style={{ marginTop: 40, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print</button>
                <button className="btn btn-ghost">📧 Email Parent</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .page-hdr, .panel:not(:last-child) { display: none !important; }
          .panel:last-child { width: 100% !important; border: none !important; }
          .panel-hdr { display: none !important; }
          .page { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
