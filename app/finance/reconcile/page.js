'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';

export default function ReconcilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [paylog, setPaylog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState([]);
  const [matches, setMatches] = useState([]);

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav6_paylog']);
    setPaylog(db.paav6_paylog || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const text = f.target.result;
      const rows = text.split('\n').map(r => r.split(','));
      // Assume CSV: Date, Ref, Name, Amount
      const parsed = rows.slice(1).map(r => ({
        date: r[0],
        ref: r[1],
        name: r[2],
        amount: Number(r[3])
      })).filter(r => r.amount > 0);
      setCsvData(parsed);
      
      // Auto-match by Ref or Amount+Date
      const autoMatches = parsed.map(c => {
        const portalMatch = paylog.find(p => p.ref === c.ref || (p.amount === c.amount && p.date === c.date));
        return { bank: c, portal: portalMatch, status: portalMatch ? 'matched' : 'missing' };
      });
      setMatches(autoMatches);
    };
    reader.readAsText(file);
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Reconciler…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🏦 Bank Reconciliation</h2>
          <p>Match bank statements with portal fee records to ensure 100% data integrity</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-hdr">
          <h3>📂 Upload Bank Statement (CSV)</h3>
        </div>
        <div className="panel-body">
          <div style={{ border: '2px dashed #E2E8F0', padding: 40, textAlign: 'center', borderRadius: 12 }}>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ marginBottom: 15 }} />
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Format: Date, Reference, Payer, Amount</p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-hdr">
          <h3>📊 Reconciliation Summary</h3>
        </div>
        <div className="panel-body">
          <div className="sg sg3" style={{ marginBottom: 20 }}>
            <div className="panel" style={{ textAlign: 'center', background: '#F8FAFC' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>TOTAL BANK ENTRIES</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{csvData.length}</div>
            </div>
            <div className="panel" style={{ textAlign: 'center', background: '#F0FDF4' }}>
              <div style={{ fontSize: 11, color: '#166534' }}>MATCHED</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#166534' }}>{matches.filter(m => m.status === 'matched').length}</div>
            </div>
            <div className="panel" style={{ textAlign: 'center', background: '#FEF2F2' }}>
              <div style={{ fontSize: 11, color: '#991B1B' }}>MISSING IN PORTAL</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#991B1B' }}>{matches.filter(m => m.status === 'missing').length}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>BANK ENTRY</th>
                <th style={{ textAlign: 'left', padding: 12 }}>PORTAL RECORD</th>
                <th style={{ textAlign: 'right', padding: 12 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{m.bank.ref}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.bank.date} • KSH {m.bank.amount.toLocaleString()}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    {m.portal ? (
                      <>
                        <div style={{ fontWeight: 700 }}>{m.portal.name || 'Payer'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.portal.date} • KSH {m.portal.amount.toLocaleString()}</div>
                      </>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', padding: 12 }}>
                    <span className={`badge ${m.status === 'matched' ? 'bg-green' : 'bg-red'}`}>
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
