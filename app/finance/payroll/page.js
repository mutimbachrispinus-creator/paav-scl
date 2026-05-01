'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';

const M = '#8B1A1A', M2 = '#6B1212', ML = '#FDF2F2', MB = '#F5E6E6';

export default function UnifiedPayrollPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  const [tab, setTab] = useState('calc'); 
  const [selStaffId, setSelStaffId] = useState('');
  const [printSlip, setPrintSlip] = useState(null);

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav6_staff', 'paav7_salary']);
    const onlyStaff = (db.paav6_staff || []).filter(s => s.role !== 'parent');
    setStaff(onlyStaff);
    setPayroll(db.paav7_salary || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const selStaff = useMemo(() => staff.find(s => s.username === selStaffId), [staff, selStaffId]);

  /* ── Kenyan Payroll Logic ── */
  const currentPay = useMemo(() => {
    if (!selStaff) return null;
    const g = Number(selStaff.salary) || 0;
    const nssf = Math.min(2160, g * 0.06);
    const levy = g * 0.015;
    const shif = g * 0.0275;
    let taxable = g - nssf;
    let paye = 0;
    if (taxable > 24000) {
      if (taxable <= 32333) paye = (taxable - 24000) * 0.1;
      else if (taxable <= 500000) paye = (32333 - 24000) * 0.1 + (taxable - 32333) * 0.25;
      else paye = (32333 - 24000) * 0.1 + (500000 - 32333) * 0.25 + (taxable - 500000) * 0.3;
    }
    paye = Math.max(0, paye - 2400); 
    const net = g - nssf - levy - shif - paye;
    return { gross: g, nssf, levy, shif, paye, net };
  }, [selStaff]);

  async function saveRecord() {
    if (!selStaff || !currentPay) return;
    setBusy(true);
    const rec = {
      id: Date.now(),
      staffId: selStaff.username,
      staffName: selStaff.name,
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      basic: selStaff.salary,
      nssf: currentPay.nssf,
      levy: currentPay.levy,
      shif: currentPay.shif,
      paye: currentPay.paye,
      net: currentPay.net,
      status: 'pending',
      date: new Date().toLocaleDateString()
    };

    try {
      const updated = [rec, ...payroll];
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_salary', value: updated }] })
      });
      setPayroll(updated);
      setTab('history');
      alert('✅ Payroll record saved!');
    } catch (e) {
      alert('❌ Save failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(id) {
    const updated = payroll.map(p => p.id === id ? { ...p, status: 'paid', paidDate: new Date().toLocaleDateString() } : p);
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_salary', value: updated }] })
    });
    setPayroll(updated);
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Unified Payroll…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>💵 Staff Payroll Hub</h2>
          <p>Consolidated salary management and statutory compliance</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 25, background: MB, borderRadius: 12, padding: 5 }}>
        <button className={`tab-btn ${tab === 'calc' ? 'on' : ''}`} onClick={() => setTab('calc')} style={tab === 'calc' ? { background: M, color: '#fff' } : {}}>🧮 Calculator</button>
        <button className={`tab-btn ${tab === 'history' ? 'on' : ''}`} onClick={() => setTab('history')} style={tab === 'history' ? { background: M, color: '#fff' } : {}}>📜 History</button>
        <button className={`tab-btn ${tab === 'settings' ? 'on' : ''}`} onClick={() => setTab('settings')} style={tab === 'settings' ? { background: M, color: '#fff' } : {}}>⚙️ Settings</button>
      </div>

      {tab === 'calc' && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-body">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Select Staff Member</label>
              <select value={selStaffId} onChange={e => setSelStaffId(e.target.value)}>
                <option value="">— Choose Staff —</option>
                {staff.map(s => <option key={s.username} value={s.username}>{s.name} ({s.role})</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === 'calc' && (
        <div className="panel">
          {!selStaff ? (
            <div style={{ textAlign: 'center', padding: 100, color: 'var(--muted)' }}>Select a staff member above to process payroll</div>
          ) : (
            <div className="panel-body">
              <div style={{ border: `2px solid ${M}`, padding: 30, borderRadius: 15, background: '#fff' }}>
                <div style={{ textAlign: 'center', borderBottom: `2px solid ${M}`, paddingBottom: 20, marginBottom: 20 }}>
                  <h2 style={{ margin: 0, color: M }}>SCHOOL PORTAL SCHOOL</h2>
                  <p style={{ margin: 5, color: 'var(--muted)' }}>MONTHLY PAYSLIP — {new Date().toLocaleString('en-KE', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30, flexWrap: 'wrap', gap: 15 }}>
                  <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>EMPLOYEE:</div><div style={{ fontWeight: 700 }}>{selStaff.name}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: 'var(--muted)' }}>BASE SALARY:</div><div style={{ fontWeight: 700 }}>KSH {selStaff.salary?.toLocaleString()}</div></div>
                </div>
                <div className="tbl-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}><td style={{ padding: 12 }}>NSSF Contribution</td><td style={{ textAlign: 'right', color: '#DC2626' }}>({currentPay.nssf.toLocaleString()})</td></tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}><td style={{ padding: 12 }}>Housing Levy (1.5%)</td><td style={{ textAlign: 'right', color: '#DC2626' }}>({Math.round(currentPay.levy).toLocaleString()})</td></tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}><td style={{ padding: 12 }}>SHIF / NHIF (2.75%)</td><td style={{ textAlign: 'right', color: '#DC2626' }}>({Math.round(currentPay.shif).toLocaleString()})</td></tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}><td style={{ padding: 12 }}>P.A.Y.E (Less Relief)</td><td style={{ textAlign: 'right', color: '#DC2626' }}>({Math.round(currentPay.paye).toLocaleString()})</td></tr>
                      <tr style={{ background: '#F8FAFC', fontWeight: 900, fontSize: 20 }}><td style={{ padding: 15 }}>NET PAY</td><td style={{ textAlign: 'right', padding: 15, color: '#16A34A' }}>KSH {Math.round(currentPay.net).toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 30, padding: 15 }} onClick={saveRecord} disabled={busy}>{busy ? 'Processing...' : '💾 Record & Generate Payslip'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="panel">
          <div className="panel-hdr"><h3>📜 Payroll History</h3></div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Staff</th>
                  <th>Basic</th>
                  <th>Statutory</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 11 }}>{p.month}</td>
                    <td style={{ fontWeight: 700 }}>{p.staffName}</td>
                    <td>{p.basic.toLocaleString()}</td>
                    <td style={{ color: '#DC2626' }}>({Math.round(p.nssf + p.levy + p.shif + p.paye).toLocaleString()})</td>
                    <td style={{ fontWeight: 900, color: M }}>{Math.round(p.net).toLocaleString()}</td>
                    <td><span className={`badge bg-${p.status === 'paid' ? 'green' : 'amber'}`}>{p.status.toUpperCase()}</span></td>
                    <td style={{ display: 'flex', gap: 5 }}>
                      {p.status === 'pending' && <button className="btn btn-sm btn-success" onClick={() => markPaid(p.id)}>Paid</button>}
                      <button className="btn btn-sm btn-ghost" onClick={() => setPrintSlip(p)}>🖨️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="panel">
          <div className="panel-hdr"><h3>⚙️ Staff Salary Settings</h3></div>
          <div className="panel-body">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Role</th>
                    <th>Base Salary (KSH)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.username}>
                      <td><strong>{s.name}</strong></td>
                      <td style={{ fontSize: 11 }}>{s.role}</td>
                      <td><input type="number" defaultValue={s.salary} className="field" style={{ width: 120, margin: 0 }} /></td>
                      <td><button className="btn btn-sm btn-ghost">Update</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {printSlip && (
        <div className="modal-overlay open">
          <div className="modal modal-lg">
            <div className="modal-hdr"><h3>🖨️ Payslip — {printSlip.staffName}</h3><button className="modal-close" onClick={() => setPrintSlip(null)}>✕</button></div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ border: '2px solid #ddd', padding: 30, borderRadius: 10, maxWidth: 500, margin: '0 auto', textAlign: 'left' }}>
                 <div style={{ textAlign: 'center', borderBottom: '2px solid #8B1A1A', paddingBottom: 10, marginBottom: 15 }}>
                    <div style={{ fontWeight: 800, color: '#8B1A1A' }}>SCHOOL PORTAL COMMUNITY SCHOOL</div>
                 </div>
                 <table style={{ width: '100%', fontSize: 13 }}>
                   <tbody>
                     <tr><td><strong>Employee</strong></td><td>{printSlip.staffName}</td></tr>
                     <tr><td><strong>Month</strong></td><td>{printSlip.month}</td></tr>
                     <tr style={{ background: '#f9f9f9' }}><td colSpan={2}><strong>EARNINGS</strong></td></tr>
                     <tr><td>Basic Salary</td><td>KSH {printSlip.basic.toLocaleString()}</td></tr>
                     <tr style={{ background: '#f9f9f9' }}><td colSpan={2}><strong>DEDUCTIONS</strong></td></tr>
                     <tr><td>Total Statutory</td><td>KSH {Math.round(printSlip.nssf + printSlip.levy + printSlip.shif + printSlip.paye).toLocaleString()}</td></tr>
                     <tr style={{ background: M, color: '#fff', fontWeight: 800 }}><td>NET PAY</td><td>KSH {Math.round(printSlip.net).toLocaleString()}</td></tr>
                   </tbody>
                 </table>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => window.print()}>Print Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
