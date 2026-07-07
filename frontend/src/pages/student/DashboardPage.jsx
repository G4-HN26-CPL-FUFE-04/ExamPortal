import { InfoGrid, PageSection } from '../../components/CommonUI'

export default function DashboardPage({ auth }) {
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

  return null
}
