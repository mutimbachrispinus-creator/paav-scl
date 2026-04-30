'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { ALL_GRADES } from '@/lib/cbe';

export default function InvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [learners, setLearners] = useState([]);
  const [feecfg, setFeecfg] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selGrade, setSelGrade] = useState('ALL');
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

  const filtered = selGrade === 'ALL' ? learners : learners.filter(l => l.grade === selGrade);

  function generateInvoice(learner) {
    const annual = feecfg[learner.grade]?.annual || 5000;
    const arrears = learner.arrears || 0;
    const total = annual + arrears;
    
    setPreview({
      learner,
      annual,
      arrears,
      total,
      date: new Date().toLocaleDateString(),
      invoiceNo: 'INV-' + Date.now().toString().slice(-6)
    });
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Invoices…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📄 Fee Invoicing Center</h2>
          <p>Generate and dispatch formal termly invoices to parents</p>
        </div>
      </div>

      <div className="sg" style={{ gridTemplateColumns: '400px 1fr', gap: 20 }}>
        <div className="panel">
          <div className="panel-hdr"><h3>📋 Learner Selection</h3></div>
          <div className="panel-body">
            <div className="field">
              <label>Filter Grade</label>
              <select value={selGrade} onChange={e => setSelGrade(e.target.value)}>
                <option value="ALL">All Grades</option>
                {ALL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ maxHeight: 600, overflowY: 'auto', marginTop: 15 }}>
              {filtered.map(l => (
                <div key={l.adm} className="audit-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.adm} • {l.grade}</div>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => generateInvoice(l)}>Generate</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>👁 Invoice Preview</h3></div>
          <div className="panel-body">
            {!preview ? (
              <div style={{ textAlign: 'center', padding: 100, color: 'var(--muted)' }}>
                Select a learner to generate an invoice preview
              </div>
            ) : (
              <div id="invoice-printable" style={{ background: '#fff', border: '1px solid #E2E8F0', padding: 40, borderRadius: 8, color: '#1E293B', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                  <div>
                    <h1 style={{ margin: 0, color: '#8B1A1A' }}>INVOICE</h1>
                    <p style={{ color: 'var(--muted)', fontSize: 14 }}>#{preview.invoiceNo}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900 }}>PAAV-Gitombo Community School</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>P.O BOX 4091-00100 Nairobi</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>0758 922 915</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>BILL TO:</div>
                    <div style={{ fontWeight: 700 }}>{preview.learner.name}</div>
                    <div style={{ fontSize: 14 }}>ADM: {preview.learner.adm}</div>
                    <div style={{ fontSize: 14 }}>Grade: {preview.learner.grade}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>DATE:</div>
                    <div style={{ fontWeight: 700 }}>{preview.date}</div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1E293B' }}>
                      <th style={{ textAlign: 'left', padding: '10px 0' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '10px 0' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '15px 0' }}>Termly Tuition Fees ({preview.learner.grade})</td>
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

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: 250 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span>Subtotal:</span>
                      <span>KSH {preview.total.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 20, borderTop: '2px solid #8B1A1A', paddingTop: 10, color: '#8B1A1A' }}>
                      <span>TOTAL:</span>
                      <span>KSH {preview.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 60, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Payment Information:</h4>
                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Please make payments via M-Pesa Paybill: <strong>4091000</strong><br />
                    Account Number: <strong>{preview.learner.adm}</strong><br />
                    For any queries, contact the school bursar at 0758 922 915.
                  </p>
                </div>

                <div className="no-print" style={{ marginTop: 40, display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print Invoice</button>
                  <button className="btn btn-ghost">📧 Email to Parent</button>
                </div>
              </div>
            )}
          </div>
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
