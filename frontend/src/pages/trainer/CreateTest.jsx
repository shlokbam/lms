import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../../api/client'

function emptyQ() {
  return { text:'', a:'', b:'', c:'', d:'', correct:'A', marks:1 }
}

export default function CreateTest() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title:'', test_type:'pre', duration:30,
    start_datetime:'', end_datetime:'', passing_marks:60, max_attempts:1
  })
  const [questions, setQuestions] = useState([emptyQ()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Create Test')
  }, [])

  function setQ(i, field, val) {
    setQuestions(qs => { const n = [...qs]; n[i] = { ...n[i], [field]: val }; return n })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (questions.length === 0) return alert('Add at least one question')
    setSaving(true)
    try {
      await client.post(`/api/trainer/module/${moduleId}/test`, { ...form, questions })
      navigate(`/trainer/module/${moduleId}`)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create test')
    } finally { setSaving(false) }
  }

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <div style={{ marginBottom:18 }}><Link to={`/trainer/module/${moduleId}`} className="btn btn-ghost btn-sm">← Back to Module</Link></div>
      <div style={{ maxWidth:760 }}>
        <div className="card card-p anim-up mb-6" style={{ background:'linear-gradient(135deg,var(--acc-bg),var(--card))', borderColor:'var(--acc-mid)' }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, marginBottom:4 }}>Create New Test</div>
          <div className="t-sm t-secondary">Configure the test settings and build your question bank</div>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Config */}
          <div className="card card-p anim-up d1 mb-4">
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>Test Configuration</div>
            <div className="g2">
              <div className="form-group col2">
                <label className="form-label">Test Title *</label>
                <input className="form-input" required placeholder="e.g., Pre-Assessment" value={form.title} onChange={upd('title')} />
              </div>
              <div className="form-group">
                <label className="form-label">Test Type *</label>
                <select className="form-select" required value={form.test_type} onChange={upd('test_type')}>
                  <option value="pre">Pre-Test (before session)</option>
                  <option value="mid">Mid-Test (during session)</option>
                  <option value="post">Post-Test (after session)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input className="form-input" type="number" min={5} max={180} value={form.duration} onChange={upd('duration')} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date & Time *</label>
                <input className="form-input" type="datetime-local" required value={form.start_datetime} onChange={upd('start_datetime')} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time *</label>
                <input className="form-input" type="datetime-local" required value={form.end_datetime} onChange={upd('end_datetime')} />
              </div>
              <div className="form-group">
                <label className="form-label">Passing Marks (%)</label>
                <input className="form-input" type="number" min={1} max={100} value={form.passing_marks} onChange={upd('passing_marks')} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Attempts</label>
                <input className="form-input" type="number" min={1} max={5} value={form.max_attempts} onChange={upd('max_attempts')} />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="sh anim-up d2 mb-4">
            <div><div className="sh-title">Question Bank</div><div className="sh-sub">{questions.length} questions · {questions.reduce((s,q)=>s+Number(q.marks),0)} total marks</div></div>
            <button type="button" className="btn btn-primary btn-sm" onClick={()=>setQuestions(qs=>[...qs,emptyQ()])}>+ Add Question</button>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="q-card anim-up mb-4">
              <div className="flex items-c gap-3 mb-4">
                <div className="q-num-badge">{i+1}</div>
                <div style={{ flex:1 }}>
                  <input className="form-input" placeholder="Enter your question text here…" value={q.text}
                    onChange={e=>setQ(i,'text',e.target.value)} required />
                </div>
                <div style={{ width:70 }}>
                  <input className="form-input" type="number" min={1} max={10} placeholder="Marks" value={q.marks}
                    onChange={e=>setQ(i,'marks',+e.target.value)} style={{ textAlign:'center' }} />
                </div>
                {questions.length > 1 && (
                  <button type="button" className="btn btn-xs btn-danger" onClick={()=>setQuestions(qs=>qs.filter((_,j)=>j!==i))}>✕</button>
                )}
              </div>
              <div className="g2">
                {['a','b','c','d'].map(opt => (
                  <div key={opt} className="form-group" style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ width:28, height:28, borderRadius:5, background:q.correct===opt.toUpperCase()?'var(--green)':'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, cursor:'pointer', color:q.correct===opt.toUpperCase()?'#fff':'var(--t2)', flexShrink:0, transition:'all .15s' }}
                      onClick={()=>setQ(i,'correct',opt.toUpperCase())}>{opt.toUpperCase()}</div>
                    <input className="form-input" placeholder={`Option ${opt.toUpperCase()}`} value={q[opt]}
                      onChange={e=>setQ(i,opt,e.target.value)} required={opt==='a'||opt==='b'} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:'var(--t3)' }}>Click the option letter to mark as correct answer. Current: <strong>{q.correct}</strong></div>
            </div>
          ))}

          <div className="card card-p flex justify-b items-c anim-up" style={{ marginTop:16 }}>
            <div className="t-sm t-muted">{questions.length} question(s) · {questions.reduce((s,q)=>s+Number(q.marks),0)} marks total</div>
            <div style={{ display:'flex', gap:8 }}>
              <Link to={`/trainer/module/${moduleId}`} className="btn btn-secondary btn-md">Cancel</Link>
              <button type="submit" className="btn btn-gold btn-md" disabled={saving}>{saving?'Creating…':'Create Test →'}</button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
