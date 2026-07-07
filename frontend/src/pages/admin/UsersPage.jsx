import { CrudPage } from '../../components/CommonUI'

export default function UsersPage() {
  return <CrudPage title="Users" endpoint="/users" fields={['fullName', 'email', 'role', 'status']} />
}
