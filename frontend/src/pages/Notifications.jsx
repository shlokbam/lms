import { useState, useEffect } from 'react'
import client from '../api/client'

const ICONS = { info:'ℹ️', welcome:'', module_published:'', material_upload:'', test_created:'' }
const COLORS = { info:'var(--sky-bg)', welcome:'var(--acc-bg)', module_published:'var(--acc-bg)', material_upload:'var(--green-bg)', test_created:'var(--violet-bg)' }

export default function Notifications() {
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    client.get('/api/notifications').then(r => setNotifs(r.data)).catch(() => {})
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Notifications')
  }, [])

  async function markAll() {
    await client.post('/api/notifications/mark-read')
    setNotifs(n => n.map(x => ({ ...x, is_read: true })))
  }

  return (
    <div style={{ maxWidth:680 }}>
      <div className="flex justify-b items-c mb-6 anim-up">
        <div className="sh-title">All Notifications</div>
        <button className="btn btn-ghost btn-sm" onClick={markAll}>✓ Mark all read</button>
      </div>
      <div className="card">
        {notifs.length === 0 ? (
          <div className="empty" style={{ padding:56 }}>
            <div className="empty-ico"></div>
            <div className="empty-title">All caught up!</div>
            <div className="empty-sub">No notifications yet. They'll appear here when your trainer publishes modules or uploads materials.</div>
          </div>
        ) : (
          notifs.map((n,i) => (
            <a key={n.id} href={n.link||'#'} className="anim-up" style={{ animationDelay:`${i*30}ms` }}>
              <div className={`notif-page-item${n.is_read?'':' unread'}`}>
                <div className="npi-ico" style={{ background: COLORS[n.type]||'var(--card2)' }}>{ICONS[n.type]||''}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:n.is_read?500:700 }}>{n.title}</div>
                  <div className="t-sm t-secondary" style={{ marginTop:3 }}>{n.body}</div>
                  <div className="t-xs t-muted" style={{ marginTop:5 }}>{n.created_at?.slice(0,16).replace('T',' ')}</div>
                </div>
                {!n.is_read && <div style={{ width:8, height:8, background:'var(--acc)', borderRadius:'50%', flexShrink:0, marginTop:6 }}></div>}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
