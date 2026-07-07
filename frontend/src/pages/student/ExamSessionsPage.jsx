import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageSection } from '../../components/CommonUI'
import { api } from '../../lib/appCore'

const studentBasePath = '/student'

export default function ExamSessionsPage() {
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
            <Link to={`${studentBasePath}/exam-sessions/${session.id}`} className="primary-link">Open details</Link>
          </article>
        ))}
      </div>
    </PageSection>
  )
}
