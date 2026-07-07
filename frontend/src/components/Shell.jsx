import { useMemo } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { emptyAuth } from '../lib/appCore'

function Shell({ auth, setAuth }) {
  const navigate = useNavigate()
  const isAdminArea = auth.user.role === 'ADMIN' || auth.user.role === 'INSTRUCTOR'

  const navItems = useMemo(() => {
    const common = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/exam-sessions', label: 'Exam Sessions' },
      { to: '/my-attempts', label: 'My Attempts' },
      { to: '/profile', label: 'Profile' },
    ]

    if (!isAdminArea) return common

    return [
      ...common,
      { to: '/admin', label: 'Admin Home' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/subjects', label: 'Subjects' },
      { to: '/questions', label: 'Questions' },
      { to: '/admin/exams', label: 'Exams' },
      { to: '/admin/exam-sessions', label: 'Exam Sessions' },
      { to: '/admin/results', label: 'Results' },
      { to: '/admin/statistics', label: 'Statistics' },
    ]
  }, [isAdminArea])

  const handleLogout = () => {
    setAuth(emptyAuth)
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">ExamPortal</p>
          <h1>Online Exam MVP</h1>
          <p className="muted">React frontend aligned with the handoff spec.</p>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="profile-card">
          <strong>{auth.user.fullName}</strong>
          <span>{auth.user.email}</span>
          <span className="pill">{auth.user.role}</span>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

export default Shell
