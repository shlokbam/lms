import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../../api/client'

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}

function phaseBadge(phase) {
  if (phase === 'live') return <span className="badge b-live">🟢 Live</span>
  if (phase === 'pre') return <span className="badge b-sky">Upcoming</span>
  return <span className="badge b-neutral">Ended</span>
}

export default function TraineeDashboard() {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    client.get('/api/trainee/dashboard').then(r => setData(r.data)).catch(() => {})
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Dashboard')
  }, [])

  if (!data) return <div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>Loading…</div>
  const { upcoming, ongoing, completed, total_tests, passed_tests, notifications } = data

  const showLive = filter === 'all' || filter === 'live'
  const showUpcoming = filter === 'all' || filter === 'upcoming'
  const showEnded = filter === 'all' || filter === 'ended'

  return (
    <>
      <div className="stat-row anim-up">
        {[
          { lbl:'Live Sessions', val:ongoing.length, cls:'st-green', ico:'🟢', icls:'st-i-green', f:'live' },
          { lbl:'Upcoming', val:upcoming.length, cls:'st-blue', ico:'📅', icls:'st-i-blue', f:'upcoming' },
          { lbl:'Completed', val:completed.length, cls:'st-gold', ico:'✅', icls:'st-i-gold', f:'ended' },
          { lbl:'Tests Passed', val:`${passed_tests}/${total_tests}`, cls:'st-violet', ico:'📝', icls:'st-i-violet' },
        ].map(({ lbl,val,cls,ico,icls,f }) => (
          <div key={lbl} className={`stat-tile ${cls}`} onClick={() => f && setFilter(f)} style={{ cursor: f ? 'pointer' : 'default' }}>
            <div className={`st-icon ${icls}`}>{ico}</div>
            <div className="st-num">{val}</div>
            <div className="st-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:22, alignItems:'start' }}>
        <div>
          <div className="sh anim-up d1" style={{ marginBottom: 16 }}>
            <div>
              <div className="sh-title">Learning Journey</div>
              <div className="sh-sub">All your enrolled modules</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {['all','live','upcoming','ended'].map(f => (
                <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {showLive && ongoing.length > 0 && (
            <>
              <div className="sh anim-up mb-3"><div className="sh-title">🟢 Live Now</div></div>
              <div className="mod-grid" style={{ marginBottom:20 }}>
                {ongoing.map(m => (
                  <div key={m.id} className="mod-card anim-up">
                    <div className="mc-banner" style={{ background: m.color||'var(--acc)', height:4 }}></div>
                    <div className="mc-body">
                      <div className="mc-cat">{m.category}</div>
                      <div className="mc-title">{m.title}</div>
                      <div className="mc-desc">{m.description}</div>
                      <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>🟢 Ends {fmtDate(m.end_datetime)}</div>
                    </div>
                    <div className="mc-foot">
                      {phaseBadge(m.phase)}
                      <Link to={`/trainee/module/${m.id}`} className="btn btn-gold btn-sm">Continue →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showUpcoming && upcoming.length > 0 && (
            <>
              <div className="sh anim-up mb-3"><div className="sh-title">📅 Upcoming</div></div>
              <div className="mod-grid" style={{ marginBottom:20 }}>
                {upcoming.map(m => (
                  <div key={m.id} className="mod-card anim-up">
                    <div className="mc-banner" style={{ background: m.color||'var(--acc)' }}></div>
                    <div className="mc-body">
                      <div className="mc-cat">{m.category}</div>
                      <div className="mc-title">{m.title}</div>
                      <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>📅 Starts {fmtDate(m.start_datetime)}</div>
                    </div>
                    <div className="mc-foot">
                      {phaseBadge(m.phase)}
                      <Link to={`/trainee/module/${m.id}`} className="btn btn-sm btn-secondary">Preview</Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showEnded && completed.length > 0 && (
            <>
              <div className="sh anim-up mb-3"><div className="sh-title">Completed</div></div>
              <div className="mod-grid">
                {completed.map(m => (
                  <div key={m.id} className="mod-card anim-up" style={{ opacity:.7 }}>
                    <div className="mc-banner" style={{ background: m.color||'var(--acc)' }}></div>
                    <div className="mc-body">
                      <div className="mc-cat">{m.category}</div>
                      <div className="mc-title">{m.title}</div>
                    </div>
                    <div className="mc-foot">
                      <span className="badge b-neutral">Ended</span>
                      <Link to={`/trainee/module/${m.id}`} className="btn btn-sm btn-ghost">Review</Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {ongoing.length === 0 && upcoming.length === 0 && completed.length === 0 && (
            <div className="card card-p"><div className="empty"><div className="empty-ico">📚</div><div className="empty-title">No Modules Yet</div><div className="empty-sub">You'll see your enrolled modules here once your trainer publishes them.</div></div></div>
          )}
          {filter !== 'all' && (
            (filter === 'live' && ongoing.length === 0) ||
            (filter === 'upcoming' && upcoming.length === 0) ||
            (filter === 'ended' && completed.length === 0)
          ) && (
            <div className="card card-p"><div className="empty"><div className="empty-ico">📭</div><div className="empty-title">No {filter} modules</div><div className="empty-sub">You don't have any modules in this category.</div></div></div>
          )}
        </div>


        {/* Notifications sidebar */}
        <div>
          <div className="sh anim-r mb-3"><div className="sh-title">Notifications</div><Link to="/trainee/notifications" style={{ fontSize:13, color:'var(--acc)', fontWeight:600 }}>View all →</Link></div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {notifications.length === 0
              ? <div className="card card-p center" style={{ padding:24, color:'var(--t3)', fontSize:13 }}>🎉 All caught up!</div>
              : notifications.map(n => (
                <a key={n.id} href={n.link||'#'}>
                  <div className={`card card-p${n.is_read?'':' anim-r'}`} style={{ borderLeft:`3px solid ${n.is_read?'var(--border)':'var(--acc)'}`, padding:12 }}>
                    <div style={{ fontWeight:n.is_read?500:700, fontSize:13, marginBottom:3 }}>{n.title}</div>
                    <div className="t-xs t-muted">{n.body?.slice(0,60)}{n.body?.length>60?'…':''}</div>
                  </div>
                </a>
              ))
            }
          </div>
        </div>
      </div>
    </>
  )
}
