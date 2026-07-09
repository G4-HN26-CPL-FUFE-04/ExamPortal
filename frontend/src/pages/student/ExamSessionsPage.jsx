import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageSection } from '../../components/CommonUI'
import { api } from '../../lib/appCore'

const studentBasePath = '/student'

export default function ExamSessionsPage() {
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/exam-sessions')
      .then(({ data }) => setSessions(data))
      .catch(() => setError('Unable to load exam sessions.'))
  }, [])

  return (
    <PageSection title="Exam Sessions" description="Browse scheduled exams and open the active ones.">
      {error ? <p className="error-text">{error}</p> : null}
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
            {session.classroomNames?.length ? <p>Classes: {session.classroomNames.join(', ')}</p> : null}
            <p>Review after submit: {session.showAnswersAfterSubmit ? 'Show correct answers' : 'Score only'}</p>
            <Link to={`${studentBasePath}/exam-sessions/${session.id}`} className="primary-link">Open details</Link>
          </article>
        ))}
      </div>
      {!sessions.length && !error ? <div className="panel"><p className="muted">No exam sessions available for your approved classes.</p></div> : null}
    </PageSection>
  )
}
