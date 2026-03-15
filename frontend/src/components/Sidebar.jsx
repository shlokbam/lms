import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme')
    const next = cur === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('eagle-theme', next)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const isTrainer = user?.role === 'trainer'

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sb-brand">
        <div className="sb-logo" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -1 }}>E</div>
        <div>
          <div className="sb-title">Eagle LMS</div>
          <div className="sb-sub">Training Portal</div>
        </div>
      </div>

      <div className="sb-user" style={{ position: 'relative' }}>
        <div className="ava ava-sm ava-gold">{user?.name?.[0]?.toUpperCase()}</div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="sb-uname">{user?.name}</div>
          <div className="sb-urole">{user?.role}</div>
        </div>
      </div>

      <nav className="sb-nav">
        {isTrainer ? (
          <>
            <div className="sb-group">Overview</div>
            <NavLink to="/trainer/dashboard" className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-icon">&#9632;</span> Dashboard
            </NavLink>

            <div className="sb-group">Modules</div>
            <NavLink to="/trainer/modules" className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-icon">&#9711;</span> All Modules
            </NavLink>

            <div className="sb-group">People</div>
            <NavLink to="/trainer/trainees" className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-icon">&#9675;</span> Trainees
            </NavLink>
          </>
        ) : (
          <>
            <div className="sb-group">Overview</div>
            <NavLink to="/trainee/dashboard" className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-icon">&#9632;</span> Dashboard
            </NavLink>
            <NavLink to="/trainee/notifications" className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-icon">&#9679;</span> Notifications
            </NavLink>
            <NavLink to="/trainee/calendar" className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-icon">&#9633;</span> Calendar
            </NavLink>

            <div className="sb-group">Learning</div>
            <NavLink to="/trainee/dashboard" className="sb-link">
              <span className="sb-icon">&#9711;</span> My Modules
            </NavLink>

            <div className="sb-group">Account</div>
            <NavLink to="/trainee/profile" className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-icon">&#9675;</span> My Profile
            </NavLink>
          </>
        )}
      </nav>

      <div className="sb-bottom">
        <button className="sb-action" onClick={toggleTheme}>Dark Mode</button>
        <button className="sb-action danger" onClick={handleLogout}>Sign Out</button>
      </div>
    </aside>
  )
}
