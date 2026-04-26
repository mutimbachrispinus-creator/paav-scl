'use client';
/**
 * app/fees/pay/page.js — Parent self-service M-Pesa payment
 *
 * Accessible to parents and the public (no auth required to view,
 * but STK Push requires valid admission number + phone).
 *
 * Flow:
 *  1. Parent enters admission number → learner balance is shown
 *  2. Parent enters phone + amount → STK Push is triggered
 *  3. Parent completes payment on phone → payment is logged
 */

import { useState } from 'react';
import { fmtK } from '@/lib/cbe';

export default function PayPage() {
  const [adm,     setAdm]     = useState('');
  const [learner, setLearner] = useState(null);
  const [feeCfg,  setFeeCfg]  = useState({});
  const [paybillAccounts, setPaybillAccounts] = useState([]);
  const [looking, setLooking] = useState(false);
  const [err,     setErr]     = useState('');

  const [phone,   setPhone]   = useState('');
  const [amount,  setAmount]  = useState('');
  const [term,    setTerm]    = useState('T1');
  const [paying,  setPaying]  = useState(false);
  const [payMsg,  setPayMsg]  = useState('');
  const [success, setSuccess] = useState(false);

  async function lookup(e) {
    e?.preventDefault();
    setErr(''); setLearner(null);
    if (!adm.trim()) { setErr('Enter an admission number'); return; }
    setLooking(true);

    const res = await fetch('/api/db', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ requests: [
        { type: 'get', key: 'paav6_learners' },
        { type: 'get', key: 'paav6_feecfg'  },
        { type: 'get', key: 'paav_paybill_accounts' },
      ]}),
    });
    const db = await res.json();
    setLooking(false);

    const all  = db.results[0]?.value || [];
    const cfg  = db.results[1]?.value || {};
    const pbas = db.results[2]?.value || [];
    const found = all.find(l => l.adm === adm.trim());

    if (!found) { setErr(`Learner with adm no. "${adm}" not found.`); return; }
    setLearner(found);
    setFeeCfg(cfg);
    setPaybillAccounts(pbas);

    // Pre-fill amount with outstanding balance
    const fee = cfg[found.grade]?.annual || 5000;
    const paid = (found.t1||0)+(found.t2||0)+(found.t3||0);
    setAmount(Math.max(0, fee - paid).toString());
  }

  async function stkPush(acc) {
    if (!phone.trim()) { setErr('Enter your M-Pesa phone number'); return; }
    if (!amount || Number(amount) <= 0) { setErr('Enter a valid amount'); return; }
    setPaying(true);
    setErr('');

    const res = await fetch('/api/mpesa/stk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        phone:      phone.trim(),
        amount:     Number(amount),
        accountRef: learner.adm,
        term:       term,
        description: `${learner.name} Fees`,
        shortcode:  acc.shortcode,
        passkey:    acc.passkey
      }),
    });
    const data = await res.json();
    setPaying(false);

    if (!data.success) {
      setErr(data.error || 'M-Pesa STK Push failed. Try again.');
      return;
    }

    setPayMsg(data.message || 'Check your phone for the M-Pesa payment prompt.');
    setSuccess(true);
  }

  const annualFee  = feeCfg[learner?.grade]?.annual || 5000;
  const totalPaid  = learner ? (learner.t1||0)+(learner.t2||0)+(learner.t3||0) : 0;
  const balance    = annualFee - totalPaid;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#050F1C,#0D1F3C)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
        padding: '32px 28px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🏫</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 16, fontWeight: 800,
            color: '#8B1A1A' }}>PAAV-GITOMBO COMMUNITY SCHOOL</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Secure Fee Payment Portal
          </div>
        </div>

        {err && (
          <div className="alert alert-err show" style={{ display: 'flex', marginBottom: 14 }}>
            {err}
          </div>
        )}

        {/* Step 1: Lookup */}
        {!learner && (
          <form onSubmit={lookup}>
            <div className="field">
              <label>Learner&apos;s Admission Number</label>
              <input value={adm} onChange={e => setAdm(e.target.value)}
                placeholder="e.g. 101" autoFocus />
            </div>
            <button type="submit" disabled={looking}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg,#8B1A1A,#6B1212)',
                opacity: looking ? 0.7 : 1 }}>
              {looking ? '🔍 Looking up…' : '🔍 Find Learner'}
            </button>
          </form>
        )}

        {/* Step 2: Pay */}
        {learner && !success && (
          <>
            {/* Learner summary */}
            <div style={{ background: '#F8FAFF', borderRadius: 12, padding: '14px 16px',
              marginBottom: 20, border: '2px solid var(--border)' }}>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14,
                color: 'var(--navy)', marginBottom: 2 }}>{learner.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {learner.grade} &nbsp;·&nbsp; Adm: {learner.adm}
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between',
                fontSize: 12.5 }}>
                <span style={{ color: 'var(--muted)' }}>Balance</span>
                <strong style={{ color: balance <= 0 ? 'var(--green)':'var(--red)', fontSize: 15 }}>
                  {balance <= 0 ? '✅ Cleared' : fmtK(balance)}
                </strong>
              </div>
            </div>

            {balance <= 0 ? (
              <div className="alert alert-ok show" style={{ display: 'flex' }}>
                ✅ This learner&apos;s fees are fully paid!
              </div>
            ) : (
              <form onSubmit={e => e.preventDefault()}>
                <div className="field">
                  <label>Term</label>
                  <select value={term} onChange={e => setTerm(e.target.value)}>
                    {['T1','T2','T3'].map(t => (
                      <option key={t} value={t}>Term {t.replace('T','')}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Amount (KSH)</label>
                  <input type="number" value={amount}
                    onChange={e => setAmount(e.target.value)} min="1" />
                </div>
                <div className="field">
                  <label>M-Pesa Phone Number</label>
                  <input type="tel" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Select Payment Account</div>
                  {paybillAccounts.map(acc => (
                    <button key={acc.id} type="button" disabled={paying}
                      onClick={() => stkPush(acc)}
                      className="btn btn-success"
                      style={{ width: '100%', justifyContent: 'space-between', opacity: paying ? 0.7 : 1, padding: '12px 18px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{acc.name}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>Paybill: {acc.shortcode}</div>
                      </div>
                      <span>{paying ? '⏳ ...' : '💚 Pay'}</span>
                    </button>
                  ))}
                  {paybillAccounts.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: 10, border: '1px dashed var(--border)', borderRadius: 8 }}>
                      No payment accounts configured
                    </div>
                  )}
                </div>
              </form>
            )}

            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: '100%',
              justifyContent: 'center' }}
              onClick={() => { setLearner(null); setAdm(''); setErr(''); }}>
              ← Search another learner
            </button>
          </>
        )}

        {/* Step 3: Success */}
        {success && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📱</div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 800,
              color: 'var(--green)', marginBottom: 8 }}>Payment Initiated!</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              {payMsg}
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#ECFDF5', borderRadius: 10,
              fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
              ✅ Enter your M-Pesa PIN when prompted on your phone.
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}
              onClick={() => { setSuccess(false); setLearner(null); setAdm(''); }}>
              Make another payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
