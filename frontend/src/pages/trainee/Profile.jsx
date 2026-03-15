import { useState, useEffect } from 'react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

export default function Profile() {
  const { user, updateName } = useAuth()
  const [data, setData] = useState(null)
  const [profileForm, setProfileForm] = useState({ name:'', email:'', phone:'', department:'' })
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm_password:'' })
  const [pwMatch, setPwMatch] = useState(null)
  const [profileMsg, setProfileMsg] = useState(null)
  const [pwMsg, setPwMsg] = useState(null)

  useEffect(() => {
    client.get('/api/trainee/profile').then(r => {
      setData(r.data)
      const u = r.data.user
      setProfileForm({ name:u.name||'', email:u.email||'', phone:u.phone||'', department:u.department||'' })
    })
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'My Profile')
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    try {
      const { data: d } = await client.put('/api/trainee/profile', profileForm)
      if (d.name) updateName(d.name)
      setProfileMsg({ type:'success', msg:'Profile updated successfully' })
    } catch (err) { setProfileMsg({ type:'error', msg: err.response?.data?.detail||'Update failed' }) }
  }

  async function changePw(e) {
    e.preventDefault()
    try {
      await client.put('/api/trainee/profile/password', pwForm)
      setPwMsg({ type:'success', msg:'Password changed successfully' })
      setPwForm({ current_password:'', new_password:'', confirm_password:'' })
    } catch (err) { setPwMsg({ type:'error', msg: err.response?.data?.detail||'Change failed' }) }
  }

  async function uploadPic(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      await client.post('/api/trainee/profile/upload-pic', fd)
      client.get('/api/trainee/profile').then(r=>setData(r.data))
    } catch {}
  }

  function checkPw(np, cp) {
    if (!cp) { setPwMatch(null); return }
    setPwMatch(np === cp ? 'match' : 'mismatch')
  }

  if (!data) return <div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>Loading…</div>
  const { user:u, attempts, total_enrolled, total_completed, avg_score } = data

  return (
    <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:22, alignItems:'start' }}>
      {/* Left column */}
      <div>
        <div className="card card-p anim-up center mb-4" style={{ padding:'28px 20px' }}>
          <div style={{ position:'relative', display:'inline-block', margin:'0 auto 16px', cursor:'pointer' }} onClick={()=>document.getElementById('pic-input').click()}>
            {u.profile_pic
              ? <img src={`/uploads/${u.profile_pic}`} alt="Profile" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--border)' }} />
              : <div className="ava ava-lg" style={{ margin:'0 auto' }}>{u.name?.[0]?.toUpperCase()}</div>
            }
            <div style={{ position:'absolute', bottom:0, right:0, background:'var(--acc)', borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', border:'2px solid var(--card)', fontWeight:700 }}>+</div>
          </div>
          <input id="pic-input" type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display:'none' }} onChange={uploadPic} />
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:19, marginBottom:3 }}>{u.name}</div>
          <div className="t-sm t-muted mb-3" style={{ textTransform:'capitalize' }}>{u.role}</div>
          <span className="badge b-gold">{u.department||'Eagle Security'}</span>
          <div className="t-xs t-muted" style={{ marginTop:8 }}>Click avatar to update photo</div>
        </div>

        <div className="stat-row anim-up d1" style={{ gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <div className="stat-tile st-blue" style={{ padding:14 }}>
            <div className="st-num" style={{ fontSize:26 }}>{total_enrolled}</div>
            <div className="st-lbl">Enrolled</div>
          </div>
          <div className="stat-tile st-green" style={{ padding:14 }}>
            <div className="st-num" style={{ fontSize:26 }}>{total_completed}</div>
            <div className="st-lbl">Completed</div>
          </div>
        </div>

        {avg_score > 0 && (
          <div className="card card-p anim-up d2 center" style={{ marginBottom:10, padding:16 }}>
            <div className="t-xs t-muted" style={{ textTransform:'uppercase', letterSpacing:'.6px', marginBottom:6, fontWeight:600 }}>Avg Test Score</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, color:avg_score>=60?'var(--green)':'var(--amber)' }}>{avg_score}%</div>
          </div>
        )}

        <div className="card card-p anim-up d3">
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', color:'var(--t3)', marginBottom:12 }}>Contact</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:13 }}>
            <div className="flex items-c gap-3"><span style={{ color:'var(--t3)', width:14, fontSize:11 }}>@</span><span>{u.email}</span></div>
            <div className="flex items-c gap-3"><span style={{ color:'var(--t3)', width:14, fontSize:11 }}>P</span><span>{u.phone||'—'}</span></div>
            <div className="flex items-c gap-3"><span style={{ color:'var(--t3)', width:14, fontSize:11 }}>D</span><span>{u.department||'—'}</span></div>
            <div className="flex items-c gap-3"><span style={{ color:'var(--t3)', width:14, fontSize:11 }}>J</span><span>{u.created_at?.slice(0,10)||'—'}</span></div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div>
        {/* Edit Profile */}
        <div className="card card-p anim-r mb-4">
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>Edit Profile</div>
          {profileMsg && <div className={`alert ${profileMsg.type==='success'?'alert-success':'alert-error'}`}>{profileMsg.msg}</div>}
          <form onSubmit={saveProfile}>
            <div className="g2">
              <div className="form-group col2">
                <label className="form-label">Full Name *</label>
                <input className="form-input" type="text" required value={profileForm.name} onChange={e=>setProfileForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div className="form-group col2">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" required value={profileForm.email} onChange={e=>setProfileForm(f=>({...f,email:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" placeholder="+91 XXXXX XXXXX" value={profileForm.phone} onChange={e=>setProfileForm(f=>({...f,phone:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" placeholder="e.g., Security Operations" value={profileForm.department} onChange={e=>setProfileForm(f=>({...f,department:e.target.value}))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-md">Save Changes</button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card card-p anim-r d1 mb-4">
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>Change Password</div>
          {pwMsg && <div className={`alert ${pwMsg.type==='success'?'alert-success':'alert-error'}`}>{pwMsg.msg}</div>}
          <form onSubmit={changePw}>
            <div className="g2">
              <div className="form-group col2">
                <label className="form-label">Current Password *</label>
                <input className="form-input" type="password" required value={pwForm.current_password} onChange={e=>setPwForm(f=>({...f,current_password:e.target.value}))} placeholder="Current password" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password *</label>
                <input className="form-input" type="password" required minLength={6} value={pwForm.new_password}
                  onChange={e=>{ setPwForm(f=>({...f,new_password:e.target.value})); checkPw(e.target.value,pwForm.confirm_password) }} placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <input className="form-input" type="password" required value={pwForm.confirm_password}
                  onChange={e=>{ setPwForm(f=>({...f,confirm_password:e.target.value})); checkPw(pwForm.new_password,e.target.value) }} placeholder="Repeat new password" />
              </div>
            </div>
            {pwMatch && <div style={{ fontSize:12, marginBottom:10, color:pwMatch==='match'?'var(--green)':'var(--red)' }}>{pwMatch==='match'?'Passwords match':'Passwords do not match'}</div>}
            <button type="submit" className="btn btn-gold btn-md" disabled={pwMatch==='mismatch'}>Update Password</button>
          </form>
        </div>

        {/* Test History */}
        <div className="sh anim-r d2 mb-4"><div className="sh-title">Test History</div></div>
        {attempts.length === 0 ? (
          <div className="card card-p"><div className="empty" style={{ padding:'32px 24px' }}>
            <div className="empty-ico" style={{ fontSize:24, marginBottom:8 }}>—</div>
            <div className="empty-title">No Tests Taken Yet</div>
            <div className="empty-sub">Your test history will appear here once you take your first assessment.</div>
          </div></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {attempts.map((att,i) => (
              <div key={i} className="card card-p" style={{ borderLeft:`3px solid ${att.passed?'var(--green)':'var(--red)'}` }}>
                <div className="flex justify-b items-s gap-3">
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{att.test_title}</div>
                    <div className="t-sm t-secondary mb-3">{att.module_title}</div>
                    <div className="flex gap-3 items-c flex-wrap">
                      <span className="t-xs t-muted">{att.started_at?.slice(0,16).replace('T',' ')}</span>
                      <span className={`badge ${att.test_type==='pre'?'b-sky':'b-violet'}`} style={{ fontSize:9 }}>{att.test_type}-test</span>
                    </div>
                  </div>
                  <div className="center" style={{ flexShrink:0 }}>
                    <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, color:att.passed?'var(--green)':'var(--red)' }}>{Math.round(att.percentage)}%</div>
                    <div className="t-xs t-muted">{att.score}/{att.total_marks}</div>
                    <span className={`badge ${att.passed?'b-green':'b-red'}`} style={{ marginTop:4 }}>{att.passed?'PASS':'FAIL'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
