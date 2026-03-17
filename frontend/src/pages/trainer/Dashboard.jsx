import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import client from '../../api/client'

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) + ' ' +
    new Date(s).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
}

function phaseBadge(m, now) {
  if (!m.start_datetime) return <span className="badge b-neutral">Draft</span>
  const start = new Date(m.start_datetime), end = m.end_datetime ? new Date(m.end_datetime) : null
  if (now < start) return <span className="badge b-sky">Upcoming</span>
  if (!end || now <= end) return <span className="badge b-live"> Live</span>
  return <span className="badge b-neutral">Ended</span>
}

export default function TrainerDashboard() {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const now = new Date()

  useEffect(() => {
    client.get('/api/trainer/dashboard').then(r => setData(r.data)).catch(() => {})
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Dashboard')
  }, [])

  if (!data) return <div className="anim-fade" style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading…</div>

  const modules = data.modules || []
  const filtered = modules.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'live') {
      if (!m.start_datetime) return false
      const s = new Date(m.start_datetime), e = m.end_datetime ? new Date(m.end_datetime) : null
      return s <= now && (!e || now <= e)
    }
    if (filter === 'upcoming') return m.start_datetime && new Date(m.start_datetime) > now
    if (filter === 'ended') return m.end_datetime && new Date(m.end_datetime) < now
    return true
  }).filter(m => typeFilter === 'all' || m.training_type === typeFilter)

  return (
    <>
      <div className="stat-row anim-up">
        {[
          { lbl: 'Total Modules', val: data.total_modules, cls: 'st-gold', ico: '', icls: 'st-i-gold' },
          { lbl: 'Trainees', val: data.total_trainees, cls: 'st-blue', ico: '', icls: 'st-i-blue' },
          { lbl: 'Live Sessions', val: data.ongoing, cls: 'st-green', ico: '', icls: 'st-i-green' },
          { lbl: 'Upcoming', val: data.upcoming, cls: 'st-sky', ico: '', icls: 'st-i-sky' },
        ].map(({ lbl, val, cls, ico, icls }) => (
          <div key={lbl} className={`stat-tile ${cls}`}>
            <div className={`st-icon ${icls}`}>{ico}</div>
            <div className="st-num">{val}</div>
            <div className="st-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      <div className="sh anim-up d1" style={{ marginBottom: 16 }}>
        <div>
          <div className="sh-title">Training Modules</div>
          <div className="sh-sub">{modules.length} modules total</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" placeholder="Search modules…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: 180, height: 36, padding: '0 10px', fontSize: 13 }} />
          {['all','live','upcoming','ended'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
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

      <div className="mod-grid anim-up d2">
        {filtered.map(m => {
          const stats = data.mod_stats?.[m.id] || {}
          return (
            <div key={m.id} className="mod-card">
              <div className="mc-body">
                <div className="mc-cat">{m.category}</div>
                <div className="mc-title">{m.title}</div>
                <div className="mc-desc">{m.description}</div>
                <div style={{ marginTop:8 }}>
                  <span className={`badge ${m.training_type==='virtual'?'b-violet':m.training_type==='classroom'?'b-amber':'b-blue'}`}>
                    {m.training_type === 'virtual' ? 'Virtual' : m.training_type === 'classroom' ? 'Classroom' : 'Self-paced'}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'var(--t3)', marginTop:8 }}>
                   {fmtDate(m.start_datetime)} — {fmtDate(m.end_datetime)}
                </div>
              </div>
              <div className="mc-foot">
                <div className="mc-meta">
                  {phaseBadge(m, now)}
                  <span style={{ color: 'var(--t3)', fontSize: 12 }}> {stats.trainees || 0}</span>
                </div>
                <Link to={`/trainer/module/${m.id}`} className="btn btn-sm btn-primary">View →</Link>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="card card-p" style={{ gridColumn: '1/-1' }}>
            <div className="empty">
              <div className="empty-ico"></div>
              <div className="empty-title">No Modules Found</div>
              <div className="empty-sub">No modules match your current filter.</div>
            </div>
          </div>
        )}
      </div>

      {data.recent?.length > 0 && (
        <>
          <div className="sh anim-up" style={{ marginTop: 20, marginBottom: 12 }}>
            <div className="sh-title">Recent Enrollments</div>
          </div>
          <div className="card tbl-wrap anim-up d1">
            <table>
              <thead><tr><th>Trainee</th><th>Module</th><th>Enrolled At</th></tr></thead>
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={i}>
                    <td><div className="flex items-c gap-2"><div className="ava ava-sm">{r.name?.[0]}</div>{r.name}</div></td>
                    <td className="t-secondary t-sm">{r.title}</td>
                    <td className="t-muted t-xs">{fmtDate(r.enrolled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
