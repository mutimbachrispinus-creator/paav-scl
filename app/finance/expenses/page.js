'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, getCachedDBMulti } from '@/lib/client-cache';

const CATEGORIES = ['Salaries', 'Supplies', 'Maintenance', 'Utilities', 'Taxes', 'Events', 'Other'];

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: 'Supplies', amount: '', date: new Date().toISOString().split('T')[0], description: '' });

  const load = useCallback(async () => {
    const u = await getCachedUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);

    const res = await fetch('/api/finance/expenses');
    const data = await res.json();
    setExpenses(data.expenses || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.ok) {
      setExpenses([data.expense, ...expenses]);
      setForm({ category: 'Supplies', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    }
    setAdding(false);
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading Expenses…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🧾 School Expenditure Tracker</h2>
          <p>Record and monitor all school-related expenses</p>
        </div>
        <div style={{ background: '#FFF5F5', padding: '10px 20px', borderRadius: 12, border: '1.5px solid #8B1A1A' }}>
          <div style={{ fontSize: 11, color: '#8B1A1A', fontWeight: 700 }}>TOTAL EXPENDITURE</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#8B1A1A' }}>KSH {total.toLocaleString()}</div>
        </div>
      </div>

      <div className="sg sg2">
        <div className="panel">
          <div className="panel-hdr"><h3>➕ Record New Expense</h3></div>
          <form className="panel-body" onSubmit={handleAdd}>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Amount (KSH)</label>
              <input type="number" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What was this for?..." rows={3} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} disabled={adding}>
              {adding ? '⏳ Recording...' : '💾 Save Expense'}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>📋 Recent Expenses</h3></div>
          <div className="panel-body" style={{ maxHeight: 600, overflowY: 'auto' }}>
            {expenses.map(e => (
              <div key={e.id} className="audit-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{e.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{e.description}</div>
                  <div style={{ fontSize: 10, color: 'var(--light)', marginTop: 4 }}>{new Date(e.date).toLocaleDateString()} • by {e.recordedBy}</div>
                </div>
                <div style={{ fontWeight: 900, color: '#DC2626' }}>- KSH {e.amount.toLocaleString()}</div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No expenses recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
