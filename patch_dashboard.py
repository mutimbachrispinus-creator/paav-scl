import re

with open('app/dashboard/page.js', 'r') as f:
    txt = f.read()

# 1. Restrict Fees Section in dashboard
# Fee collection bars
txt = txt.replace('        {/* Fee collection bars */}', '        {user?.role === "admin" && (\n        {/* Fee collection bars */}')
# close the condition after Fee collection bars panel
# we need to find the exact end of the Fee collection bars panel
fee_panel_end = txt.find('        </div>\n      </div>\n\n      {/* ── Recent payments ── */}')
if fee_panel_end != -1:
    txt = txt[:fee_panel_end + 15] + '        )}\n' + txt[fee_panel_end + 15:]

# Recent payments
txt = txt.replace('      {/* ── Recent payments ── */}', '      {user?.role === "admin" && (\n      {/* ── Recent payments ── */}')
# close the condition after Recent payments panel
# end of page is right after
page_end = txt.find('      {/* ── Profile Quick-View Panel ── */}')
if page_end != -1:
    # go back to the closing div of recent payments
    # it is: "      </div>\n\n      {/* ── Profile Quick-View Panel ── */}"
    txt = txt[:page_end - 1] + '      )}\n\n' + txt[page_end - 1:]

# 2. Update ProfilePanel to support extended fields
old_profile_panel = """/* ── Profile Quick-View Panel ────────────────────────────────────────────── */
function ProfilePanel({ user, picRef, onPhotoClick, onClose }) {
  const [form, setForm]     = useState({ phone: user?.phone || '', newPw: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');
  const [showPw, setShowPw] = useState(false);

  const F = (k,v) => setForm(f => ({...f,[k]:v}));

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'edit_user', id: user.id, phone: form.phone, password: form.newPw || undefined })
      });
      const d = await res.json();
      setMsg(d.ok ? '\u2705 Profile updated!' : '\u274c '+d.error);
    } catch(e) { setMsg('\u274c '+e.message); }
    setSaving(false);
    setTimeout(()=>setMsg(''),3000);
  }"""

new_profile_panel = """/* ── Profile Quick-View Panel ────────────────────────────────────────────── */
function ProfilePanel({ user, picRef, onPhotoClick, onClose }) {
  const [form, setForm]     = useState({ phone: user?.phone || '', newPw: '', address: '', id_num: '', gender: '', tribe: '', medical: '', blood: '', nok_name: '', nok_phone: '', nok_id: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadExtra() {
      try {
        const res = await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requests: [{type:'get', key:'paav_profiles'}] }) });
        const db = await res.json();
        const pExtra = db.results[0]?.value?.[user.id] || {};
        setForm(f => ({ ...f, phone: user?.phone || '', address: pExtra.address||'', id_num: pExtra.id_num||'', gender: pExtra.gender||'', tribe: pExtra.tribe||'', medical: pExtra.medical||'', blood: pExtra.blood||'', nok_name: pExtra.nok_name||'', nok_phone: pExtra.nok_phone||'', nok_id: pExtra.nok_id||'' }));
        setLoaded(true);
      } catch(e) {}
    }
    loadExtra();
  }, [user.id]);

  const F = (k,v) => setForm(f => ({...f,[k]:v}));

  async function saveProfile() {
    setSaving(true);
    try {
      // 1. Save auth level (phone/pw)
      const res = await fetch('/api/auth', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'edit_user', id: user.id, phone: form.phone, password: form.newPw || undefined })
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);

      // 2. Save extra profile details to paav_profiles
      const pRes = await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requests: [{type:'get', key:'paav_profiles'}] }) });
      const pdb = await pRes.json();
      const profiles = pdb.results[0]?.value || {};
      profiles[user.id] = { ...profiles[user.id], phone: form.phone, address: form.address, id_num: form.id_num, gender: form.gender, tribe: form.tribe, medical: form.medical, blood: form.blood, nok_name: form.nok_name, nok_phone: form.nok_phone, nok_id: form.nok_id };
      await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requests: [{type:'set', key:'paav_profiles', value: profiles}] }) });

      setMsg('\u2705 Profile updated!');
    } catch(e) { setMsg('\u274c '+e.message); }
    setSaving(false);
    setTimeout(()=>setMsg(''),3000);
  }"""

txt = txt.replace(old_profile_panel, new_profile_panel)

# Update form JSX
old_form_jsx = """            <div className="field">
              <label>Phone Number</label>
              <input value={form.phone} onChange={e=>F('phone',e.target.value)} type="tel" placeholder="07XXXXXXXX" />
            </div>
            <div className="field" style={{position:'relative'}}>
              <label>New Password <span style={{fontWeight:400,color:'var(--muted)'}}>leave blank to keep</span></label>
              <input value={form.newPw} onChange={e=>F('newPw',e.target.value)} type={showPw?'text':'password'} placeholder="Min 6 characters" style={{paddingRight:40}} />
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:10,top:28,background:'none',border:'none',cursor:'pointer',fontSize:16}}>
                {showPw?'\ud83d\ude48':'\ud83d\udc41\ufe0f'}
              </button>
            </div>"""

new_form_jsx = """            <div className="field">
              <label>Phone Number</label>
              <input value={form.phone} onChange={e=>F('phone',e.target.value)} type="tel" placeholder="07XXXXXXXX" />
            </div>
            <div className="field"><label>ID Number</label><input value={form.id_num} onChange={e=>F('id_num',e.target.value)} /></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div className="field"><label>Gender</label><select value={form.gender} onChange={e=>F('gender',e.target.value)}><option value=""></option><option>Male</option><option>Female</option></select></div>
              <div className="field"><label>Tribe</label><input value={form.tribe} onChange={e=>F('tribe',e.target.value)} /></div>
            </div>
            <div className="field"><label>Address</label><input value={form.address} onChange={e=>F('address',e.target.value)} /></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div className="field"><label>Blood Group</label><input value={form.blood} onChange={e=>F('blood',e.target.value)} /></div>
              <div className="field"><label>Medical</label><input value={form.medical} onChange={e=>F('medical',e.target.value)} placeholder="e.g. None" /></div>
            </div>
            <div style={{marginTop:16,marginBottom:8,fontSize:12,fontWeight:700,color:'var(--navy)'}}>Next of Kin</div>
            <div className="field"><label>Name</label><input value={form.nok_name} onChange={e=>F('nok_name',e.target.value)} /></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div className="field"><label>Phone</label><input value={form.nok_phone} onChange={e=>F('nok_phone',e.target.value)} /></div>
              <div className="field"><label>ID No.</label><input value={form.nok_id} onChange={e=>F('nok_id',e.target.value)} /></div>
            </div>
            <div style={{marginTop:16,marginBottom:8,fontSize:12,fontWeight:700,color:'var(--navy)'}}>Security</div>
            <div className="field" style={{position:'relative'}}>
              <label>New Password <span style={{fontWeight:400,color:'var(--muted)'}}>leave blank to keep</span></label>
              <input value={form.newPw} onChange={e=>F('newPw',e.target.value)} type={showPw?'text':'password'} placeholder="Min 6 characters" style={{paddingRight:40}} />
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:10,top:28,background:'none',border:'none',cursor:'pointer',fontSize:16}}>
                {showPw?'\ud83d\ude48':'\ud83d\udc41\ufe0f'}
              </button>
            </div>"""

txt = txt.replace(old_form_jsx, new_form_jsx)

with open('app/dashboard/page.js', 'w') as f:
    f.write(txt)
print("Updated dashboard/page.js")
