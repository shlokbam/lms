import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../../api/client'

const COLORS = ['#3B5BDB','#F04438','#0BA5EC','#7C3AED','#F79009','#12B76A','#6D28D9','#0891B2','#D97706','#059669','#BE123C','#1D4ED8']

function fmtDate(s) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}

export default function TrainerModules() {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // module for schedule modal
  const [typeFilter, setTypeFilter] = useState('all')
  const [schedForm, setSchedForm] = useState({ start_datetime:'', end_datetime:'', status:'published', color:'#3B5BDB', training_type:'self_paced', meet_link:'' })
  const [saving, setSaving] = useState(false)
  const now = new Date()

  useEffect(() => {
    load()
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'All Modules')
  }, [])

  function load() { client.get('/api/trainer/modules').then(r=>setData(r.data)).catch(()=>{}) }

  function openSched(m) {
    setModal(m)
    setSchedForm({
      start_datetime: m.start_datetime ? m.start_datetime.replace(' ','T').slice(0,16) : '',
      end_datetime:   m.end_datetime   ? m.end_datetime.replace(' ','T').slice(0,16)   : '',
      status: m.status, color: m.color || '#3B5BDB',
      training_type: m.training_type || 'self_paced', meet_link: m.meet_link || ''
    })
  }

  async function saveSchedule() {
    setSaving(true)
    try {
      await client.post(`/api/trainer/module/${modal.id}/schedule`, schedForm)
      setModal(null); load()
    } catch {} finally { setSaving(false) }
  }

  async function deleteModule(id) {
    if (!confirm('Delete this module and all its contents?')) return
    await client.delete(`/api/trainer/module/${id}`); load()
  }

  function getPhase(m) {
    if (!m.start_datetime) return 'draft'
    const s = new Date(m.start_datetime), e = m.end_datetime ? new Date(m.end_datetime) : null
    if (now < s) return 'upcoming'
    if (!e || now <= e) return 'live'
    return 'ended'
  }

  function phaseBadge(m) {
    const p = getPhase(m)
    if (p === 'live') return <span className="badge b-live">🟢 Live</span>
    if (p === 'upcoming') return <span className="badge b-sky">Upcoming</span>
    if (p === 'ended') return <span className="badge b-neutral">Ended</span>
    return <span className="badge b-neutral">Draft</span>
  }

  const modules = data?.modules || []
  const filtered = modules.filter(m => {
    const p = getPhase(m)
    if (filter !== 'all' && p !== filter) return false
    if (typeFilter !== 'all' && m.training_type !== typeFilter) return false
    return !search || m.title.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <div className="sh anim-up" style={{ marginBottom: 16 }}>
        <div><div className="sh-title">Training Modules</div><div className="sh-sub">{modules.length} modules total</div></div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <input className="form-input" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:180, height:36, padding:'0 10px', fontSize:13 }} />
          {['all','live','upcoming','ended'].map(f => (
            <button key={f} className={`btn btn-sm ${filter===f ? 'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
          <div style={{ width:1, height:24, background:'var(--border)', margin:'0 4px' }} />
          {[{v:'all',l:'All Types'},{v:'self_paced',l:'Self-paced'},{v:'virtual',l:'Virtual'},{v:'classroom',l:'Classroom'}].map(f => (
            <button key={f.v} className={`btn btn-sm ${typeFilter===f.v ? 'btn-primary':'btn-secondary'}`} onClick={()=>setTypeFilter(f.v)}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mod-grid">
        {filtered.map(m => {
          const stats = data.mod_stats?.[m.id] || {}
          return (
            <div key={m.id} className="mod-card anim-up">
              <div className="mc-banner" style={{ background: m.color || 'var(--acc)' }}></div>
              <div className="mc-body">
                <div className="mc-cat">{m.category}</div>
                <div className="mc-title">{m.title}</div>
                <div className="mc-desc">{m.description}</div>
                <div style={{ marginTop:10, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                  {phaseBadge(m)}
                  <span className={`badge ${m.training_type==='virtual'?'b-violet':m.training_type==='classroom'?'b-amber':'b-blue'}`}>
                    {m.training_type === 'virtual' ? 'Virtual' : m.training_type === 'classroom' ? 'Classroom' : 'Self-paced'}
                  </span>
                  <span style={{ fontSize:11, color:'var(--t3)' }}>
                    📅 {fmtDate(m.start_datetime)} — {fmtDate(m.end_datetime)}
                  </span>
                </div>
                <div style={{ marginTop:8, display:'flex', gap:10, fontSize:12, color:'var(--t3)' }}>
                  <span>📚 {stats.chapters||0} chapters</span>
                  <span>📎 {stats.materials||0} files</span>
                  <span>👥 {stats.trainees||0} trainees</span>
                </div>
              </div>
              <div className="mc-foot" style={{ gap:6 }}>
                <button className="btn btn-sm btn-gold" onClick={()=>openSched(m)}>Schedule</button>
                <Link to={`/trainer/module/${m.id}/reports`} className="btn btn-sm btn-secondary">Reports</Link>
                <Link to={`/trainer/module/${m.id}`} className="btn btn-sm btn-primary">View →</Link>
                <button className="btn btn-sm btn-danger" onClick={()=>deleteModule(m.id)}>✕</button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="card card-p" style={{ gridColumn:'1/-1' }}>
            <div className="empty"><div className="empty-ico">📭</div><div className="empty-title">No modules found</div></div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {modal && (
        <div className="modal-bg open" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            <div className="modal-title">Schedule Module</div>
            <div className="modal-sub">{modal.title}</div>
            <div className="g2">
              <div className="form-group">
                <label className="form-label">Start Date & Time</label>
                <input className="form-input" type="datetime-local" value={schedForm.start_datetime}
                  onChange={e=>setSchedForm(f=>({...f,start_datetime:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time</label>
                <input className="form-input" type="datetime-local" value={schedForm.end_datetime}
                  onChange={e=>setSchedForm(f=>({...f,end_datetime:e.target.value}))} />
              </div>
            </div>
            <div className="g2">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={schedForm.status} onChange={e=>setSchedForm(f=>({...f,status:e.target.value}))}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Training Type</label>
                <select className="form-select" value={schedForm.training_type} onChange={e=>setSchedForm(f=>({...f,training_type:e.target.value}))}>
                  <option value="self_paced">Self-paced</option>
                  <option value="virtual">Virtual</option>
                  <option value="classroom">Classroom</option>
                </select>
              </div>
            </div>
            {schedForm.training_type !== 'self_paced' && (
              <div className="form-group">
                <label className="form-label">Meeting Link / Location</label>
                <input className="form-input" placeholder="https://meet.google.com/..." value={schedForm.meet_link || ''}
                  onChange={e=>setSchedForm(f=>({...f,meet_link:e.target.value}))} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Card Colour</label>
              <div className="color-grid">
                {COLORS.map(c => (
                  <div key={c} className={`color-dot${schedForm.color===c?' selected':''}`}
                    style={{ background:c }} onClick={()=>setSchedForm(f=>({...f,color:c}))} />
                ))}
              </div>
            </div>
            <button className="btn btn-gold btn-md w-full" style={{ justifyContent:'center' }} onClick={saveSchedule} disabled={saving}>
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
