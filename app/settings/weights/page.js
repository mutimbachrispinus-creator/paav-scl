'use client';
export const runtime = 'edge';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser } from '@/lib/client-cache';

const NAVY = '#0F172A';
const SLATE = '#64748B';

export default function WeightsSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weights, setWeights] = useState({ op1: 33.33, mt1: 33.33, et1: 33.34 });

  const load = useCallback(async () => {
    try {
      const u = await getCachedUser();
      if (!u || u.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setUser(u);

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'get', key: 'paav_grading_weights' }] })
      });
      const data = await res.json();
      const val = data.results?.[0]?.value;
      if (val) {
        setWeights({
          op1: val.op1 * 100,
          mt1: val.mt1 * 100,
          et1: val.et1 * 100
        });
      }
    } catch (e) {
      console.error('Failed to load weights:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const total = Number(weights.op1) + Number(weights.mt1) + Number(weights.et1);
  const isValid = Math.abs(total - 100) < 0.01;

  const save = async () => {
    if (!isValid) {
      alert('The total weights must equal exactly 100%. Current total: ' + total.toFixed(2) + '%');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        op1: weights.op1 / 100,
        mt1: weights.mt1 / 100,
        et1: weights.et1 / 100
      };
      
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_grading_weights', value: payload }] })
      });
      const data = await res.json();
      if (data.results?.[0]?.ok) {
        alert('✅ Assessment weights updated successfully!');
      } else {
        throw new Error('Failed to save weights');
      }
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page on"><p>Loading weights...</p></div>;

  return (
    <div className="page on" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <div className="page-hdr" style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: '#fff', padding: '30px 40px', borderRadius: '0 0 24px 24px', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button onClick={() => router.back()} className="btn btn-ghost" style={{ color: '#fff', padding: 10 }}>←</button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>⚖️ Assessment Weights</h1>
            <p style={{ color: '#94A3B8', margin: '5px 0 0 0' }}>Configure how much each assessment type contributes to the final termly average.</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 40px 40px', maxWidth: 600, margin: '0 auto' }}>
        <div className="panel" style={{ padding: 30 }}>
          <div style={{ marginBottom: 25 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Termly Weight Distribution</h2>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: SLATE }}>Total must equal 100%.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <WeightInput label="Opener Assessment (OP1)" val={weights.op1} set={v => setWeights({...weights, op1: v})} color="#3B82F6" />
            <WeightInput label="Mid-Term Assessment (MT1)" val={weights.mt1} set={v => setWeights({...weights, mt1: v})} color="#F59E0B" />
            <WeightInput label="End-Term Assessment (ET1)" val={weights.et1} set={v => setWeights({...weights, et1: v})} color="#10B981" />
          </div>

          <div style={{ marginTop: 30, padding: 20, background: isValid ? '#F0FDF4' : '#FEF2F2', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: isValid ? '#166534' : '#991B1B' }}>Total Weight</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: isValid ? '#166534' : '#991B1B' }}>{total.toFixed(2)}%</span>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 30, padding: 18, fontSize: 16, fontWeight: 700, borderRadius: 16 }}
            onClick={save}
            disabled={saving || !isValid}
          >
            {saving ? '⏳ Saving...' : '💾 Save Weighting Configuration'}
          </button>

          {!isValid && (
            <p style={{ color: '#EF4444', fontSize: 12, textAlign: 'center', marginTop: 12, fontWeight: 700 }}>
              ⚠️ The sum of weights must be exactly 100%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WeightInput({ label, val, set, color }) {
  return (
    <div style={{ padding: '15px 20px', border: '1.5px solid #E2E8F0', borderRadius: 16, background: '#fff' }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: SLATE, marginBottom: 10 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <input 
          type="range" 
          min="0" max="100" step="1"
          value={val}
          onChange={e => set(e.target.value)}
          style={{ flex: 1, accentColor: color }}
        />
        <div style={{ position: 'relative', width: 80 }}>
          <input 
            type="number" 
            value={val}
            onChange={e => set(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontWeight: 800, textAlign: 'right' }}
          />
          <span style={{ position: 'absolute', right: 10, top: 12, fontSize: 14, color: SLATE, pointerEvents: 'none' }}>%</span>
        </div>
      </div>
    </div>
  );
}
