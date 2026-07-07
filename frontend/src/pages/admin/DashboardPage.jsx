import { InfoGrid, PageSection } from '../../components/CommonUI'

export default function DashboardPage() {
  return (
    <PageSection title="Admin Area" description="Management entry point for questions, exams, sessions, attempts, and statistics.">
      <InfoGrid
        items={[
          ['User management', 'Search, assign roles, lock or unlock accounts'],
          ['Content management', 'Subjects, question bank, exams, sessions'],
          ['Monitoring', 'Attempts, result review, and basic dashboard statistics'],
        ]}
      />
    </PageSection>
  )
}
