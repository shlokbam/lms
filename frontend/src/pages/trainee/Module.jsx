import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../../api/client'
import { fileUrl } from '../../api/fileUrl'

const TYPE_ICO = { video:'🎬', pdf:'📄', ppt:'📊', image:'🖼️' }
const PHASE_ORDER = { pre:1, live:2, post:3, upcoming:0 }

function canAccess(matPhase, modulePhase) {
  return PHASE_ORDER[matPhase] <= PHASE_ORDER[modulePhase]
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) + ' ' +
    new Date(s).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
}

export default function TraineeModule() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [openChapters, setOpenChapters] = useState({})
  const [videoModal, setVideoModal] = useState(null)

  useEffect(() => { load() }, [moduleId])

  function load() {
    client.get(`/api/trainee/module/${moduleId}`).then(r => {
      setData(r.data)
      document.getElementById('page-title') && (document.getElementById('page-title').textContent = r.data.module?.title || 'Module')
    }).catch(() => {})
  }

  function toggleChapter(id) { setOpenChapters(o => ({ ...o, [id]: !o[id] })) }

  async function markDone(matId, done) {
    await client.post('/api/progress/update', { module_id: parseInt(moduleId), material_id: matId, completed: done ? 1 : 0, watch_percent: 0 })
    load()
  }

  async function startTest(testId) {
    navigate(`/trainee/test/${testId}`)
  }

  if (!data) return <div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>Loading…</div>

  const { module, phase, chapters, mat_by_chapter, tests, progress_map, attempts_map, overall_pct, total_mats, done_mats } = data

  function phaseBadge() {
    if (phase === 'live') return <span className="badge b-live">🟢 Live</span>
    if (phase === 'pre') return <span className="badge b-sky">📅 Upcoming</span>
    return <span className="badge b-neutral">Ended</span>
  }

  return (
    <>
      <div style={{ marginBottom:18 }}><Link to="/trainee/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link></div>

      {/* Module Header */}
      <div className="card card-p anim-up mb-6" style={{ background:`linear-gradient(135deg,${module.color||'var(--acc)'}22,var(--card))` }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:module.color||'var(--acc)', marginBottom:6 }}>{module.category}</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, marginBottom:6 }}>{module.title}</h2>
            <p className="t-sm t-secondary" style={{ marginBottom:10 }}>{module.description}</p>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
              <span className={`badge ${module.training_type==='virtual'?'b-violet':module.training_type==='classroom'?'b-amber':'b-blue'}`}>
                {module.training_type === 'virtual' ? 'Virtual' : module.training_type === 'classroom' ? 'Classroom' : 'Self-paced'}
              </span>
              {module.meet_link && canAccess('live', phase) && (
                <a href={module.meet_link.startsWith('http') ? module.meet_link : `https://${module.meet_link}`} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-ghost" style={{ fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:14 }}>🔗</span> {module.training_type === 'classroom' ? 'Location details' : 'Join Meeting'}
                </a>
              )}
            </div>
            <div className="t-xs t-muted">
              {fmtDate(module.start_datetime)} — {fmtDate(module.end_datetime)}
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            {phaseBadge()}
            <div style={{ marginTop:10 }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:overall_pct===100?'var(--green)':'var(--acc)' }}>{overall_pct}%</div>
              <div className="t-xs t-muted">{done_mats}/{total_mats} completed</div>
              <div className="prog-track" style={{ width:120, marginTop:6, display:'inline-block' }}>
                <div className="prog-bar" style={{ width:`${overall_pct}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:22, alignItems:'start' }}>
        {/* Content */}
        <div>
          <div className="sh mb-4"><div className="sh-title">Course Content</div><div className="sh-sub">{chapters.length} chapters</div></div>
          <div className="chapter-list">
            {chapters.map((ch, idx) => {
              const open = openChapters[ch.id]
              const mats = mat_by_chapter[ch.id] || []
              const doneCh = mats.filter(m => progress_map[m.id]?.completed).length
              return (
                <div key={ch.id} className={`chapter-item${open?' active':''}`}>
                  <div className="ch-header" onClick={()=>toggleChapter(ch.id)}>
                    <div className={`ch-num${doneCh===mats.length&&mats.length>0?' done':open?' active':''}`}>{doneCh===mats.length&&mats.length>0?'✓':idx+1}</div>
                    <div className="ch-title">{ch.title}</div>
                    <span className="t-xs t-muted">{doneCh}/{mats.length}</span>
                    <span className={`ch-chevron${open?' open':''}`}>▾</span>
                  </div>
                  {open && (
                    <div className="ch-body open">
                      {mats.length === 0
                        ? <div style={{ padding:'14px 20px', color:'var(--t3)', fontSize:13 }}>No materials yet.</div>
                        : mats.map(mat => {
                          const accessible = canAccess(mat.release_phase, phase)
                          const prog = progress_map[mat.id]
                          const done = prog?.completed
                          return (
                            <div key={mat.id} className="mat-row" style={{ opacity:accessible?1:0.5 }}>
                              <div className="mat-ico" style={{ background:accessible?'var(--acc-bg)':'var(--card2)' }}>{accessible?TYPE_ICO[mat.file_type]:'🔒'}</div>
                              <div className="mat-info">
                                <div className="mat-title">{mat.title}</div>
                                <div className="mat-sub">
                                  {accessible
                                    ? <span className="badge b-blue" style={{ fontSize:9 }}>{mat.release_phase}</span>
                                    : <span style={{ fontSize:11, color:'var(--t4)' }}>🔒 Opens when session starts</span>
                                  }
                                </div>
                              </div>
                              {accessible && (
                                <div className="mat-actions">
                                  {mat.file_type === 'video'
                                    ? <button className="btn btn-xs btn-primary" onClick={()=>setVideoModal(mat)}>▶ Play</button>
                                    : <a href={fileUrl(mat.file_path)} target="_blank" rel="noopener" className="btn btn-xs btn-primary">↗ Open</a>
                                  }
                                  <button className={`btn btn-xs ${done?'btn-secondary':'btn-ghost'}`} onClick={()=>markDone(mat.id, !done)}>
                                    {done?'✓ Done':'Mark Done'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tests sidebar */}
        <div>
          <div className="sh mb-3"><div className="sh-title">Assessments</div></div>
          {tests.length === 0 ? (
            <div className="card card-p" style={{ textAlign:'center', color:'var(--t3)', fontSize:13, padding:24 }}>No tests for this module yet</div>
          ) : (
            tests.map(t => {
              const att = attempts_map[t.id]
              const now = new Date()
              const testPhaseMap = { pre:'pre', mid:'live', post:'post' }
              const matchPhase = testPhaseMap[t.test_type] === phase
              const inWindow = (!t.start_datetime || now >= new Date(t.start_datetime)) && (!t.end_datetime || now <= new Date(t.end_datetime))
              const canTake = matchPhase && inWindow && !att
              return (
                <div key={t.id} className="card card-p mb-3">
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{t.title}</div>
                  <span className={`badge ${t.test_type==='pre'?'b-sky':t.test_type==='mid'?'b-amber':'b-violet'}`} style={{ fontSize:9 }}>{t.test_type}-test</span>
                  <div style={{ fontSize:12, color:'var(--t3)', margin:'8px 0 4px' }}>{t.duration_minutes}min · Pass: {t.passing_marks}%</div>
                  {att ? (
                    <div>
                      <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:att.passed?'var(--green)':'var(--red)' }}>{Math.round(att.percentage)}%</div>
                      <span className={`badge ${att.passed?'b-green':'b-red'}`}>{att.passed?'✅ PASSED':'❌ FAILED'}</span>
                    </div>
                  ) : canTake ? (
                    <button className="btn btn-gold btn-sm" style={{ marginTop:8 }} onClick={()=>startTest(t.id)}>Take Test →</button>
                  ) : (
                    <div className="t-xs t-muted" style={{ marginTop:6 }}>
                      {!matchPhase ? `Available during ${testPhaseMap[t.test_type]} phase` : 'Test window closed'}
                      {(t.start_datetime || t.end_datetime) && (
                        <div style={{ marginTop:4, opacity:0.8 }}>
                          {fmtDate(t.start_datetime)} → {fmtDate(t.end_datetime)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Video Modal */}
      {videoModal && (
        <div className="modal-bg open" onClick={()=>setVideoModal(null)}>
          <div className="modal" style={{ maxWidth:720, padding:0, overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
            <div className="video-wrap">
              <video controls autoPlay src={fileUrl(videoModal.file_path)}
                style={{ width:'100%', maxHeight:480 }}
                onTimeUpdate={e => {
                  const pct = Math.round((e.target.currentTime / e.target.duration) * 100)
                  if (pct > 90) markDone(videoModal.id, true)
                }}>
              </video>
            </div>
            <div style={{ padding:'12px 16px', fontWeight:600, fontSize:14 }}>{videoModal.title}</div>
          </div>
        </div>
      )}
    </>
  )
}
