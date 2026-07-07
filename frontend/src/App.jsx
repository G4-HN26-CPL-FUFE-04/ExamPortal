import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const authStorageKey = 'examportal-auth'
const api = axios.create({ baseURL: API_BASE_URL })

function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem(authStorageKey)
    return saved ? JSON.parse(saved) : { token: '', user: null }
  })

  useEffect(() => {
    if (auth?.token) {
      localStorage.setItem(authStorageKey, JSON.stringify(auth))
    } else {
      localStorage.removeItem(authStorageKey)
    }
  }, [auth])

  useEffect(() => {
    api.defaults.headers.common.Authorization = auth?.token ? `Bearer ${auth.token}` : ''
  }, [auth])

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" setAuth={setAuth} />} />
      <Route path="/register" element={<AuthPage mode="register" setAuth={setAuth} />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute auth={auth}>
            <Shell auth={auth} setAuth={setAuth} />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function ProtectedRoute({ auth, children }) {
  if (!auth?.token || !auth?.user) {
    return <Navigate to="/login" replace />
  }
  return children
}

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
      { to: '/admin/topics', label: 'Topics' },
      { to: '/admin/questions', label: 'Questions' },
      { to: '/admin/exams', label: 'Exams' },
      { to: '/admin/exam-sessions', label: 'Exam Sessions' },
      { to: '/admin/results', label: 'Results' },
      { to: '/admin/statistics', label: 'Statistics' },
    ]
  }, [isAdminArea])

  const handleLogout = () => {
    setAuth({ token: '', user: null })
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
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage auth={auth} />} />
          <Route path="/exam-sessions" element={<ExamSessionsPage />} />
          <Route path="/exam-sessions/:id" element={<ExamSessionDetailPage />} />
          <Route path="/attempts/:id" element={<AttemptPage />} />
          <Route path="/results/:id" element={<ResultPage />} />
          <Route path="/my-attempts" element={<MyAttemptsPage />} />
          <Route path="/profile" element={<ProfilePage auth={auth} setAuth={setAuth} />} />
          <Route path="/admin" element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><AdminHomePage /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute auth={auth} roles={['ADMIN']}><UsersPage /></RoleRoute>} />
          <Route path="/admin/subjects" element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><SubjectsPage /></RoleRoute>} />
          <Route path="/admin/topics" element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><TopicsPage /></RoleRoute>} />
          <Route path="/admin/questions" element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><QuestionsPage /></RoleRoute>} />
          <Route path="/admin/exams" element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><ExamsPage /></RoleRoute>} />
          <Route path="/admin/exam-sessions" element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><AdminSessionsPage /></RoleRoute>} />
          <Route path="/admin/results" element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><ResultsMonitorPage /></RoleRoute>} />
          <Route path="/admin/statistics" element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><StatisticsPage /></RoleRoute>} />
        </Routes>
      </main>
    </div>
  )
}

function RoleRoute({ auth, roles, children }) {
  if (!roles.includes(auth.user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AuthPage({ mode, setAuth }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isLogin = mode === 'login'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload = isLogin ? { email: form.email, password: form.password } : form
      const { data } = await api.post(endpoint, payload)
      setAuth(data)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to authenticate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-panel auth-hero">
        <p className="eyebrow">ExamPortal</p>
        <h1>Exam management and online testing in one flow</h1>
        <p>
          Instructors build question banks and exam sessions. Students join scheduled exams,
          answer 4-option multiple-choice questions, and receive automatic scores.
        </p>
        <div className="auth-callout">
          <strong>Seed accounts</strong>
          <span>`admin@examportal.local` / `Admin@123`</span>
          <span>`instructor@examportal.local` / `Instructor@123`</span>
          <span>`student@examportal.local` / `Student@123`</span>
        </div>
      </section>

      <section className="auth-panel">
        <h2>{isLogin ? 'Login' : 'Create student account'}</h2>
        <form className="stack" onSubmit={handleSubmit}>
          {!isLogin && (
            <label>
              Full name
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="muted">
          {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Register here' : 'Go to login'}</Link>
        </p>
      </section>
    </div>
  )
}

function DashboardPage({ auth }) {
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    if (auth.user.role === 'STUDENT') return
    api.get('/dashboard/overview').then(({ data }) => setOverview(data)).catch(() => {})
  }, [auth.user.role])

  if (auth.user.role === 'STUDENT') {
    return (
      <PageSection title="Student Dashboard" description="Quick access to available exam sessions, results, and your profile.">
        <InfoGrid
          items={[
            ['Core scope', 'Exam sessions, online attempts, automatic grading'],
            ['Question rule', 'Single correct answer with exactly 4 options'],
            ['Your next step', 'Open Exam Sessions and start an active test'],
          ]}
        />
      </PageSection>
    )
  }

  return (
    <PageSection title="Admin Dashboard" description="System-wide overview for the MVP exam platform.">
      <StatsCards
        stats={[
          ['Users', overview?.totalUsers ?? 0],
          ['Students', overview?.totalStudents ?? 0],
          ['Instructors', overview?.totalInstructors ?? 0],
          ['Questions', overview?.totalQuestions ?? 0],
          ['Exams', overview?.totalExams ?? 0],
          ['Sessions', overview?.totalExamSessions ?? 0],
          ['Attempts', overview?.totalAttempts ?? 0],
        ]}
      />
    </PageSection>
  )
}

function ExamSessionsPage() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    api.get('/exam-sessions').then(({ data }) => setSessions(data))
  }, [])

  return (
    <PageSection title="Exam Sessions" description="Browse scheduled exams and open the active ones.">
      <div className="card-grid">
        {sessions.map((session) => (
          <article key={session.id} className="panel">
            <div className="row-between">
              <h3>{session.title}</h3>
              <span className="pill">{session.status}</span>
            </div>
            <p className="muted">{session.examTitle}</p>
            <p>Duration: {session.durationMinutes} minutes</p>
            <p>Questions: {session.questionCount}</p>
            <p>Attempts allowed: {session.maxAttempts}</p>
            <Link to={`/exam-sessions/${session.id}`} className="primary-link">Open details</Link>
          </article>
        ))}
      </div>
    </PageSection>
  )
}

function ExamSessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/exam-sessions/${id}`).then(({ data }) => setSession(data))
  }, [id])

  const handleStart = async () => {
    setError('')
    try {
      const { data } = await api.post(`/exam-sessions/${id}/start`)
      navigate(`/attempts/${data.id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to start this exam.')
    }
  }

  if (!session) return <LoadingPanel />

  return (
    <PageSection title={session.title} description="Session detail page for online participation.">
      <div className="panel stack">
        <InfoGrid
          items={[
            ['Exam', session.examTitle],
            ['Open time', formatDate(session.openTime)],
            ['Close time', formatDate(session.closeTime)],
            ['Duration', `${session.durationMinutes} minutes`],
            ['Question count', session.questionCount],
            ['Attempt rule', `${session.maxAttempts} attempts max`],
          ]}
        />
        {error ? <p className="error-text">{error}</p> : null}
        <button type="button" className="primary-button" onClick={handleStart} disabled={session.status !== 'ACTIVE'}>
          Start Exam
        </button>
      </div>
    </PageSection>
  )
}

function AttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [selected, setSelected] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    api.get(`/attempts/${id}`).then(({ data }) => {
      setAttempt(data)
      setSecondsLeft(Math.max((data.durationMinutes || 1) * 60, 60))
    })
  }, [id])

  useEffect(() => {
    if (!attempt?.questions?.length) return undefined
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(timerRef.current)
  }, [attempt])

  const handleSelect = (questionId, optionId) => {
    setSelected((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = async (autoSubmitted = false) => {
    const payload = {
      autoSubmitted,
      answers: Object.entries(selected).map(([questionId, selectedOptionId]) => ({
        questionId: Number(questionId),
        selectedOptionId,
      })),
    }
    const { data } = await api.post(`/attempts/${id}/submit`, payload)
    navigate(`/results/${data.id}`)
  }

  if (!attempt) return <LoadingPanel />

  const question = attempt.questions[currentIndex]

  return (
    <PageSection title={attempt.examTitle} description="Attempt page with countdown, navigation, and quick question palette.">
      <div className="attempt-layout">
        <section className="panel stack">
          <div className="row-between">
            <strong>Question {currentIndex + 1} / {attempt.questions.length}</strong>
            <span className="timer">{formatTimer(secondsLeft)}</span>
          </div>
          <h3>{question.content}</h3>
          <div className="stack">
            {question.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={selected[question.questionId] === option.id ? 'option-button active' : 'option-button'}
                onClick={() => handleSelect(question.questionId, option.id)}
              >
                <strong>{option.label}.</strong> {option.content}
              </button>
            ))}
          </div>
          <div className="row-between">
            <button type="button" className="ghost-button" onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}>
              Previous
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, attempt.questions.length - 1))}
            >
              Next
            </button>
          </div>
        </section>

        <aside className="panel stack">
          <h3>Question Palette</h3>
          <div className="palette">
            {attempt.questions.map((item, index) => (
              <button
                key={item.questionId}
                type="button"
                className={currentIndex === index ? 'palette-item active' : 'palette-item'}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button type="button" className="primary-button" onClick={() => handleSubmit(false)}>
            Submit Exam
          </button>
        </aside>
      </div>
    </PageSection>
  )
}

function ResultPage() {
  const { id } = useParams()
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.get(`/attempts/${id}`).then(({ data }) => setResult(data))
  }, [id])

  if (!result) return <LoadingPanel />

  return (
    <PageSection title="Result Review" description="Detailed score summary and answer review for the submitted attempt.">
      <StatsCards
        stats={[
          ['Score', result.score],
          ['Correct', result.correctAnswers],
          ['Wrong', result.wrongAnswers],
          ['Unanswered', result.unansweredAnswers],
          ['Time spent', `${result.completionSeconds || 0}s`],
        ]}
      />
      <div className="stack">
        {result.answerReview.map((answer) => (
          <article key={answer.questionId} className="panel stack">
            <div className="row-between">
              <h3>{answer.content}</h3>
              <span className={answer.correct ? 'pill success' : 'pill danger'}>
                {answer.correct ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p>Selected answer: {answer.selectedLabel || 'Unanswered'}</p>
            <p>Correct answer: {answer.correctLabel}</p>
            <p className="muted">{answer.explanation || 'No explanation provided.'}</p>
          </article>
        ))}
      </div>
    </PageSection>
  )
}

