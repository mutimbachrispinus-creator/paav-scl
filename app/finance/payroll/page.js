'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';

export default function PayrollPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selStaff, setSelStaff] = useState(null);

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const db = await getCachedDBMulti(['paav6_staff']);
    setStaff(db.paav6_staff || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const calcPayroll = (gross) => {
    const g = Number(gross) || 0;
    
    // 1. NSSF (Simplified New Tiered)
    const nssf = Math.min(2160, g * 0.06);
    
    // 2. Housing Levy (1.5%)
    const levy = g * 0.015;
    
    // 3. SHIF / NHIF (2.75%)
    const shif = g * 0.0275;

    // 4. PAYE (Simplified progressive)
    let taxable = g - nssf;
    let paye = 0;
    if (taxable > 24000) {
      if (taxable <= 32333) paye = (taxable - 24000) * 0.1;
      else if (taxable <= 500000) paye = (32333 - 24000) * 0.1 + (taxable - 32333) * 0.25;
      else paye = (32333 - 24000) * 0.1 + (500000 - 32333) * 0.25 + (taxable - 500000) * 0.3;
    }
    // Less Personal Relief
    paye = Math.max(0, paye - 2400);

    const net = g - nssf - levy - shif - paye;

    return { gross: g, nssf, levy, shif, paye, net };
  };

  const payroll = useMemo(() => {
    if (!selStaff) return null;
    return calcPayroll(selStaff.salary || 0);
  }, [selStaff]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Payroll…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🇰🇪 Kenyan Payroll & Statutory Compliance</h2>
          <p>Manage staff salaries with automatic PAYE, NSSF, SHIF, and Housing Levy deductions</p>
        </div>
      </div>

      <div className="sg" style={{ gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div className="panel">
          <div className="panel-hdr"><h3>👥 Select Staff</h3></div>
          <div className="panel-body" style={{ maxHeight: 600, overflowY: 'auto' }}>
            {staff.map(s => (
              <div 
                key={s.username} 
                className={`audit-row ${selStaff?.username === s.username ? 'active' : ''}`}
                onClick={() => setSelStaff(s)}
                style={{ cursor: 'pointer', padding: '10px 15px', borderRadius: 8, background: selStaff?.username === s.username ? '#F1F5F9' : 'transparent' }}
              >
                <div style={{ fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.role} • KSH {(s.salary||0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          {!selStaff ? (
            <div style={{ textAlign: 'center', padding: 100, color: 'var(--muted)' }}>Select a staff member to process payroll</div>
          ) : (
            <>
              <div className="panel-hdr">
                <h3>Payslip Preview — {selStaff.name}</h3>
                <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 10px' }}>💾 Record & Generate</button>
              </div>
              <div className="panel-body">
                <div style={{ border: '1px solid #E2E8F0', padding: 30, borderRadius: 12, background: '#fff' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #1E293B', paddingBottom: 20, marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>PAAV-GITOMBO SCHOOL</h2>
                    <p style={{ margin: 5, color: 'var(--muted)' }}>MONTHLY PAYSLIP — {new Date().toLocaleString('en-KE', { month: 'long', year: 'numeric' })}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>EMPLOYEE:</div>
                      <div style={{ fontWeight: 700 }}>{selStaff.name}</div>
                      <div style={{ fontSize: 14 }}>Role: {selStaff.role}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>PAY DATE:</div>
                      <div style={{ fontWeight: 700 }}>{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ textAlign: 'left', padding: 10 }}>DESCRIPTION</th>
                        <th style={{ textAlign: 'right', padding: 10 }}>EARNINGS</th>
                        <th style={{ textAlign: 'right', padding: 10 }}>DEDUCTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 12 }}>Basic Salary</td>
                        <td style={{ textAlign: 'right', padding: 12 }}>{payroll.gross.toLocaleString()}</td>
                        <td></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 12 }}>NSSF Contribution</td>
                        <td></td>
                        <td style={{ textAlign: 'right', padding: 12, color: '#DC2626' }}>({payroll.nssf.toLocaleString()})</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 12 }}>Housing Levy (1.5%)</td>
                        <td></td>
                        <td style={{ textAlign: 'right', padding: 12, color: '#DC2626' }}>({Math.round(payroll.levy).toLocaleString()})</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 12 }}>SHIF / NHIF (2.75%)</td>
                        <td></td>
                        <td style={{ textAlign: 'right', padding: 12, color: '#DC2626' }}>({Math.round(payroll.shif).toLocaleString()})</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 12 }}>P.A.Y.E (Less Relief)</td>
                        <td></td>
                        <td style={{ textAlign: 'right', padding: 12, color: '#DC2626' }}>({Math.round(payroll.paye).toLocaleString()})</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#F8FAFC', fontWeight: 900, fontSize: 18 }}>
                        <td style={{ padding: 15 }}>NET PAY</td>
                        <td></td>
                        <td style={{ textAlign: 'right', padding: 15, color: '#16A34A' }}>KSH {Math.round(payroll.net).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px dashed #CBD5E1', fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                    This is a computer generated payslip. No signature required.
                    <br />"More Than Academics!"
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
