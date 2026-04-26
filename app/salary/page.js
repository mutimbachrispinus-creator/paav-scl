'use client';
/**
 * app/salary/page.js — Staff Salary & Payroll Management
 * 
 * Ported from index-122-3.html
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fmtK } from '@/lib/cbe';

export default function SalaryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [staff, setStaff] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [modal, setModal] = useState(null); // 'add' | null

  const load = useCallback(async () => {
    try {
      const [authRes, dbRes] = await Promise.all([
        fetch('/api/auth'),
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [
            { type: 'get', key: 'paav6_staff' },
            { type: 'get', key: 'paav7_salary' }
          ]})
        })
      ]);
      const auth = await authRes.json();
      if (!auth.ok || auth.user.role !== 'admin') { router.push('/dashboard'); return; }
      setUser(auth.user);

      const db = await dbRes.json();
      setStaff(db.results[0]?.value || []);
      setPayroll(db.results[1]?.value || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function savePayroll(rec) {
    setBusy(true);
    try {
      const updated = [rec, ...payroll];
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_salary', value: updated }] })
      });
      setPayroll(updated);
      setModal(null);
      alert('✅ Payroll record saved!');
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(id) {
    if (!confirm('Mark this salary as PAID?')) return;
    const updated = payroll.map(p => p.id === id ? { ...p, status: 'paid', paidDate: new Date().toLocaleDateString() } : p);
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav7_salary', value: updated }] })
    });
    setPayroll(updated);
  }

  if (loading) return <div className="page on"><p>Loading salary records...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>💵 Salary Management</h2>
          <p>Track staff payroll, deductions and payment status</p>
        </div>
        <div className="page-hdr-acts">
          <button className="btn btn-primary" onClick={() => setModal('add')}>➕ Record Payroll</button>
        </div>
      </div>

      <div className="sg sg4">
        <StatCard title="Total Paid (This Month)" val={fmtK(payroll.filter(p => p.status === 'paid').reduce((s, p) => s + p.net, 0))} icon="✅" bg="#ECFDF5" />
        <StatCard title="Pending" val={fmtK(payroll.filter(p => p.status === 'pending').reduce((s, p) => s + p.net, 0))} icon="⏳" bg="#FFF7ED" />
        <StatCard title="Staff Count" val={staff.length} icon="👔" bg="#EFF6FF" />
        <StatCard title="Total Records" val={payroll.length} icon="📜" bg="#F5F3FF" />
      </div>

      <div className="panel">
        <div className="panel-hdr"><h3>📜 Payroll History</h3></div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Staff Name</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payroll.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>No records found</td></tr> : 
                payroll.map((p, i) => (
                  <tr key={p.id || i}>
                    <td>{p.month}</td>
                    <td><strong>{p.staffName}</strong></td>
                    <td>{fmtK(p.basic)}</td>
                    <td>{fmtK(p.allowances)}</td>
                    <td>{fmtK(p.deductions)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{fmtK(p.net)}</td>
                    <td>
                      <span className={`badge bg-${p.status === 'paid' ? 'green' : 'amber'}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {p.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => markPaid(p.id)}>Mark Paid</button>
                      )}
                      <button className="btn btn-sm btn-ghost" style={{ marginLeft: 5 }} onClick={() => window.print()}>🖨️</button>
                      <button className="btn btn-danger btn-sm" style={{ marginLeft: 5 }}
                        onClick={async () => {
                          if(!confirm('Delete this salary record?')) return;
                          const updated = payroll.filter(x => x.id !== p.id);
                          await fetch('/api/db', {
                            method:'POST', headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ requests:[{ type:'set', key:'paav7_salary', value: updated }] })
                          });
                          setPayroll(updated);
                        }}>🗑️</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'add' && (
        <SalaryAddModal 
          staff={staff} 
          onSave={savePayroll} 
          onClose={() => setModal(null)} 
          busy={busy} 
        />
      )}
    </div>
  );
}

function StatCard({ title, val, icon, bg }) {
  return (
    <div className="stat-card">
      <div className="sc-inner">
        <div className="sc-icon" style={{ background: bg }}>{icon}</div>
        <div>
          <div className="sc-n">{val}</div>
          <div className="sc-l">{title}</div>
        </div>
      </div>
    </div>
  );
}

function SalaryAddModal({ staff, onSave, onClose, busy }) {
  const [sid, setSid] = useState('');
  const [basic, setBasic] = useState(0);
  const [allow, setAllow] = useState(0);
  const [deduct, setDeduct] = useState(0);
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

  useEffect(() => {
    if (sid) {
      const s = staff.find(x => x.id === sid);
      if (s) {
        setBasic(s.salaryBasic || 0);
        setAllow((s.salaryHousing || 0) + (s.salaryTransport || 0));
      }
    }
  }, [sid, staff]);

  const net = basic + allow - deduct;

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-hdr"><h3>➕ Record Salary Payment</h3><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="field">
            <label>Select Staff</label>
            <select value={sid} onChange={e => setSid(e.target.value)}>
              <option value="">— Choose —</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
            </select>
          </div>
          <div className="field">
            <label>For Month</label>
            <input value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field"><label>Basic Salary</label><input type="number" value={basic} onChange={e => setBasic(Number(e.target.value))} /></div>
            <div className="field"><label>Total Allowances</label><input type="number" value={allow} onChange={e => setAllow(Number(e.target.value))} /></div>
          </div>
          <div className="field">
            <label>Deductions (NHIF/NSSF/Advance)</label>
            <input type="number" value={deduct} onChange={e => setDeduct(Number(e.target.value))} />
          </div>
          <div style={{ background: '#F8FAFF', padding: 15, borderRadius: 8, marginTop: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666' }}>ESTIMATED NET PAY</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)' }}>KES {net.toLocaleString()}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !sid} onClick={() => onSave({
            id: Date.now(),
            staffId: sid,
            staffName: staff.find(x => x.id === sid).name,
            basic, allowances: allow, deductions: deduct,
            net, month, status: 'pending'
          })}>
            {busy ? 'Saving...' : '💾 Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
