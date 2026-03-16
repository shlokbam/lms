import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await login(form.email, form.password)
      navigate(data.role === 'trainer' ? '/trainer/dashboard' : '/trainee/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  function fillDemo(role) {
    if (role === 'trainer') setForm({ email: 'trainer@eagle.com', password: 'trainer123' })
    else setForm({ email: 'trainee@eagle.com', password: 'trainee123' })
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-grid"></div>
        <div className="auth-glow"></div>
        <div className="auth-left-inner">
          <div className="auth-logo"></div>
          <h1>Eagle Security LMS</h1>
          <div className="auth-tagline">EAGLE INDUSTRIAL SERVICES PVT. LTD.</div>
          <p>Professional training &amp; compliance platform for India's leading security &amp; facility management workforce.</p>
          <div className="auth-stats">
            <div><div className="auth-stat-n">2,500+</div><div className="auth-stat-l">Employees</div></div>
            <div><div className="auth-stat-n">110+</div><div className="auth-stat-l">Clients</div></div>
            <div><div className="auth-stat-n">15+</div><div className="auth-stat-l">Years</div></div>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-heading">Welcome back</div>
        <div className="auth-sub">Sign in to continue your training journey</div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" required value={form.email}
              placeholder="you@company.com"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password</label>
            <input className="form-input" type={showPw ? 'text' : 'password'} required value={form.password}
              placeholder="••••••••"
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ position: 'absolute', right: 12, bottom: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 13 }}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          <button type="submit" className="btn btn-gold btn-lg w-full" disabled={loading} style={{ justifyContent: 'center', marginBottom: 16 }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--acc)', fontWeight: 600 }}>Register here</Link>
        </div>
        <div className="demo-box">
          <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Demo Credentials</div>
          <div className="demo-row">
            <span className="demo-cred">trainer@eagle.com / trainer123</span>
            <button className="btn btn-ghost btn-xs" onClick={() => fillDemo('trainer')}>Fill</button>
          </div>
          <div className="demo-row" style={{ marginTop: 6 }}>
            <span className="demo-cred">trainee@eagle.com / trainee123</span>
            <button className="btn btn-ghost btn-xs" onClick={() => fillDemo('trainee')}>Fill</button>
          </div>
        </div>
      </div>
    </div>
  )
}
