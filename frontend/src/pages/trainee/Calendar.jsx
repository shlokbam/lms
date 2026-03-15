import { useState, useEffect } from 'react'
import client from '../../api/client'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmtTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true })
}

function fmtTimeShort(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
}

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [cur, setCur] = useState(new Date())
  const [popup, setPopup] = useState(null)
  const [popupPos, setPopupPos] = useState({ left:0, top:0 })

  useEffect(() => {
    client.get('/api/trainee/calendar').then(r => setEvents(r.data)).catch(() => {})
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Training Calendar')
  }, [])

  const y = cur.getFullYear(), m = cur.getMonth()
  let dow = new Date(y, m, 1).getDay(); if (dow === 0) dow = 7
  const days = new Date(y, m+1, 0).getDate()
  const today = new Date()
  const now = new Date().toISOString()

  const upcoming = events.filter(e => e.start > now).sort((a,b) => a.start.localeCompare(b.start)).slice(0, 10)

  function openPopup(e, ev) {
    const rect = e.currentTarget.getBoundingClientRect()
    const vw = window.innerWidth
    let left = rect.left + window.scrollX
    let top = rect.bottom + window.scrollY + 4
    if (left + 340 > vw) left = vw - 340
    setPopup(ev); setPopupPos({ left, top })
  }

  function renderCells() {
    const cells = []
    for (let i = 1; i < dow; i++) cells.push(<div key={`e${i}`} className="cal-cell other"></div>)
    for (let d = 1; d <= days; d++) {
      const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const isT = d===today.getDate() && m===today.getMonth() && y===today.getFullYear()
      const de = events.filter(e => e.start && e.start.startsWith(ds))
      cells.push(
        <div key={d} className={`cal-cell${isT?' today':''}`}>
          <div className="cal-day">{d}{isT && <span style={{ display:'inline-block',width:5,height:5,background:'var(--acc)',borderRadius:'50%',marginLeft:3,verticalAlign:'middle' }}></span>}</div>
          {de.map((ev,idx) => (
            <div key={idx} className={`cal-ev ${ev.type==='module'?'mod':'tst'}`} style={{ cursor:'pointer', ...(ev.color&&ev.type==='module'?{background:ev.color+'22',borderLeft:`2px solid ${ev.color}`}:{}) }}
              title={`${ev.title} · ${fmtTimeShort(ev.start)}`}
              onClick={e2 => openPopup(e2, ev)}>
              <span style={{ fontSize:9, opacity:.75, display:'block', lineHeight:1.2 }}>{fmtTimeShort(ev.start)}</span>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>
                {ev.title.length > 13 ? ev.title.substring(0,13)+'…' : ev.title}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return cells
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:22, alignItems:'start' }}>
      <div>
        <div className="card anim-up mb-4">
          <div style={{ padding:18, borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={()=>setCur(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}>← Prev</button>
            <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:20 }}>{MONTHS[m]} {y}</h3>
            <button className="btn btn-secondary btn-sm" onClick={()=>setCur(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}>Next →</button>
          </div>
          <div className="cal-hdr">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} className="cal-hdr-cell">{d}</div>)}
          </div>
          <div className="cal-body">{renderCells()}</div>
        </div>
        <div className="flex gap-4 anim-up d1" style={{ flexWrap:'wrap' }}>
          <div className="flex items-c gap-2 t-sm t-secondary"><div style={{ width:12,height:12,background:'var(--acc)',borderRadius:3 }}></div>Training Module</div>
          <div className="flex items-c gap-2 t-sm t-secondary"><div style={{ width:12,height:12,background:'var(--amber)',borderRadius:3 }}></div>Test</div>
        </div>
      </div>

      <div>
        <div className="sh mb-4 anim-r"><div className="sh-title">Upcoming Events</div></div>
        {upcoming.length === 0
          ? <div className="card card-p center" style={{ padding:32 }}><div style={{ fontSize:28,marginBottom:8 }}>✅</div><div className="t-sm t-muted">No upcoming events</div></div>
          : upcoming.map((ev,i) => (
            <a key={i} href={ev.id&&ev.type==='module'?`/trainee/module/${ev.id}`:'#'}>
              <div className="card card-p" style={{ marginBottom:10, borderLeft:`3px solid ${ev.type==='module'?(ev.color||'var(--acc)'):'var(--amber)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:4, lineHeight:1.4, flex:1 }}>{ev.title}</div>
                  <span className={`badge ${ev.type==='module'?'b-blue':'b-amber'}`} style={{ fontSize:9, flexShrink:0 }}>{ev.type}</span>
                </div>
                <div style={{ fontSize:11.5, color:'var(--t2)', display:'flex', flexDirection:'column', gap:3 }}>
                  <div>🟢 <strong>Start:</strong> {fmtTime(ev.start)}</div>
                  {ev.end && <div>🔴 <strong>End:</strong>&nbsp;&nbsp; {fmtTime(ev.end)}</div>}
                </div>
              </div>
            </a>
          ))
        }
      </div>

      {/* Event popup */}
      {popup && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:998 }} onClick={()=>setPopup(null)}></div>
          <div style={{ display:'block', position:'fixed', zIndex:999, background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r3)', boxShadow:'0 8px 32px rgba(0,0,0,.18)', padding:18, minWidth:260, maxWidth:320, left:popupPos.left, top:popupPos.top }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span className={`badge ${popup.type==='module'?'b-blue':'b-amber'}`}>{popup.type==='module'?'📚 Module':'📝 Test'}</span>
              <button onClick={()=>setPopup(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:18 }}>✕</button>
            </div>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:10, lineHeight:1.4 }}>{popup.title}</div>
            <div style={{ fontSize:12.5, color:'var(--t2)', display:'flex', flexDirection:'column', gap:6 }}>
              {popup.start && <div><span style={{ color:'var(--t3)' }}>🟢 Start</span> &nbsp;{fmtTime(popup.start)}</div>}
              {popup.end   && <div><span style={{ color:'var(--t3)' }}>🔴 End</span> &nbsp;&nbsp;&nbsp;{fmtTime(popup.end)}</div>}
            </div>
            {popup.id && popup.type==='module' && (
              <div style={{ marginTop:12 }}>
                <a href={`/trainee/module/${popup.id}`} className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }}>Open Module →</a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
