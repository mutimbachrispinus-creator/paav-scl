'use client';
/**
 * app/sms/page.js — Bulk SMS & event alerts
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { normaliseKenyanNumber, smsSegments } from '@/lib/sms-client';

const GROUPS = [
  { key: 'parents', label: 'All Parents' },
  { key: 'teachers', label: 'All Teachers' },
  { key: 'staff', label: 'All Staff' },
  { key: 'all', label: 'Everyone' },
  { key: 'custom', label: 'Custom Numbers' },
];

export default function SMSPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [learners, setLearners] = useState([]);
  const [smsLog, setSmsLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const [group, setGroup] = useState('parents');
  const [custom, setCustom] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    const authRes = await fetch('/api/auth');
    const auth = await authRes.json();
    if (!auth.ok || auth.user?.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(auth.user);

    const dbRes = await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          { type: 'get', key: 'paav6_staff' },
          { type: 'get', key: 'paav6_learners' },
          { type: 'get', key: 'paav7_sms' },
        ]
      }),
    });
    const db = await dbRes.json();
    setStaff(db.results[0]?.value || []);
    setLearners(db.results[1]?.value || []);
    setSmsLog(db.results[2]?.value || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  function getPhones() {
    if (group === 'custom') {
      return custom.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
    }
    const phones = [];
    if (group === 'parents' || group === 'all') {
      learners.forEach(l => { if (l.phone) phones.push(l.phone); });
      staff.filter(s => s.role === 'parent').forEach(s => { if (s.phone) phones.push(s.phone); });
    }
    if (group === 'teachers' || group === 'all') {
      staff.filter(s => s.role === 'teacher').forEach(s => { if (s.phone) phones.push(s.phone); });
    }
    if (group === 'staff' || group === 'all') {
      staff.forEach(s => { if (s.phone) phones.push(s.phone); });
    }
    // Deduplicate
    return [...new Set(phones)];
  }

  async function send() {
    const phones = getPhones();
    if (!phones.length) { setResult({ ok: false, error: 'No phone numbers in this group' }); return; }
    if (!message.trim()) { setResult({ ok: false, error: 'Enter a message' }); return; }
    setSending(true); setResult(null);

    const res = await fetch('/api/sms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bulk', phones, message }),
    });
    const data = await res.json();
    setSending(false);
    setResult(data);
    if (data.ok) { setMessage(''); load(); }
  }

  const phones = getPhones();
  const segments = smsSegments(message);

  if (loading || !user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div><h2>📱 Bulk SMS</h2><p>Send SMS alerts to parents, staff, or custom numbers</p></div>
      </div>

      <div className="sg sg2">
        <div className="panel">
          <div className="panel-hdr"><h3>📤 Send Message</h3></div>
          <div className="panel-body">
            {result && (
              <div className={`alert show alert-${result.ok ? 'ok' : 'err'}`}
                style={{ display: 'flex', marginBottom: 14 }}>
                {result.ok
                  ? `✅ Sent to ${result.totalSent} recipients. Failed: ${result.totalFailed}`
                  : `❌ ${result.error}`}
              </div>
            )}
            <div className="field">
              <label>Recipients Group</label>
              <select value={group} onChange={e => setGroup(e.target.value)}>
                {GROUPS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
              </select>
            </div>
            {group === 'custom' && (
              <div className="field">
                <label>Phone Numbers (one per line or comma-separated)</label>
                <textarea value={custom} onChange={e => setCustom(e.target.value)}
                  rows={4} placeholder="07XXXXXXXX&#10;07XXXXXXXX" />
              </div>
            )}
            <div className="field">
              <label>Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                rows={5} placeholder="Type your message…" />
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 11,
                color: 'var(--muted)', marginTop: 4
              }}>
                <span>{message.length} chars · {segments} SMS segment{segments > 1 ? 's' : ''}</span>
                <span>{phones.length} recipient{phones.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="note-box">
              <strong>Note:</strong> SMS is sent via Africa&apos;s Talking.
              Configure API credentials in <strong>Settings → SMS</strong>.
            </div>
            <button className="btn btn-primary" onClick={send} disabled={sending}
              style={{ marginTop: 14, opacity: sending ? 0.7 : 1 }}>
              {sending ? '⏳ Sending…' : `📱 Send to ${phones.length} Recipients`}
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr"><h3>📋 SMS Log</h3></div>
          <div className="panel-body" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {smsLog.slice(0, 30).map((s, i) => (
              <div key={i} className="audit-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700 }}>{s.to}</span>
                  <span className={`badge ${s.status === 'sent' ? 'bg-green' : 'bg-red'}`}
                    style={{ fontSize: 9 }}>{s.status}</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 3 }}>
                  {s.message?.slice(0, 80)}{s.message?.length > 80 ? '…' : ''}
                </div>
                <div style={{ fontSize: 10, color: 'var(--light)' }}>
                  {s.type} · {new Date(s.date).toLocaleString('en-KE')} · by {s.sentBy}
                </div>
              </div>
            ))}
            {smsLog.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
                No SMS sent yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
