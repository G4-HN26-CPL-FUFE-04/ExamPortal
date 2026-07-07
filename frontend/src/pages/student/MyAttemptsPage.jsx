import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, PageSection } from '../../components/CommonUI'
import { api, formatDate } from '../../lib/appCore'

const studentBasePath = '/student'

export default function MyAttemptsPage() {
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    api.get('/my-attempts').then(({ data }) => setAttempts(data))
  }, [])

  return (
    <PageSection title="Attempt History" description="Review your previous exam submissions and scores.">
      <DataTable
        columns={['Exam', 'Session', 'Status', 'Score', 'Started', 'Submitted', 'Actions']}
        rows={attempts.map((attempt) => [
          attempt.examTitle,
          attempt.sessionTitle,
          attempt.status,
          `${attempt.score} / 10`,
          formatDate(attempt.startedAt),
          formatDate(attempt.submittedAt),
          attempt.status === 'IN_PROGRESS'
            ? <Link key={attempt.id} to={`${studentBasePath}/attempts/${attempt.id}`}>Continue attempt</Link>
            : <Link key={attempt.id} to={`${studentBasePath}/results/${attempt.id}`}>View result</Link>,
        ])}
      />
    </PageSection>
  )
}