function MyAttemptsPage() {
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    api.get('/my-attempts').then(({ data }) => setAttempts(data))
  }, [])

  return (
    <PageSection title="Attempt History" description="Review your previous exam submissions and scores.">
      <DataTable
        columns={['Exam', 'Session', 'Status', 'Score', 'Actions']}
        rows={attempts.map((attempt) => [
          attempt.examTitle,
          attempt.sessionTitle,
          attempt.status,
          attempt.score,
          <Link key={attempt.id} to={`/results/${attempt.id}`}>View result</Link>,
        ])}
      />
    </PageSection>
  )
}

function ProfilePage({ auth, setAuth }) {
  const [form, setForm] = useState({
    fullName: auth.user.fullName,
    email: auth.user.email,
    currentPassword: '',
    newPassword: '',
  })
  const [message, setMessage] = useState('')

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    await api.post('/auth/change-password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    setMessage('Password changed successfully.')
  }

  const refreshProfile = async () => {
    const { data } = await api.get('/auth/me')
    setAuth((prev) => ({ ...prev, user: data }))
  }

  return (
    <PageSection title="Profile" description="View current identity details and change password.">
      <div className="two-column">
        <div className="panel stack">
          <h3>Account</h3>
          <p>Name: {auth.user.fullName}</p>
          <p>Email: {auth.user.email}</p>
          <p>Role: {auth.user.role}</p>
          <button type="button" className="ghost-button" onClick={refreshProfile}>Refresh profile</button>
        </div>
        <form className="panel stack" onSubmit={handlePasswordChange}>
          <h3>Change Password</h3>
          <label>
            Current password
            <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
          </label>
          <label>
            New password
            <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
          </label>
          {message ? <p className="success-text">{message}</p> : null}
          <button type="submit" className="primary-button">Update password</button>
        </form>
      </div>
    </PageSection>
  )
}

function AdminHomePage() {
  return (
    <PageSection title="Admin Area" description="Management entry point for questions, exams, sessions, attempts, and statistics.">
      <InfoGrid
        items={[
          ['User management', 'Search, assign roles, lock or unlock accounts'],
          ['Content management', 'Subjects, topics, question bank, exams, sessions'],
          ['Monitoring', 'Attempts, result review, and basic dashboard statistics'],
        ]}
      />
    </PageSection>
  )
}

function UsersPage() {
  return <CrudPage title="Users" endpoint="/users" fields={['fullName', 'email', 'role', 'status']} />
}

function SubjectsPage() {
  return <CrudPage title="Subjects" endpoint="/subjects" fields={['name', 'description']} />
}

function TopicsPage() {
  return <CrudPage title="Topics" endpoint="/topics" fields={['name', 'description', 'subjectId']} />
}

function QuestionsPage() {
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    api.get('/questions').then(({ data }) => setQuestions(data))
  }, [])

  return (
    <PageSection title="Question Bank" description="Preview question content, difficulty, topic, and enable/disable state.">
      <DataTable
        columns={['Content', 'Difficulty', 'Status', 'Subject', 'Topic']}
        rows={questions.map((item) => [item.content, item.difficulty, item.status, item.subjectName, item.topicName])}
      />
    </PageSection>
  )
}

function ExamsPage() {
  const [exams, setExams] = useState([])

  useEffect(() => {
    api.get('/exams').then(({ data }) => setExams(data))
  }, [])

  return (
    <PageSection title="Exam Management" description="Review exam status, duration, score configuration, and question count.">
      <DataTable
        columns={['Title', 'Subject', 'Duration', 'Total Score', 'Status', 'Questions']}
        rows={exams.map((exam) => [exam.title, exam.subjectName, `${exam.durationMinutes} min`, exam.totalScore, exam.status, exam.questionCount])}
      />
    </PageSection>
  )
}

