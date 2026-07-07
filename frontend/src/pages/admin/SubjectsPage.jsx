import { CrudPage } from '../../components/CommonUI'

export default function SubjectsPage() {
  return <CrudPage title="Subjects" endpoint="/subjects" fields={['name', 'description']} />
}
