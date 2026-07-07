import { useEffect, useState } from 'react'
import { DataTable, PageSection } from '../../components/CommonUI'
import { api, formatDate } from '../../lib/appCore'

export default function ResultsPage() {
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
