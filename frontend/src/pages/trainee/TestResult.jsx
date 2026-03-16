import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export default function TestResult() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const arcRef = useRef(null)

  useEffect(() => {
    if (!state) { navigate('/trainee/dashboard'); return }
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Test Result')
    // Animate score ring
    setTimeout(() => {
      if (arcRef.current) {
        const total = 2 * Math.PI * 70
        arcRef.current.style.strokeDashoffset = total * (1 - state.percentage / 100)
      }
    }, 100)
  }, [state])

  if (!state) return null

  const { score, total, percentage, passed, test, questions, answers } = state
  const pct = Math.round(percentage)

  return (
    <div style={{ maxWidth:700, margin:'0 auto' }}>
      <div className={`card card-p anim-scale mb-6 center`} style={{ padding:48, background:`linear-gradient(135deg,${passed?'var(--green-bg)':'var(--red-bg)'},var(--card))`, borderColor:passed?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)' }}>
        {/* Score ring */}
        <div className="score-ring mb-6">
          <svg width="160" height="160" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border)" strokeWidth="12" />
            <circle ref={arcRef} cx="80" cy="80" r="70" fill="none"
              stroke={passed?'var(--green)':'var(--red)'} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70}
              style={{ transition:'stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)' }} />
          </svg>
          <div className="score-center">
            <div className="score-pct" style={{ color:passed?'var(--green)':'var(--red)' }}>{pct}</div>
            <div className="score-lbl">percent</div>
          </div>
        </div>

        <div style={{ fontSize:48, marginBottom:12 }}>{passed?'':''}</div>
        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, marginBottom:8 }}>{passed?'Congratulations!':'Better Luck Next Time'}</h2>
        <p className="t-secondary mb-6">You scored <strong>{score}</strong> out of <strong>{total}</strong> marks</p>

        <div className="flex justify-c gap-6" style={{ background:'var(--card2)', borderRadius:'var(--r3)', padding:'18px 32px', margin:'0 auto 24px', border:'1px solid var(--border)', display:'inline-flex' }}>
          <div className="center"><div style={{ fontFamily:"'DM Serif Display',serif", fontSize:26 }}>{score}</div><div className="t-xs t-muted">Score</div></div>
          <div style={{ width:1, background:'var(--border)' }}></div>
          <div className="center"><div style={{ fontFamily:"'DM Serif Display',serif", fontSize:26 }}>{total}</div><div className="t-xs t-muted">Total</div></div>
          <div style={{ width:1, background:'var(--border)' }}></div>
          <div className="center"><div style={{ fontFamily:"'DM Serif Display',serif", fontSize:26 }}>{test?.passing_marks}%</div><div className="t-xs t-muted">Pass Mark</div></div>
        </div>
        <div><span className={`badge ${passed?'b-green':'b-red'}`} style={{ fontSize:15, padding:'10px 24px' }}>{passed?'Pass: PASSED':'Fail: FAILED'}</span></div>
      </div>

      {/* Answer Review */}
      <div className="sh anim-up d1 mb-4"><div className="sh-title">Answer Review</div></div>
      {questions?.map((q,i) => {
        const ua = answers?.[String(q.id)] || ''
        const ok = ua === q.correct_option
        return (
          <div key={q.id} className="q-card anim-up" style={{ animationDelay:`${i*35}ms`, borderColor:ok?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)' }}>
            <div className="flex items-c gap-3 mb-4">
              <div className="q-num-badge" style={{ background:ok?'var(--green)':'var(--red)' }}>{i+1}</div>
              <span>{ok?'Pass:':'Fail:'}</span>
              <span className="t-xs t-muted fw-700" style={{ textTransform:'uppercase' }}>{q.marks} mark{q.marks>1?'s':''}</span>
            </div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:16, lineHeight:1.5 }}>{q.question_text}</div>
            {[['A',q.option_a],['B',q.option_b],['C',q.option_c],['D',q.option_d]].filter(([,v])=>v).map(([key,val]) => {
              const isCorrect = key === q.correct_option
              const isWrong = key === ua && !ok
              return (
                <div key={key} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', borderRadius:'var(--r2)', marginBottom:7,
                  background: isCorrect?'var(--green-bg)':isWrong?'var(--red-bg)':'var(--card2)',
                  border: isCorrect?'1.5px solid rgba(16,185,129,.3)':isWrong?'1.5px solid rgba(239,68,68,.2)':'1.5px solid var(--border)' }}>
                  <div style={{ width:26, height:26, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, flexShrink:0,
                    background: isCorrect?'var(--green)':isWrong?'var(--red)':'var(--border2)', color: (isCorrect||isWrong)?'#fff':'var(--t2)' }}>{key}</div>
                  <span style={{ flex:1, fontSize:14 }}>{val}</span>
                  {isCorrect && <span className="t-xs fw-700" style={{ color:'var(--green)' }}>✓ Correct</span>}
                  {isWrong && <span className="t-xs fw-700" style={{ color:'var(--red)' }}>Your answer</span>}
                </div>
              )
            })}
          </div>
        )
      })}

      <div className="center mt-4 mb-4">
        <Link to="/trainee/dashboard" className="btn btn-gold btn-lg">← Back to Dashboard</Link>
      </div>
    </div>
  )
}
