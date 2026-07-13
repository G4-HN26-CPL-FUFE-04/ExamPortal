import { InfoGrid, PageSection } from '../../components/CommonUI'

export default function TeacherDashboardPage() {
  return (
    <PageSection title="Teacher Dashboard" description="Manage your classes, question banks, exams, and student results.">
      <InfoGrid
        items={[
          ['Classes', 'Create classes, approve students, and assign exam sessions'],
          ['Learning content', 'Manage your subjects, question banks, and exam drafts'],
          ['Results', 'Review attempts and statistics for your own exam sessions'],
        ]}
      />
    </PageSection>
  )
}