function AdminSessionsPage() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    api.get('/exam-sessions').then(({ data }) => setSessions(data))
  }, [])

  return (
    <PageSection title="Session Management" description="Scheduled exam instances with open/close times and attempt rules.">
      <DataTable
        columns={['Title', 'Exam', 'Status', 'Duration', 'Attempts', 'Window']}
        rows={sessions.map((session) => [
          session.title,
          session.examTitle,
          session.status,
          `${session.durationMinutes} min`,
          session.maxAttempts,
          `${formatDate(session.openTime)} - ${formatDate(session.closeTime)}`,
        ])}
      />
    </PageSection>
  )
}

function ResultsMonitorPage() {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState('')
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    api.get('/exam-sessions').then(({ data }) => {
      setSessions(data)
      if (data[0]) setSelectedSession(String(data[0].id))
    })
  }, [])

  useEffect(() => {
    if (!selectedSession) return
    api.get(`/exam-sessions/${selectedSession}/attempts`).then(({ data }) => setAttempts(data))
  }, [selectedSession])

  return (
    <PageSection title="Attempt Monitoring" description="Review result details by exam session.">
      <div className="panel stack">
        <label>
          Select session
          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>{session.title}</option>
            ))}
          </select>
        </label>
      </div>
      <DataTable
        columns={['Exam', 'Session', 'Status', 'Score', 'Started', 'Submitted']}
        rows={attempts.map((attempt) => [
          attempt.examTitle,
          attempt.sessionTitle,
          attempt.status,
          attempt.score,
          formatDate(attempt.startedAt),
          formatDate(attempt.submittedAt),
        ])}
      />
    </PageSection>
  )
}

function StatisticsPage() {
  const [overview, setOverview] = useState(null)
  const [examStats, setExamStats] = useState([])
  const [questionStats, setQuestionStats] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/exam-stats'),
      api.get('/dashboard/question-stats'),
    ]).then(([overviewRes, examRes, questionRes]) => {
      setOverview(overviewRes.data)
      setExamStats(examRes.data)
      setQuestionStats(questionRes.data)
    })
  }, [])

  return (
    <PageSection title="Statistics" description="Basic system reporting for the first version MVP.">
      <StatsCards
        stats={[
          ['Users', overview?.totalUsers ?? 0],
          ['Attempts', overview?.totalAttempts ?? 0],
          ['Enabled questions', questionStats?.enabledQuestions ?? 0],
          ['Disabled questions', questionStats?.disabledQuestions ?? 0],
        ]}
      />
      <DataTable
        columns={['Session', 'Average score', 'Highest', 'Lowest', 'Participation']}
        rows={examStats.map((item) => [item.sessionTitle, item.averageScore, item.highestScore, item.lowestScore, item.participationCount])}
      />
    </PageSection>
  )
}

function CrudPage({ title, endpoint, fields }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((field) => [field, ''])))

  const loadItems = async () => {
    const { data } = await api.get(endpoint)
    setItems(data)
  }

  useEffect(() => {
    loadItems()
  }, [endpoint])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await api.post(endpoint, normalizeCrudPayload(form))
    setForm(Object.fromEntries(fields.map((field) => [field, ''])))
    loadItems()
  }

  return (
    <PageSection title={title} description={`Minimal CRUD screen for ${title.toLowerCase()}.`}>
      <div className="two-column">
        <form className="panel stack" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <label key={field}>
              {field}
              <input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required />
            </label>
          ))}
          <button type="submit" className="primary-button">Create</button>
        </form>
        <div className="panel">
          <pre className="json-preview">{JSON.stringify(items, null, 2)}</pre>
        </div>
      </div>
    </PageSection>
  )
}

function PageSection({ title, description, children }) {
  const location = useLocation()
  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{location.pathname}</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

function StatsCards({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map(([label, value]) => (
        <article key={label} className="panel stat-card">
          <span className="muted">{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  )
}

function InfoGrid({ items }) {
  return (
    <div className="stats-grid">
      {items.map(([label, value]) => (
        <article key={label} className="panel stat-card">
          <span className="muted">{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  )
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap panel">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoadingPanel() {
  return (
    <div className="panel">
      <p>Loading...</p>
    </div>
  )
}

function normalizeCrudPayload(form) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => {
      if (key.toLowerCase().includes('id') && value !== '') return [key, Number(value)]
      return [key, value]
    }),
  )
}

function formatDate(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
}

function formatTimer(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default App
