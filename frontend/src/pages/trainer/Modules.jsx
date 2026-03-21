import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../../api/client'

const COLORS = ['#3B5BDB','#F04438','#0BA5EC','#7C3AED','#F79009','#12B76A','#6D28D9','#0891B2','#D97706','#059669','#BE123C','#1D4ED8']

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) + ' ' +
    new Date(s).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
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

  const [createModal, setCreateModal] = useState(false)
  const [traineeList, setTraineeList] = useState([])
  const [newMod, setNewMod] = useState({ title: '', description: '', category: 'General', trainee_ids: [] })
  const [traineeSearch, setTraineeSearch] = useState('')

  useEffect(() => {
    load()
    client.get('/api/trainer/trainees').then(r => setTraineeList(r.data)).catch(() => {})
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

  async function createModule() {
    if (!newMod.title.trim()) return
    setSaving(true)
    try {
      await client.post('/api/trainer/module/create', newMod)
      setCreateModal(false)
      setNewMod({ title: '', description: '', category: 'General', trainee_ids: [] })
      load()
    } catch {} finally { setSaving(false) }
  }

  function toggleTrainee(id) {
    setNewMod(prev => {
      const ids = prev.trainee_ids.includes(id) 
        ? prev.trainee_ids.filter(x => x !== id)
        : [...prev.trainee_ids, id]
      return { ...prev, trainee_ids: ids }
    })
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
    if (p === 'live') return <span className="badge b-live"> Live</span>
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

  if (!data) return <div className="anim-fade" style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading modules…</div>

  return (
    <>
      <div className="sh anim-up" style={{ marginBottom: 16 }}>
        <div><div className="sh-title">Training Modules</div><div className="sh-sub">{modules.length} modules total</div></div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <button className="btn btn-sm btn-secondary" style={{ borderColor:'var(--acc)', color:'var(--acc)' }} onClick={() => setCreateModal(true)}>+ New Module</button>
          <div style={{ width:1, height:24, background:'var(--border)', margin:'0 8px' }} />
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
          const stats = data?.mod_stats?.[m.id] || {}
          return (
            <div key={m.id} className="mod-card anim-up">
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
                     {fmtDate(m.start_datetime)} — {fmtDate(m.end_datetime)}
                  </span>
                </div>
                <div style={{ marginTop:8, display:'flex', gap:10, fontSize:12, color:'var(--t3)' }}>
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
            <div className="empty"><div className="empty-ico"></div><div className="empty-title">No modules found</div></div>
          </div>
        )}
      </div>

      {/* Create Module Modal */}
      {createModal && (
        <div className="modal-bg open" onClick={e=>e.target===e.currentTarget&&setCreateModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth: 550 }}>
            <button className="modal-close" onClick={()=>setCreateModal(false)}>✕</button>
            <div className="modal-title">Create New Module</div>
            
            <div className="g2">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={newMod.title} onChange={e=>setNewMod({...newMod, title: e.target.value})} placeholder="e.g. Technical Safety" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={newMod.category} onChange={e=>setNewMod({...newMod, category: e.target.value})} placeholder="e.g. Safety" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" value={newMod.description} onChange={e=>setNewMod({...newMod, description: e.target.value})} style={{ height: 80, resize: 'none' }} placeholder="Module outcomes..." />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Select Trainees ({newMod.trainee_ids.length})</label>
                <button className="btn btn-ghost btn-xs" style={{ padding: '0 4px', color: 'var(--acc)', fontWeight: 600 }} onClick={() => {
                  const allIds = traineeList.map(t => t.id)
                  setNewMod(p => ({ ...p, trainee_ids: p.trainee_ids.length === allIds.length ? [] : allIds }))
                }}>
                  {newMod.trainee_ids.length === traineeList.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <input 
                className="form-input mb-2" 
                placeholder="Search trainees..." 
                style={{ height: 32, fontSize:12 }}
                value={traineeSearch}
                onChange={e => setTraineeSearch(e.target.value)}
              />

              <div className="card" style={{ maxHeight: 180, overflow: 'auto', padding: 0, background: 'var(--card2)' }}>
                {traineeList.filter(t => t.name.toLowerCase().includes(traineeSearch.toLowerCase()) || t.department?.toLowerCase().includes(traineeSearch.toLowerCase())).length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>No trainees found</div>
                ) : traineeList.filter(t => t.name.toLowerCase().includes(traineeSearch.toLowerCase()) || t.department?.toLowerCase().includes(traineeSearch.toLowerCase())).map(t => (
                  <div 
                    key={t.id} 
                    className={`flex items-c gap-3 pointer transition-all`} 
                    style={{ 
                      padding: '8px 12px', 
                      borderBottom: '1px solid var(--border)',
                      background: newMod.trainee_ids.includes(t.id) ? 'var(--acc-bg)' : 'transparent'
                    }}
                    onClick={() => toggleTrainee(t.id)}
                  >
                    <div style={{ width:16, height:16, border:'2px solid var(--acc)', borderRadius:4, background: newMod.trainee_ids.includes(t.id) ? 'var(--acc)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11 }}>
                      {newMod.trainee_ids.includes(t.id) && '✓'}
                    </div>
                    <div className="ava ava-sm" style={{ width:28, height:28, background: 'var(--border)', fontSize: 11 }}>{t.name[0]}</div>
                    <div className="flex-1">
                      <div style={{ fontSize: 13, fontWeight: 700, color: newMod.trainee_ids.includes(t.id) ? 'var(--acc)' : 'var(--t1)' }}>{t.name}</div>
                      <div className="t-xs t-muted">{t.department || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-gold btn-md w-full" style={{ justifyContent:'center', marginTop: 12, height: 44 }} onClick={createModule} disabled={saving}>
              {saving ? 'Creating…' : 'Create Module & Enroll Trainees'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
