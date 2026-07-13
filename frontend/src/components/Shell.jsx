import { useMemo } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { emptyAuth } from '../lib/appCore'

function Shell({ auth, setAuth }) {
  const navigate = useNavigate()
  const role = auth.user.role
  const basePath = role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/student'
  const dashboardPath = basePath

  const navGroups = useMemo(() => {
    if (role === 'STUDENT') {
      return [
        { label: 'Dashboard', items: [{ to: dashboardPath, label: 'Dashboard' }] },
        { label: 'Classes', items: [{ to: `${basePath}/classes`, label: 'Classes' }] },
        { label: 'Exams', items: [{ to: `${basePath}/exam-sessions`, label: 'Exam Sessions' }] },
        { label: 'Reports', items: [{ to: `${basePath}/my-attempts`, label: 'My Attempts' }] },
      ]
    }

    if (role === 'ADMIN') {
      return [{ label: 'Dashboard', items: [{ to: dashboardPath, label: 'Dashboard' }] }]
    }

    const classItems = [{ to: `${basePath}/classes`, label: 'Classes' }]
    const examItems = [
      { to: `${basePath}/exam-sessions`, label: 'Exam Sessions' },
      { to: `${basePath}/drafts`, label: 'Drafts' },
      { to: `${basePath}/subjects`, label: 'Subjects' },
    ]

    const reportItems = [
      { to: `${basePath}/results`, label: 'Results' },
      { to: `${basePath}/statistics`, label: 'Statistics' },
    ]

    return [
      { label: 'Dashboard', items: [{ to: dashboardPath, label: 'Dashboard' }] },
      { label: 'Classes', items: classItems },
      { label: 'Exams', items: examItems },
      { label: 'Reports', items: reportItems },
    ]
  }, [basePath, dashboardPath, role])

  const accountItems = useMemo(() => {
    const items = [{ to: `${basePath}/profile`, label: 'Profile' }]
    if (role === 'ADMIN') {
      items.unshift({ to: '/admin/users', label: 'Users' })
    }
    items.push({ action: 'logout', label: 'Log out' })
    return items
  }, [basePath, role])

  const handleLogout = () => {
    setAuth(emptyAuth)
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <p className="eyebrow">ExamPortal</p>
          <strong>Online Exam MVP</strong>
        </div>

        <nav className="topbar-nav" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group">
              <div className="nav-group-trigger">{group.label}</div>
              <div className="nav-group-menu">
                {group.items.map((item) => (
                  item.to ? (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => (isActive ? 'nav-menu-item active' : 'nav-menu-item')}
                    >
                      {item.label}
                    </NavLink>
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      className="nav-menu-item nav-menu-button"
                      onClick={handleLogout}
                    >
                      {item.label}
                    </button>
                  )
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="topbar-account nav-group">
          <div className="topbar-account-trigger">
            <div className="topbar-user">
              <strong>{auth.user.fullName}</strong>
              <span>{auth.user.email}</span>
            </div>
            <span className="pill">{auth.user.role}</span>
          </div>
          <div className="nav-group-menu nav-group-menu-right">
            {accountItems.map((item) => (
              item.to ? (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-menu-item active' : 'nav-menu-item')}
                >
                  {item.label}
                </NavLink>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className="nav-menu-item nav-menu-button"
                  onClick={handleLogout}
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

export default Shell
