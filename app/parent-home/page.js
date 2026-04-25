'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_SUBJECTS, gInfo, fmtK } from '@/lib/cbe';

export default function ParentHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [child, setChild] = useState(null);
  const [messages, setMessages] = useState([]);
  const [feeCfg, setFeeCfg] = useState({});
  const [marks, setMarks] = useState({});
  const [payInfo, setPayInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPayDrawer, setShowPayDrawer] = useState(false);

  const load = useCallback(async () => {
    try {
      const authRes = await fetch('/api/auth');
      const auth = await authRes.json();
      if (!auth.ok || !auth.user || auth.user.role !== 'parent') {
        router.push('/');
        return;
      }
      setUser(auth.user);

      const dbRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            { type: 'get', key: 'paav6_learners' },
            { type: 'get', key: 'paav6_msgs' },
            { type: 'get', key: 'paav6_feecfg' },
            { type: 'get', key: 'paav6_marks' },
            { type: 'get', key: 'paav_paybill' },
            { type: 'get', key: 'paav_payname' },
            { type: 'get', key: 'paav_acc_fmt' },
            { type: 'get', key: 'paav_pay_methods' }
          ]
        })
      });
      const db = await dbRes.json();
      
      const learners = db.results[0]?.value || [];
      const msgs = db.results[1]?.value || [];
      const fees = db.results[2]?.value || {};
      const mks = db.results[3]?.value || {};
      
      setChild(learners.find(l => l.adm === auth.user.childAdm));
      setMessages(msgs);
      setFeeCfg(fees);
      setMarks(mks);
      
      setPayInfo({
        paybill: db.results[4]?.value || '',
        payname: db.results[5]?.value || '',
        accFmt: db.results[6]?.value || 'Use Admission No.',
        methods: (db.results[7]?.value || 'M-Pesa,Bank Transfer,Cash').split(',').map(s => s.trim()).filter(Boolean)
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSkeleton />;

  if (!child) {
    return (
      <div className="page on" id="pg-parent-home">
        <div className="parent-banner" style={{ background: 'linear-gradient(135deg,var(--maroon),var(--maroon2))', padding: '24px', borderRadius: 'var(--r2)', color: '#fff', marginBottom: '22px' }}>
          <h2>Welcome, {user?.name}</h2>
          <p>No learner linked. Contact school admin to link your child's admission number to your account.</p>
        </div>
      </div>
    );
  }

  // Fees calculation
  const exp = feeCfg[child.grade]?.annual || 5000;
  const paid = (child.t1 || 0) + (child.t2 || 0) + (child.t3 || 0);
  const bal = exp - paid;

  // Unread messages
  const unr = messages.filter(m => m.from !== user.username && (m.to === user.username || m.to === 'ALL' || m.to === 'ALL_PARENTS') && !(m.read || []).includes(user.username)).length;

  const fc = feeCfg[child.grade] || { t1: Math.round(exp*0.5), t2: Math.round(exp*0.3), t3: Math.round(exp*0.2) };

  // Marks logic
  const subjs = (DEFAULT_SUBJECTS[child.grade] || []).slice(0, 6);
  
  const methodIcons = {'M-Pesa':'📱','M-PESA':'📱','Bank Transfer':'🏦','Cash':'💵','Cash (Office)':'💵','Cheque':'📝'};

  return (
    <div className="page on" id="pg-parent-home">
      <div className="parent-banner" style={{ background: 'linear-gradient(135deg,var(--maroon),var(--maroon2))', padding: '24px', borderRadius: 'var(--r2)', color: '#fff', marginBottom: '22px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Welcome, {user?.name}</h2>
        <p style={{ opacity: 0.9 }}>Monitoring: <strong style={{ color: 'var(--gold2)' }}>{child.name}</strong> — {child.grade} · Adm: {child.adm}</p>
      </div>

      <div className="sg sg3" style={{ marginBottom: '22px' }}>
        <StatCard icon="🎓" bg="#EFF6FF" n={child.grade} l={`${child.name.split(' ')[0]}'s Grade`} />
        <StatCard icon="💰" bg={bal <= 0 ? '#ECFDF5' : '#FEF3C7'} n={fmtK(bal)} l="Fee Balance"
          sub={bal <= 0 ? '✅ Cleared' : '⚠ Outstanding'} subBg={bal <= 0 ? '#ECFDF5' : '#FEE2E2'} subColor={bal <= 0 ? 'var(--green)' : 'var(--red)'} />
        <StatCard icon="💬" bg="#F5F3FF" n={unr} l="New Messages" />
      </div>

      {showPayDrawer && (
        <div id="ph-pay-drawer" style={{ marginBottom: '16px' }}>
          <div className="panel" style={{ border: '2.5px solid #059669' }}>
            <div className="panel-hdr" style={{ background: 'linear-gradient(135deg,#047857,#065F46)' }}>
              <h3 style={{ color: '#fff' }}>💳 Pay School Fees</h3>
              <button onClick={() => setShowPayDrawer(false)} className="btn btn-ghost" style={{ background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 13px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
            </div>
            <div className="panel-body">
              {payInfo.paybill ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '2px solid #A7F3D0', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>📱 M-Pesa Paybill / Till No.</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#065F46', letterSpacing: '2px' }}>{payInfo.paybill}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{payInfo.payname || 'School Fees'}</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '2px solid #BFDBFE', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>🔢 Account Number</div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#1D4ED8', letterSpacing: '2px' }}>{child.adm}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{payInfo.accFmt}</div>
                    </div>
                  </div>
                  <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '10px', padding: '12px', fontSize: '12.5px', color: '#92400E', marginBottom: '10px' }}>
                    <strong>📋 Steps:</strong> Go to M-Pesa → Lipa na M-Pesa → Paybill → Business No: <strong>{payInfo.paybill}</strong> → Account No: <strong>{child.adm}</strong> → Amount → PIN
                  </div>
                </>
              ) : (
                <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px', fontSize: '12.5px', color: '#92400E', marginBottom: '10px' }}>
                  ⚠️ Payment details not set. Contact school admin to configure the Paybill number.
                </div>
              )}
              {payInfo.methods?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Accepted Payment Methods</div>
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    {payInfo.methods.map(m => (
                      <span key={m} style={{ background: '#F0FDF4', color: '#065F46', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: '1.5px solid #A7F3D0' }}>
                        {methodIcons[m] || '💳'} {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '10px', padding: '10px', background: '#F8FAFF', borderRadius: '8px' }}>
                After payment, please contact the school office to confirm receipt. Keep your M-Pesa confirmation message as proof.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sg sg2">
        <div className="panel" id="ph-fees-panel">
          <div className="panel-hdr">
            <h3>💰 Fee Statement</h3>
            <button className="btn btn-success btn-sm" onClick={() => setShowPayDrawer(true)}>💳 Pay Fees</button>
          </div>
          <div className="panel-body">
            {[['Term 1', child.t1 || 0, fc.t1 || 0], ['Term 2', child.t2 || 0, fc.t2 || 0], ['Term 3', child.t3 || 0, fc.t3 || 0]].map(([l, p, d]) => (
              <div key={l} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{l}</span>
                  <span>{fmtK(p)} / {fmtK(d)}</span>
                </div>
                <div style={{ height: '8px', background: '#EEF2FF', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, d ? Math.round(p / d * 100) : 0)}%`, height: '100%', background: p >= d ? 'var(--green)' : 'var(--blue)' }} />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px', background: '#F8FAFF', borderRadius: '8px', marginTop: '6px' }}>
              <span>Annual: <strong>{fmtK(exp)}</strong></span>
              <span style={{ color: 'var(--green)' }}>Paid: <strong>{fmtK(paid)}</strong></span>
              <span style={{ color: bal > 0 ? 'var(--red)' : 'var(--green)' }}>Bal: <strong>{fmtK(bal)}</strong></span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr">
            <h3>📊 Child Performance</h3>
          </div>
          <div className="panel-body">
            {subjs.length > 0 ? subjs.map(s => {
              const k1 = `T1:${child.grade}|${s}|mt1`;
              const k0 = `${child.grade}|${s}|mt1`;
              const sc = marks[k1]?.[child.adm] ?? marks[k0]?.[child.adm];
              if (sc !== undefined) {
                const i = gInfo(+sc, child.grade);
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '12.5px' }}>
                    <div style={{ flex: 1, fontWeight: 500 }}>{s}</div>
                    <div style={{ fontWeight: 800, color: i.c }}>{sc}</div>
                    <span className={`badge`} style={{ background: i.bg, color: i.c, fontWeight: 800, minWidth: '35px', textAlign: 'center' }}>{i.lv}</span>
                    <div style={{ fontSize: '11px', color: i.c, fontWeight: 700 }}>{i.pts}pt{i.pts > 1 ? 's' : ''}</div>
                  </div>
                );
              }
              return null;
            }) : <div style={{ color: 'var(--muted)', fontSize: '12px' }}>No marks entered yet for this term</div>}
            
            {subjs.every(s => {
              const k1 = `T1:${child.grade}|${s}|mt1`;
              const k0 = `${child.grade}|${s}|mt1`;
              return marks[k1]?.[child.adm] === undefined && marks[k0]?.[child.adm] === undefined;
            }) && <div style={{ color: 'var(--muted)', fontSize: '12px' }}>No marks entered yet for this term</div>}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '22px' }}>
        <div className="panel-hdr">
          <h3>💬 School Messages</h3>
        </div>
        <div className="panel-body">
          {messages.filter(m => m.to === 'ALL' || m.to === 'ALL_PARENTS' || m.to === user.username || m.from === user.username).slice(-4).reverse().map((m, i) => (
            <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>{m.from === user.username ? 'To: ' + m.to : 'From: ' + m.from}</span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{new Date(m.time || Date.now()).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#334155' }}>{m.text}</div>
            </div>
          ))}
          {messages.filter(m => m.to === 'ALL' || m.to === 'ALL_PARENTS' || m.to === user.username || m.from === user.username).length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: '12px' }}>No recent messages</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, n, l, sub, subBg, subColor }) {
  return (
    <div className="stat-card">
      <div className="sc-inner">
        <div className="sc-icon" style={{ background: bg }}>{icon}</div>
        <div>
          <div className="sc-n">{n}</div>
          <div className="sc-l">{l}</div>
          {sub && (
            <div className="sc-sub" style={{ background: subBg, color: subColor }}>{sub}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="page on">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[1,2,3].map(i => (
          <div key={i} className="stat-card" style={{ height: 90, background: '#F1F5F9', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    </div>
  );
}
