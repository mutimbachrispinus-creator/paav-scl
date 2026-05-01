'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SaaSQuickSignup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    schoolName: '',
    adminName: '',
    adminUsername: '',
    adminPassword: '',
    phone: '',
    email: ''
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/saas/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      setSuccess(json.message);
      setTimeout(() => {
        router.push(json.loginUrl);
      }, 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page" style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="panel" style={{ maxWidth: 500, width: '100%', padding: 40, borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 35 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏫</div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1E293B' }}>Join the PAAV Network</h1>
          <p style={{ color: '#64748B', marginTop: 8 }}>Register your school for a 30-day free trial</p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 12, color: '#991B1B', fontSize: 13, marginBottom: 20, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 50, marginBottom: 20 }}>✅</div>
            <h2 style={{ color: '#166534', margin: 0 }}>Registration Complete!</h2>
            <p style={{ color: '#64748B' }}>{success}</p>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Redirecting to your login portal…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label>School Name</label>
              <input 
                required
                placeholder="e.g. Hilltop Primary School"
                value={form.schoolName} 
                onChange={e => setForm({...form, schoolName: e.target.value})} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="form-group">
                <label>Admin Full Name</label>
                <input 
                  required
                  placeholder="Principal's Name"
                  value={form.adminName} 
                  onChange={e => setForm({...form, adminName: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Admin Username</label>
                <input 
                  required
                  placeholder="admin-user"
                  value={form.adminUsername} 
                  onChange={e => setForm({...form, adminUsername: e.target.value})} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Admin Password</label>
              <input 
                required
                type="password"
                placeholder="••••••••"
                value={form.adminPassword} 
                onChange={e => setForm({...form, adminPassword: e.target.value})} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  required
                  placeholder="07..."
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Email (Optional)</label>
                <input 
                  type="email"
                  placeholder="school@example.com"
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                />
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: '14px', fontSize: 16, marginTop: 10 }}
            >
              {loading ? 'Creating Your Portal…' : 'Start My 30-Day Free Trial'}
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .form-group label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94A3B8; margin-bottom: 6px; }
        .form-group input { width: 100%; padding: 12px 16px; border: 1.5px solid #E2E8F0; borderRadius: 12px; font-size: 14px; outline: none; transition: all 0.2s; }
        .form-group input:focus { border-color: #8B1A1A; box-shadow: 0 0 0 4px rgba(139,26,26,0.1); }
      `}</style>
    </div>
  );
}
