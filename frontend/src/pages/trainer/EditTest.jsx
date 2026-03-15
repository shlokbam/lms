import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import client from '../../api/client'

export default function EditTest() {
  const { moduleId, testId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [questions, setQuestions] = useState([])
  const [saving, setSaving] = useState(false)

  function dtStr(s) {
    if (!s) return ''
    return new Date(s).toISOString().slice(0,16)
  }

  useEffect(() => {
    client.get(`/api/trainer/module/${moduleId}/test/${testId}`).then(r => {
      const t = r.data
      setForm({
        title: t.title, test_type: t.test_type, duration: t.duration_minutes,
        start_datetime: dtStr(t.start_datetime), end_datetime: dtStr(t.end_datetime),
        passing_marks: t.passing_marks, max_attempts: t.max_attempts
      })
      setQuestions(t.questions.map(q => ({
        text: q.question_text, a: q.option_a||'', b: q.option_b||'', c: q.option_c||'', d: q.option_d||'',
        correct: q.correct_option||'A', marks: q.marks||1
      })))
    })
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Edit Test')
  }, [testId])

  function setQ(i,k,v) { setQuestions(qs=>{ const n=[...qs]; n[i]={...n[i],[k]:v}; return n }) }
  const upd = k => e => setForm(f => ({...f, [k]: e.target.value}))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await client.put(`/api/trainer/module/${moduleId}/test/${testId}`, { ...form, questions })
      navigate(`/trainer/module/${moduleId}`)
    } catch (err) { alert(err.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }

  if (!form) return <div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>Loading…</div>

  return (
    <>
      <div style={{ marginBottom:18 }}><Link to={`/trainer/module/${moduleId}`} className="btn btn-ghost btn-sm">← Back to Module</Link></div>
      <div style={{ maxWidth:760 }}>
        <div className="card card-p anim-up mb-6" style={{ background:'linear-gradient(135deg,var(--amber-bg),var(--card))', borderColor:'rgba(245,158,11,.25)' }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, marginBottom:4 }}>Edit Test</div>
          <div className="t-sm t-secondary">Modify settings and questions — existing attempt records are preserved</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card card-p anim-up d1 mb-4">
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>Test Configuration</div>
            <div className="g2">
              <div className="form-group col2">
                <label className="form-label">Test Title *</label>
                <input className="form-input" required value={form.title} onChange={upd('title')} />
              </div>
              <div className="form-group">
                <label className="form-label">Test Type</label>
                <select className="form-select" value={form.test_type} onChange={upd('test_type')}>
                  <option value="pre">Pre-Test</option>
                  <option value="mid">Mid-Test</option>
                  <option value="post">Post-Test</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (min)</label>
                <input className="form-input" type="number" min={5} max={180} value={form.duration} onChange={upd('duration')} />
              </div>
              <div className="form-group">
                <label className="form-label">Start</label>
                <input className="form-input" type="datetime-local" required value={form.start_datetime} onChange={upd('start_datetime')} />
              </div>
              <div className="form-group">
                <label className="form-label">End</label>
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
          <div className="sh anim-up d2 mb-4">
            <div><div className="sh-title">Questions</div><div className="sh-sub">{questions.length} questions</div></div>
            <button type="button" className="btn btn-primary btn-sm" onClick={()=>setQuestions(qs=>[...qs,{text:'',a:'',b:'',c:'',d:'',correct:'A',marks:1}])}>+ Add</button>
          </div>
          {questions.map((q,i) => (
            <div key={i} className="q-card anim-up mb-4">
              <div className="flex items-c gap-3 mb-4">
                <div className="q-num-badge">{i+1}</div>
                <input className="form-input" placeholder="Question text" value={q.text} onChange={e=>setQ(i,'text',e.target.value)} required style={{ flex:1 }} />
                <input className="form-input" type="number" min={1} max={10} value={q.marks} onChange={e=>setQ(i,'marks',+e.target.value)} style={{ width:70, textAlign:'center' }} />
                {questions.length>1 && <button type="button" className="btn btn-xs btn-danger" onClick={()=>setQuestions(qs=>qs.filter((_,j)=>j!==i))}>✕</button>}
              </div>
              <div className="g2">
                {['a','b','c','d'].map(opt => (
                  <div key={opt} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:5, background:q.correct===opt.toUpperCase()?'var(--green)':'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, cursor:'pointer', color:q.correct===opt.toUpperCase()?'#fff':'var(--t2)', flexShrink:0 }}
                      onClick={()=>setQ(i,'correct',opt.toUpperCase())}>{opt.toUpperCase()}</div>
                    <input className="form-input" placeholder={`Option ${opt.toUpperCase()}`} value={q[opt]} onChange={e=>setQ(i,opt,e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="card card-p flex justify-b items-c anim-up" style={{ marginTop:16 }}>
            <Link to={`/trainer/module/${moduleId}`} className="btn btn-secondary btn-md">Cancel</Link>
            <button type="submit" className="btn btn-gold btn-md" disabled={saving}>{saving?'Saving…':'Save Changes →'}</button>
          </div>
        </form>
      </div>
    </>
  )
}
