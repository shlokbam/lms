import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../../api/client'

export default function TakeTest() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [testData, setTestData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [answered, setAnswered] = useState(new Set())
  const [timeLeft, setTimeLeft] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    client.get(`/api/trainee/test/${testId}`).then(r => {
      setTestData(r.data)
      setTimeLeft(r.data.test.duration_minutes * 60)
      document.getElementById('page-title') && (document.getElementById('page-title').textContent = r.data.test.title)
    }).catch(err => {
      alert(err.response?.data?.detail || 'Cannot access this test')
      navigate(-1)
    })
  }, [testId])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { submit(); return }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timeLeft])

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    clearTimeout(timerRef.current)
    try {
      const { data } = await client.post(`/api/trainee/test/${testId}/submit`, { answers })
      navigate(`/trainee/test/${testId}/result`, { state: data })
    } catch (err) {
      alert(err.response?.data?.detail || 'Submission failed')
      setSubmitting(false)
    }
  }

  function pickAnswer(qId, val) {
    setAnswers(a => ({ ...a, [qId]: val }))
    setAnswered(s => new Set([...s, qId]))
  }

  if (!testData) return <div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>Loading test…</div>
  const { test, questions } = testData

  const m = Math.floor(timeLeft/60), s = timeLeft%60
  const timerClass = `timer${timeLeft<=60?' urgent':timeLeft<=180?' warn':''}`

  return (
    <div style={{ maxWidth:740 }}>
      {/* Timer in topbar area */}
      <div style={{ position:'sticky', top:62, zIndex:100, background:'var(--bg)', paddingBottom:12, paddingTop:4, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div></div>
        <div className={timerClass}>⏱ {m}:{s<10?'0':''}{s}</div>
      </div>

      {/* Header */}
      <div className="card card-p anim-scale mb-6" style={{ background:'linear-gradient(135deg,var(--acc-bg),var(--card))', borderColor:'var(--acc-mid)' }}>
        <div className="flex items-c gap-4">
          <div style={{ width:52, height:52, background:'var(--acc)', borderRadius:'var(--r3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:'0 6px 20px var(--acc-glow)', flexShrink:0 }}></div>
          <div>
            <div className="t-xs fw-700 t-muted" style={{ textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>{test.test_type}-Assessment</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20 }}>{test.title}</div>
            <div className="t-sm t-secondary">{questions.length} questions · {test.duration_minutes} minutes · Pass at {test.passing_marks}%</div>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="step-row anim-up d1">
        {questions.map((q,i) => (
          <div key={q.id} className={`step${answered.has(q.id)?' done':''}`}>
            <div className={`step-dot${answered.has(q.id)?' done':''}`}>{answered.has(q.id)?'✓':i+1}</div>
            <div className="step-label">Q{i+1}</div>
          </div>
        ))}
      </div>

      {/* Questions */}
      {questions.map((q,i) => (
        <div key={q.id} className="q-card anim-up" style={{ animationDelay:`${i*40}ms` }}>
          <div className="flex items-c gap-3 mb-4">
            <div className="q-num-badge">{i+1}</div>
            <span className="t-xs t-muted fw-700" style={{ textTransform:'uppercase', letterSpacing:'.5px' }}>{q.marks} mark{q.marks>1?'s':''}</span>
          </div>
          <div style={{ fontSize:15.5, fontWeight:600, marginBottom:18, lineHeight:1.5, color:'var(--t1)' }}>{q.question_text}</div>
          {[['A',q.option_a],['B',q.option_b],['C',q.option_c],['D',q.option_d]].filter(([,v])=>v).map(([key,val]) => (
            <label key={key} className="opt-label" onClick={() => pickAnswer(q.id, key)}
              style={{ borderColor:answers[q.id]===key?'var(--acc)':'var(--border)', background:answers[q.id]===key?'var(--acc-bg)':'var(--card2)' }}>
              <input type="radio" name={`q_${q.id}`} value={key} checked={answers[q.id]===key} onChange={()=>pickAnswer(q.id,key)} style={{ display:'none' }} />
              <div className="opt-key" style={{ background:answers[q.id]===key?'var(--acc)':'var(--border)', color:answers[q.id]===key?'#fff':'var(--t2)' }}>{key}</div>
              <span style={{ fontSize:14, color:'var(--t1)', flex:1 }}>{val}</span>
            </label>
          ))}
        </div>
      ))}

      <div className="card card-p flex justify-b items-c anim-up d4 mt-4">
        <div className="t-sm t-muted">Timer will auto-submit when it reaches 0:00</div>
        <button className="btn btn-gold btn-lg" onClick={submit} disabled={submitting}>{submitting?'Submitting…':'Submit Test →'}</button>
      </div>
    </div>
  )
}
