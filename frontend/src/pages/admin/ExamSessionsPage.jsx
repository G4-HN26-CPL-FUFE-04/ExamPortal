import { useEffect, useState } from 'react'
import { DataTable, PageSection } from '../../components/CommonUI'
import { api, formatDate } from '../../lib/appCore'

export default function ExamSessionsPage() {
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
