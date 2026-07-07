import { useEffect, useState } from 'react'
import { DataTable, PageSection, StatsCards } from '../../components/CommonUI'
import { api } from '../../lib/appCore'

export default function StatisticsPage() {
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
          ['Total questions', questionStats?.totalQuestions ?? 0],
          ['Subjects', questionStats?.totalSubjects ?? 0],
        ]}
      />
      <DataTable
        columns={['Session', 'Average score', 'Highest', 'Lowest', 'Participation']}
        rows={examStats.map((item) => [item.sessionTitle, item.averageScore, item.highestScore, item.lowestScore, item.participationCount])}
      />
    </PageSection>
  )
}
