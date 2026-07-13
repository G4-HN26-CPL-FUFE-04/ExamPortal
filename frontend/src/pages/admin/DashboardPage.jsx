import { InfoGrid, PageSection } from '../../components/CommonUI'

export default function DashboardPage() {
  return (
    <PageSection title="Admin Area" description="Manage platform accounts and access roles.">
      <InfoGrid
        items={[
          ['User management', 'Search, assign roles, lock or unlock accounts'],
          ['Role management', 'Assign Admin, Teacher, or Student access'],
          ['Account security', 'Lock or unlock access without deleting learning records'],
        ]}
      />
    </PageSection>
  )
}
