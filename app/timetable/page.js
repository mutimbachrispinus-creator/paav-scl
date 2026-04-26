'use client';
/**
 * app/timetable/page.js — School Timetable + Calendar Events
 * Admin can manage events visible to all users (including parents).
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const EVENT_TYPES = ['Academic','Sports','Holiday','Meeting','Examination','Cultural','Trip','Other'];
const M = '#8B1A1A', MB = '#F5E6E6';

export default function TimetablePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editEv, setEditEv] = useState(null);
  const [tab, setTab] = useState('calendar');
  const [form, setForm] = useState({ title:'', date:'', desc:'', type:'Academic' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ar, dr] = await Promise.all([
        fetch('/api/auth'),
        fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ requests:[
            { type:'get', key:'paav_calendar_events' },
            { type:'get', key:'paav_timetable' },
          ]})
        })
      ]);
      const auth = await ar.json();
      if (!auth.ok) { router.push('/'); return; }
      setUser(auth.user);
      const db = await dr.json();
      setEvents(db.results[0]?.value || []);
      setTimetable(db.results[1]?.value || {});
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function saveEvent() {
    if (!form.title || !form.date) { alert('Title and date are required'); return; }
    setBusy(true);
    const updated = editEv!=null
      ? events.map((e,i)=>i===editEv?{...form}:e)
      : [...events, { ...form, id: 'ev'+Date.now() }];
    await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requests:[{ type:'set', key:'paav_calendar_events', value: updated }] })
    });
    setEvents(updated);
    setShowModal(false); setEditEv(null); setForm({ title:'', date:'', desc:'', type:'Academic' });
    setBusy(false);
  }

  async function deleteEvent(i) {
    if (!confirm('Delete this event?')) return;
    const updated = events.filter((_,idx)=>idx!==i);
    await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requests:[{ type:'set', key:'paav_calendar_events', value: updated }] })
    });
    setEvents(updated);
  }

  if (loading) return <div className="page on" style={{padding:60,textAlign:'center',color:'var(--muted)'}}>Loading…</div>;

  const isAdmin = user?.role === 'admin';
  const sorted = [...events].sort((a,b)=>a.date.localeCompare(b.date));
  const upcoming = sorted.filter(e=>e.date>=new Date().toISOString().split('T')[0]);
  const past = sorted.filter(e=>e.date<new Date().toISOString().split('T')[0]).reverse();

  const TYPE_COLORS = {
    Academic:'#2563EB', Sports:'#059669', Holiday:'#D97706', Meeting:'#7C3AED',
    Examination:'#8B1A1A', Cultural:'#0D9488', Trip:'#92400E', Other:'#64748B'
  };

  return (
    <>
      <div className="page on">
        <div className="page-hdr">
          <div>
            <h2>📅 School Calendar</h2>
            <p style={{color:'var(--muted)'}}>Upcoming events, timetable & school schedule</p>
          </div>
          <div className="page-hdr-acts">
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={()=>{ setEditEv(null); setForm({ title:'', date:'', desc:'', type:'Academic' }); setShowModal(true); }}>
                ➕ Add Event
              </button>
            )}
            <button className="btn btn-ghost btn-sm no-print" onClick={()=>window.print()}>🖨️ Print</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{marginBottom:16,background:MB,borderRadius:10,padding:4}}>
          {[{id:'calendar',label:'📅 Calendar'},{id:'past',label:'📋 Past Events'}].map(t=>(
            <button key={t.id} className={`tab-btn${tab===t.id?' on':''}`}
              style={tab===t.id?{background:`linear-gradient(135deg,${M},#6B1212)`,color:'#fff',boxShadow:'0 2px 10px rgba(139,26,26,.3)'}:{}}
              onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* UPCOMING EVENTS */}
        {tab==='calendar' && (
          <div>
            {upcoming.length===0 ? (
              <div className="panel">
                <div className="panel-body" style={{textAlign:'center',padding:50,color:'var(--muted)'}}>
                  <div style={{fontSize:42,marginBottom:10}}>📅</div>
                  <div style={{fontWeight:700,fontSize:15}}>No upcoming events</div>
                  {isAdmin&&<div style={{fontSize:12,marginTop:6}}>Click + Add Event to schedule school activities</div>}
                </div>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {upcoming.map((ev,i)=>{
                  const col = TYPE_COLORS[ev.type]||'#64748B';
                  const [yr,mo,dy] = ev.date.split('-');
                  const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  return (
                    <div key={i} className="panel" style={{borderLeft:`5px solid ${col}`,marginBottom:0}}>
                      <div className="panel-body" style={{display:'flex',alignItems:'flex-start',gap:16,padding:'14px 16px'}}>
                        <div style={{minWidth:56,textAlign:'center',background:`${col}15`,borderRadius:10,padding:'8px 4px'}}>
                          <div style={{fontSize:10,fontWeight:800,color:col,textTransform:'uppercase'}}>{monthNames[+mo]}</div>
                          <div style={{fontSize:22,fontWeight:900,color:col,lineHeight:1}}>{dy}</div>
                          <div style={{fontSize:9,color:'var(--muted)'}}>{yr}</div>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:800,fontSize:14,marginBottom:3}}>{ev.title}</div>
                          {ev.desc&&<div style={{fontSize:12,color:'var(--muted)',marginBottom:5}}>{ev.desc}</div>}
                          <span style={{padding:'2px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:`${col}20`,color:col}}>{ev.type||'Event'}</span>
                        </div>
                        {isAdmin && (
                          <div style={{display:'flex',gap:6,flexShrink:0}}>
                            <button className="btn btn-ghost btn-sm" onClick={()=>{ setEditEv(i); setForm({...ev}); setShowModal(true); }}>✏</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>deleteEvent(i)}>🗑️</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PAST EVENTS */}
        {tab==='past' && (
          <div className="panel" style={{border:`1.5px solid ${MB}`}}>
            <div className="panel-hdr" style={{background:`linear-gradient(135deg,${M},#6B1212)`,color:'#fff'}}>
              <h3 style={{color:'#fff'}}>📋 Past Events</h3>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Date</th><th>Event</th><th>Type</th><th>Description</th>{isAdmin&&<th>Actions</th>}</tr></thead>
                <tbody>
                  {past.map((ev,i)=>{
                    const col=TYPE_COLORS[ev.type]||'#64748B';
                    return (
                      <tr key={i}>
                        <td style={{fontFamily:'monospace',fontSize:12}}>{ev.date}</td>
                        <td style={{fontWeight:700}}>{ev.title}</td>
                        <td><span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:`${col}20`,color:col}}>{ev.type}</span></td>
                        <td style={{fontSize:12,color:'var(--muted)'}}>{ev.desc||'—'}</td>
                        {isAdmin&&<td>
                          <button className="btn btn-ghost btn-sm" onClick={()=>{ setEditEv(events.indexOf(ev)); setForm({...ev}); setShowModal(true); }}>✏</button>
                          <button className="btn btn-danger btn-sm" style={{marginLeft:4}} onClick={()=>deleteEvent(events.indexOf(ev))}>🗑️</button>
                        </td>}
                      </tr>
                    );
                  })}
                  {past.length===0&&<tr><td colSpan="5" style={{textAlign:'center',padding:30,color:'var(--muted)'}}>No past events</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="modal-overlay open" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-hdr">
              <h3>{editEv!=null?'✏ Edit Event':'➕ Add School Event'}</h3>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field"><label>Event Title *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Term 1 Opening Day" /></div>
              <div className="field-row">
                <div className="field"><label>Date *</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
                <div className="field"><label>Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select></div>
              </div>
              <div className="field"><label>Description (optional)</label>
                <input value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Brief description…" /></div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEvent} disabled={busy} style={{width:'auto',opacity:busy?.7:1}}>
                  {busy?'⏳ Saving…':'💾 Save Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
