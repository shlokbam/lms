import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../../api/client'
import { fileUrl } from '../../api/fileUrl'

const PHASE_LABELS = { pre: 'Pre-Session', live: 'Live', post: 'Post-Session', upcoming:'Draft' }
const TYPE_ICO = { video:'🎬', pdf:'📄', ppt:'📊', image:'🖼️' }

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) + ' ' +
    new Date(s).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
}

export default function TrainerModuleDetail() {
  const { moduleId } = useParams()
  const [data, setData] = useState(null)
  const [openChapters, setOpenChapters] = useState({})
  const [addChForm, setAddChForm] = useState('')
  const [addChModal, setAddChModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title:'', phase:'pre', chapter_id:'' })
  const [uploadModal, setUploadModal] = useState(false)
  const fileRef = useRef()

  useEffect(() => { load() }, [moduleId])

  function load() {
    client.get(`/api/trainer/module/${moduleId}`).then(r => {
      setData(r.data)
      document.getElementById('page-title') && (document.getElementById('page-title').textContent = r.data.module?.title || 'Module Detail')
    }).catch(() => {})
  }

  function toggleChapter(id) { setOpenChapters(o => ({ ...o, [id]: !o[id] })) }

  async function addChapter(e) {
    e.preventDefault()
    if (!addChForm.trim()) return
    await client.post(`/api/trainer/module/${moduleId}/chapter/add`, { chapter_title: addChForm })
    setAddChForm(''); setAddChModal(false); load()
  }

  async function deleteChapter(id) {
    if (!confirm('Delete this chapter and all its materials?')) return
    await client.delete(`/api/trainer/module/${moduleId}/chapter/${id}`); load()
  }

  async function deleteMaterial(matId) {
    if (!confirm('Delete this material?')) return
    await client.delete(`/api/trainer/module/${moduleId}/material/${matId}`); load()
  }

  async function doUpload(e) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return alert('Select a file')
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', uploadForm.title || file.name)
    fd.append('phase', uploadForm.phase)
    if (uploadForm.chapter_id) fd.append('chapter_id', uploadForm.chapter_id)
    try {
      await client.post(`/api/trainer/module/${moduleId}/upload`, fd)
      setUploadModal(false); setUploadForm({ title:'', phase:'pre', chapter_id:'' }); fileRef.current.value=''; load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed')
    } finally { setUploading(false) }
  }

  async function deleteTest(testId) {
    if (!confirm('Delete this test and all attempt records?')) return
    await client.delete(`/api/trainer/module/${moduleId}/test/${testId}`); load()
  }

  if (!data) return <div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>Loading…</div>
  const { module, chapters, mat_by_chapter, tests, enrollments } = data

  return (
    <>
      {/* Back */}
      <div style={{ marginBottom:18 }}>
        <Link to="/trainer/modules" className="btn btn-ghost btn-sm">← All Modules</Link>
      </div>

      {/* Module header */}
      <div className="card card-p anim-up mb-6" style={{ background:`linear-gradient(135deg,${module.color||'var(--acc)'}22,var(--card))`, borderColor:`${module.color||'var(--acc)'}44` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', color:module.color||'var(--acc)', marginBottom:6 }}>{module.category}</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, marginBottom:6 }}>{module.title}</h2>
            <p className="t-secondary t-sm" style={{ marginBottom:10 }}>{module.description}</p>
            <div className="t-xs t-muted">
              {fmtDate(module.start_datetime)} — {fmtDate(module.end_datetime)}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
            <Link to={`/trainer/module/${moduleId}/reports`} className="btn btn-secondary btn-sm">📊 Reports</Link>
            <Link to={`/trainer/module/${moduleId}/test/create`} className="btn btn-gold btn-sm">+ New Test</Link>
            <button className="btn btn-primary btn-sm" onClick={()=>setAddChModal(true)}>+ Chapter</button>
            <button className="btn btn-primary btn-sm" onClick={()=>setUploadModal(true)}>↑ Upload</button>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:22, alignItems:'start' }}>
        {/* Chapters & Materials */}
        <div>
          <div className="sh mb-4"><div className="sh-title">Course Content</div><div className="sh-sub">{chapters.length} chapters</div></div>
          {chapters.length === 0 && (
            <div className="card card-p">
              <div className="empty"><div className="empty-ico">📚</div><div className="empty-title">No chapters yet</div>
                <div className="empty-sub">Click "+ Chapter" to add your first chapter.</div>
              </div>
            </div>
          )}
          <div className="chapter-list">
            {chapters.map((ch, idx) => {
              const open = openChapters[ch.id]
              const mats = mat_by_chapter[ch.id] || []
              return (
                <div key={ch.id} className={`chapter-item${open ? ' active' : ''}`}>
                  <div className="ch-header" onClick={() => toggleChapter(ch.id)}>
                    <div className={`ch-num${open ? ' active' : ''}`}>{idx+1}</div>
                    <div className="ch-title">{ch.title}</div>
                    <span className="t-xs t-muted">{mats.length} files</span>
                    <span className={`ch-chevron${open ? ' open' : ''}`}>▾</span>
                    <button className="btn btn-xs btn-danger" style={{ marginLeft:8 }} onClick={e=>{e.stopPropagation();deleteChapter(ch.id)}}>✕</button>
                  </div>
                  {open && (
                    <div className="ch-body open">
                      {mats.length === 0
                        ? <div style={{ padding:'14px 16px', color:'var(--t3)', fontSize:13 }}>No materials in this chapter yet.</div>
                        : mats.map(mat => (
                          <div key={mat.id} className="mat-row">
                            <div className="mat-ico" style={{ background:'var(--acc-bg)' }}>{TYPE_ICO[mat.file_type]||'📁'}</div>
                            <div className="mat-info">
                              <div className="mat-title">{mat.title}</div>
                              <div className="mat-sub">{mat.file_type} · <span className="badge b-blue" style={{ fontSize:9 }}>{mat.release_phase}</span></div>
                            </div>
                            <div className="mat-actions">
                              <a href={fileUrl(mat.file_path)} target="_blank" rel="noopener" className="btn btn-xs btn-secondary">↗</a>
                              <button className="btn btn-xs btn-danger" onClick={()=>deleteMaterial(mat.id)}>✕</button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Ungrouped materials */}
          {(mat_by_chapter[0]||[]).length > 0 && (
            <div style={{ marginTop:16 }}>
              <div className="sh-sub mb-2">Uncategorised Materials</div>
              {mat_by_chapter[0].map(mat => (
                <div key={mat.id} className="mat-row card" style={{ borderRadius:'var(--r2)' }}>
                  <div className="mat-ico" style={{ background:'var(--acc-bg)' }}>{TYPE_ICO[mat.file_type]||'📁'}</div>
                  <div className="mat-info"><div className="mat-title">{mat.title}</div></div>
                  <div className="mat-actions">
                    <a href={fileUrl(mat.file_path)} target="_blank" rel="noopener" className="btn btn-xs btn-secondary">↗</a>
                    <button className="btn btn-xs btn-danger" onClick={()=>deleteMaterial(mat.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div>
          {/* Tests */}
          <div className="sh mb-3"><div className="sh-title">Tests</div></div>
          {tests.length === 0 ? (
            <div className="card card-p mb-4"><div className="empty" style={{ padding:24 }}>
              <div className="empty-ico" style={{ fontSize:20, width:48, height:48 }}>📝</div>
              <div className="empty-title" style={{ fontSize:15 }}>No Tests Yet</div>
              <Link to={`/trainer/module/${moduleId}/test/create`} className="btn btn-gold btn-sm" style={{ marginTop:8 }}>Create Test</Link>
            </div></div>
          ) : (
            tests.map(t => (
              <div key={t.id} className="card card-p mb-3">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{t.title}</div>
                    <span className={`badge ${t.test_type==='pre'?'b-sky':t.test_type==='mid'?'b-amber':'b-violet'}`} style={{ fontSize:10 }}>{t.test_type}-test</span>
                    <div style={{ fontSize:12, color:'var(--t3)', marginTop:5 }}>
                      {t.duration_minutes}min · Pass: {t.passing_marks}% · Max attempts: {t.max_attempts}
                    </div>
                    <div style={{ fontSize:11, color:'var(--t4)', marginTop:3 }}>
                      {fmtDate(t.start_datetime)} → {fmtDate(t.end_datetime)}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    <Link to={`/trainer/module/${moduleId}/test/${t.id}/edit`} className="btn btn-xs btn-secondary">Edit</Link>
                    <button className="btn btn-xs btn-danger" onClick={()=>deleteTest(t.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Enrollments */}
          <div className="sh mb-3" style={{ marginTop:4 }}><div className="sh-title">Enrolled Trainees</div><span className="badge b-blue">{enrollments.length}</span></div>
          {enrollments.length === 0
            ? <div className="card card-p" style={{ textAlign:'center', color:'var(--t3)', fontSize:13 }}>No trainees enrolled</div>
            : enrollments.map(e => (
              <div key={e.trainee_id} className="flex items-c gap-3 mb-3">
                <div className="ava ava-sm">{e.name?.[0]}</div>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontWeight:600, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.name}</div>
                  <div style={{ fontSize:11, color:'var(--t3)' }}>{e.department||'—'}</div>
                </div>
                {e.completed
                  ? <span className="badge b-green badge-dot" style={{ fontSize:9 }}>Done</span>
                  : <span className="badge b-neutral" style={{ fontSize:9 }}>Active</span>
                }
              </div>
            ))
          }
        </div>
      </div>

      {/* Add Chapter Modal */}
      {addChModal && (
        <div className="modal-bg open" onClick={()=>setAddChModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Add Chapter</div>
            <form onSubmit={addChapter}>
              <div className="form-group">
                <label className="form-label">Chapter Title *</label>
                <input className="form-input" placeholder="e.g., Introduction & Overview" value={addChForm}
                  onChange={e=>setAddChForm(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" style={{ justifyContent:'center' }}>Add Chapter</button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="modal-bg open" onClick={()=>setUploadModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setUploadModal(false)}>✕</button>
            <div className="modal-title">Upload Material</div>
            <form onSubmit={doUpload}>
              <div className="form-group">
                <label className="form-label">File *</label>
                <input type="file" ref={fileRef} className="form-input" style={{ padding:8 }} accept=".pdf,.ppt,.pptx,.mp4,.mov,.avi,.mkv,.webm,.png,.jpg,.jpeg" required />
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="Display name (optional)" value={uploadForm.title}
                  onChange={e=>setUploadForm(f=>({...f,title:e.target.value}))} />
              </div>
              <div className="g2">
                <div className="form-group">
                  <label className="form-label">Release Phase</label>
                  <select className="form-select" value={uploadForm.phase} onChange={e=>setUploadForm(f=>({...f,phase:e.target.value}))}>
                    <option value="pre">Pre-Session</option>
                    <option value="live">During Session</option>
                    <option value="post">Post-Session</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Chapter</label>
                  <select className="form-select" value={uploadForm.chapter_id} onChange={e=>setUploadForm(f=>({...f,chapter_id:e.target.value}))}>
                    <option value="">None</option>
                    {chapters.map(ch=><option key={ch.id} value={ch.id}>{ch.title}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-gold btn-md w-full" style={{ justifyContent:'center' }} disabled={uploading}>
                {uploading ? 'Uploading…' : '↑ Upload File'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
