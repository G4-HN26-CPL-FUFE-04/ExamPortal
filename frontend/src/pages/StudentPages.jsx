import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DataTable, InfoGrid, LoadingPanel, PageSection, StatsCards } from '../components/CommonUI'
import { api, formatDate, formatTimer } from '../lib/appCore'

export function DashboardPage({ auth }) {
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

export function ExamSessionsPage() {
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

export function ExamSessionDetailPage() {
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

export function AttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [selected, setSelected] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef(null)

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

export function ResultPage() {
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
          </article>
        ))}
      </div>
    </PageSection>
  )
}

export function MyAttemptsPage() {
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

export function ProfilePage({ auth, setAuth }) {
  const [form, setForm] = useState({
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
    setForm({ currentPassword: '', newPassword: '' })
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
