'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';

export default function FinanceDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const res = await fetch('/api/finance/ledger');
    const data = await res.json();
    setLedger(data.ledger || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const months = {};
    let totalIncome = 0;
    let totalExpense = 0;

    ledger.forEach(tx => {
      const month = tx.date.slice(0, 7); // YYYY-MM
      if (!months[month]) months[month] = { month, income: 0, expense: 0 };
      
      // Simplified: Assume 4000 series is Income, 5000 is Expense
      if (tx.creditAcc.startsWith('4')) {
        months[month].income += tx.amount;
        totalIncome += tx.amount;
      } else if (tx.debitAcc.startsWith('5')) {
        months[month].expense += tx.amount;
        totalExpense += tx.amount;
      }
    });

    return { 
      chartData: Object.values(months).sort((a,b) => a.month.localeCompare(b.month)),
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [ledger]);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Finance Dashboard…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>💰 Enterprise Finance Dashboard</h2>
          <p>Real-time school financial health and cash flow analytics</p>
        </div>
      </div>

      <div className="sg sg3" style={{ marginBottom: 20 }}>
        <div className="panel" style={{ textAlign: 'center', background: '#F0FDF4' }}>
          <div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>TOTAL INCOME</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#166534' }}>KSH {stats.totalIncome.toLocaleString()}</div>
        </div>
        <div className="panel" style={{ textAlign: 'center', background: '#FEF2F2' }}>
          <div style={{ fontSize: 11, color: '#991B1B', fontWeight: 700 }}>TOTAL EXPENSES</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#991B1B' }}>KSH {stats.totalExpense.toLocaleString()}</div>
        </div>
        <div className="panel" style={{ textAlign: 'center', background: '#F0F9FF', border: '2px solid #0369A1' }}>
          <div style={{ fontSize: 11, color: '#0369A1', fontWeight: 700 }}>NET BALANCE</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0369A1' }}>KSH {stats.balance.toLocaleString()}</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: '#fff', border: 'none' }}>
        <div className="panel-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <span style={{ fontSize: 24 }}>🤖</span>
              <h3 style={{ margin: 0, color: '#fff' }}>Smart AI Budget Forecast</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>Based on your average monthly burn rate of <strong>KSH {Math.round(stats.totalExpense / (stats.chartData.length || 1)).toLocaleString()}</strong></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>Estimated Sustainability</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FCD34D' }}>
              {stats.balance > 0 ? `${Math.floor(stats.balance / (stats.totalExpense / (stats.chartData.length || 1)))} Months` : 'Urgent Funding Needed'}
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8' }}>*Predicted with current spending trends</div>
          </div>
        </div>
      </div>

      <div className="sg-responsive">
        <div className="panel">
          <div className="panel-hdr"><h3>📊 Cash Flow (Monthly)</h3></div>
          <div className="panel-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="income" fill="#16A34A" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#DC2626" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>🔮 Revenue Forecast</h3></div>
          <div className="panel-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                ...stats.chartData.slice(-3),
                { month: 'Next Month (Est.)', income: Math.round(stats.totalIncome / (stats.chartData.length || 1) * 1.1), isForecast: true }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                   {stats.chartData.slice(-3).concat([{ month: 'Next Month (Est.)' }]).map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 3 ? '#9333EA' : '#0369A1'} fillOpacity={index === 3 ? 0.6 : 1} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>⚡ Quick Actions</h3></div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="quick-access-btn" onClick={() => router.push('/finance/invoices')}>📄 Generate Invoices</button>
            <button className="quick-access-btn" onClick={() => router.push('/finance/expenses')}>🧾 Record Expenditure</button>
            <button className="quick-access-btn" onClick={() => router.push('/finance/payroll')}>🇰🇪 Process Payroll</button>
            <button className="quick-access-btn" onClick={() => router.push('/finance/reconcile')}>🏦 Bank Reconciliation</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-hdr"><h3>📜 Recent Ledger Transactions</h3></div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Debit</th>
                <th>Credit</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger.slice(0, 10).map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: 12 }}>{tx.date}</td>
                  <td style={{ fontWeight: 600 }}>{tx.description}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{tx.reference}</td>
                  <td style={{ fontSize: 11 }}>{tx.debitAcc}</td>
                  <td style={{ fontSize: 11 }}>{tx.creditAcc}</td>
                  <td style={{ textAlign: 'right', fontWeight: 900 }}>KSH {tx.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .sg-responsive {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        .quick-access-btn {
          display: flex;
          align-items: center;
          padding: 15px;
          background: #fff;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-weight: 700;
          color: #475569;
          transition: all 0.2s;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .quick-access-btn:hover {
          border-color: #0369A1;
          background: #F0F9FF;
          transform: translateX(5px);
        }
        @media (max-width: 800px) {
          .sg-responsive {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
