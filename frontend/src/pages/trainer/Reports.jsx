import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../../api/client'

export default function Reports() {
  const { moduleId } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    client.get(`/api/trainer/module/${moduleId}/reports`).then(r => setData(r.data))
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = 'Module Reports')
  }, [moduleId])

  if (!data) return <div style={{ padding:40, textAlign:'center', color:'var(--t3)' }}>Loading…</div>
  const { module, tests, report_data } = data

  return (
    <>
      <div style={{ marginBottom:18 }}><Link to={`/trainer/module/${moduleId}`} className="btn btn-ghost btn-sm">← {module.title}</Link></div>
      <div className="card card-p anim-up mb-6" style={{ background:'linear-gradient(135deg,var(--sky-bg),var(--card))', borderColor:'rgba(14,165,233,.2)' }}>
        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, marginBottom:4 }}>PPT {module.title}</h2>
        <p className="t-sm t-secondary">Performance Report · {report_data.length} trainees · {tests.length} tests</p>
      </div>
      {tests.length === 0 ? (
        <div className="card card-p">
          <div className="empty">
            <div className="empty-ico"></div>
            <div className="empty-title">No Tests Created</div>
            <div className="empty-sub">Create tests to see trainee performance data here.</div>
            <Link to={`/trainer/module/${moduleId}/test/create`} className="btn btn-primary">Create Test</Link>
          </div>
        </div>
      ) : (
        <div className="card tbl-wrap anim-up d1">
          <table>
            <thead>
              <tr>
                <th>Trainee</th><th>Department</th><th>Status</th>
                {tests.map(t => (
                  <th key={t.id}>{t.title}<br /><span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'var(--t4)' }}>{t.test_type}-test</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report_data.map(row => (
                <tr key={row.id}>
                  <td><div className="flex items-c gap-2"><div className="ava ava-sm">{row.name?.[0]}</div><div style={{ fontWeight:600, fontSize:13.5 }}>{row.name}</div></div></td>
                  <td><span className="badge b-blue t-xs">{row.department||'—'}</span></td>
                  <td>{row.completed ? <span className="badge b-green badge-dot">Done</span> : <span className="badge b-neutral">Active</span>}</td>
                  {tests.map(t => {
                    const att = row.attempts?.[t.id]
                    return (
                      <td key={t.id}>
                        {att ? (
                          <div className="center">
                            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:att.passed?'var(--green)':'var(--red)' }}>{Math.round(att.percentage)}%</div>
                            <div className="t-xs t-muted">{att.score}/{att.total_marks}</div>
                            <span className={`badge ${att.passed?'b-green':'b-red'}`} style={{ marginTop:4, fontSize:9 }}>{att.passed?'PASS':'FAIL'}</span>
                          </div>
                        ) : <div className="center t-muted t-sm">—</div>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
