import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Topbar({ pageTitle, actions }) {
  const { user } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifData, setNotifData] = useState({ count: 0, items: [] })
  const dropRef = useRef(null)

  const isTrainee = user?.role === 'trainee'

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme')
    const next = cur === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('eagle-theme', next)
    const tbtn = document.getElementById('theme-btn')
    const sbtn = document.getElementById('sb-theme')
    if (tbtn) tbtn.textContent = next === 'dark' ? '☀' : '◑'
    if (sbtn) sbtn.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode'
  }

  async function loadNotifs() {
    try {
      const { data } = await client.get('/api/notifications/unread')
      setNotifData(data)
    } catch {}
  }

  async function markAllRead() {
    await client.post('/api/notifications/mark-read')
    setNotifData(d => ({ ...d, count: 0 }))
    loadNotifs()
  }

  useEffect(() => {
    if (isTrainee) loadNotifs()
  }, [isTrainee])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  function timeAgo(ts) {
    const diff = Math.floor((new Date() - new Date(ts)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
    return Math.floor(diff / 86400) + 'd ago'
  }

  const icons = { info: 'i', welcome: 'w', module_published: 'm', material_upload: 'f', test_created: 't' }
  const colors = { info: 'var(--sky-bg)', welcome: 'var(--acc-bg)', module_published: 'var(--acc-bg)', material_upload: 'var(--green-bg)', test_created: 'var(--violet-bg)' }

  return (
    <header className="topbar">
      <div className="tb-title" id="page-title"></div>
      <div className="tb-actions">
        {isTrainee && (
          <div style={{ position: 'relative' }} ref={dropRef}>
            <button
              className="notif-bell"
              onClick={() => { setNotifOpen(o => !o); if (!notifOpen) loadNotifs() }}
              title="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="notif-dot" style={{ display: notifData.count > 0 ? 'block' : 'none' }}></span>
            </button>
            {notifOpen && (
              <div className="notif-drop open">
                <div className="nd-head">
                  <span className="nd-title">Notifications</span>
                  <span className="nd-mark" onClick={markAllRead}>Mark all read</span>
                </div>
                <div>
                  {notifData.items?.length === 0
                    ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>🎉 All caught up!</div>
                    : notifData.items?.map(n => (
                      <div key={n.id} className={`nd-item${n.is_read ? '' : ' unread'}`} onClick={() => window.location.href = n.link || '/trainee/notifications'}>
                        <div className="nd-item-icon" style={{ background: colors[n.type] || 'var(--card2)', fontSize: 11, fontWeight: 700, color: 'var(--acc)' }}>
                          {icons[n.type] || '!'}
                        </div>
                        <div>
                          <div className="nd-item-title">{n.title}</div>
                          <div className="nd-item-body">{n.body || ''}</div>
                          <div className="nd-item-time">{timeAgo(n.created_at)}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
                <div className="nd-footer"><a href="/trainee/notifications">View all notifications →</a></div>
              </div>
            )}
          </div>
        )}
        <button className="theme-btn" onClick={toggleTheme} id="theme-btn" title="Toggle theme">◑</button>
      </div>
    </header>
  )
}
