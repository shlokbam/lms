import { useState, useEffect } from 'react'
import client from '../../api/client'
import { fileUrl } from '../../api/fileUrl'

export default function Trainees() {
  const [trainees, setTrainees] = useState([])
  useEffect(() => {
    client.get('/api/trainer/trainees').then(r => setTrainees(r.data)).catch(() => {})
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'All Trainees')
  }, [])

  return (
    <>
      <div className="stat-row anim-up" style={{ marginBottom:24 }}>
        <div className="stat-tile st-blue">
          <div className="st-icon st-i-blue"></div>
          <div className="st-num">{trainees.length}</div>
          <div className="st-lbl">Registered Trainees</div>
        </div>
      </div>
      <div className="card tbl-wrap anim-up d1">
        {trainees.length === 0 ? (
          <div className="empty"><div className="empty-ico"></div><div className="empty-title">No Trainees Yet</div></div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Phone</th><th>Enrolled</th><th>Tests</th><th>Joined</th></tr></thead>
            <tbody>
              {trainees.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-c gap-2">
                      {t.profile_pic ? (
                        <img src={fileUrl(t.profile_pic)} alt="Ava" className="ava ava-sm" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="ava ava-sm">{t.name?.[0]}</div>
                      )}
                      <div style={{ fontWeight:600 }}>{t.name}</div>
                    </div>
                  </td>
                  <td className="t-secondary t-sm">{t.email}</td>
                  <td><span className="badge b-blue">{t.department||'Unassigned'}</span></td>
                  <td className="t-sm t-secondary">{t.phone||'—'}</td>
                  <td className="center"><span className="badge b-neutral">{t.enrolled}</span></td>
                  <td className="center"><span className="badge b-gold">{t.attempts}</span></td>
                  <td className="t-muted t-xs">{t.created_at?.slice(0,10)||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
