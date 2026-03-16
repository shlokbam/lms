import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', role: 'trainee', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      // Register via API then login automatically
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Registration failed') }
      const data = await res.json()
      localStorage.setItem('eagle_token', data.access_token)
      localStorage.setItem('eagle_user', JSON.stringify(data))
      navigate(data.role === 'trainer' ? '/trainer/dashboard' : '/trainee/dashboard', { replace: true })
      window.location.reload()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-grid"></div>
        <div className="auth-glow"></div>
        <div className="auth-left-inner">
          <div className="auth-logo"></div>
          <h1>Join Eagle LMS</h1>
          <div className="auth-tagline">START YOUR TRAINING TODAY</div>
          <p>Register to access professional security &amp; facility management training modules.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-heading">Create Account</div>
        <div className="auth-sub">Fill in your details to get started</div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="g2">
            <div className="form-group col2">
              <label className="form-label">Full Name *</label>
              <input className="form-input" type="text" required placeholder="Your full name" value={form.name} onChange={upd('name')} />
            </div>
            <div className="form-group col2">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" required placeholder="you@company.com" value={form.email} onChange={upd('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="text" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={upd('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" type="text" placeholder="e.g., Security Operations" value={form.department} onChange={upd('department')} />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" value={form.role} onChange={upd('role')}>
                <option value="trainee">Trainee</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" required minLength={6} placeholder="Min 6 characters" value={form.password} onChange={upd('password')} />
            </div>
          </div>
          <button type="submit" className="btn btn-gold btn-lg w-full" disabled={loading} style={{ justifyContent: 'center', marginBottom: 16 }}>
            {loading ? 'Creating Account…' : 'Create Account →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--acc)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
