import { useEffect, useState } from 'react'
import { PageSection } from '../../components/CommonUI'
import { api } from '../../lib/appCore'

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [error, setError] = useState('')

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users', {
        params: {
          keyword: keyword.trim() || undefined,
          status: statusFilter || undefined,
          role: roleFilter || undefined,
        },
      })
      setUsers(data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load accounts')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [statusFilter, roleFilter])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const editUser = (user) => {
    setEditingId(user.id)
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      ...form,
      password: form.password.trim() || null,
    }

    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, payload)
      } else {
        await api.post('/users', payload)
      }
      resetForm()
      await loadUsers()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save account')
    }
  }

  const toggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    try {
      await api.patch(`/users/${user.id}/status`, null, { params: { status: nextStatus } })
      await loadUsers()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update account status')
    }
  }

  return (
    <PageSection title="Account management" description="Create accounts, assign roles, edit profiles, and lock or unlock access.">
      {error ? <div className="panel"><span className="pill danger">{error}</span></div> : null}

      <div className="two-column">
        <form className="panel stack" onSubmit={handleSubmit}>
          <div className="row-between">
            <h3>{editingId ? 'Edit account' : 'Create account'}</h3>
            {editingId ? <button type="button" className="ghost-button" onClick={resetForm}>Cancel</button> : null}
          </div>

          <label>
            Full name
            <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label>
            {editingId ? 'New password (leave blank to keep current)' : 'Password'}
            <input type="password" minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editingId} />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="LOCKED">Locked</option>
            </select>
          </label>
          <button type="submit" className="primary-button">{editingId ? 'Save changes' : 'Create account'}</button>
        </form>

        <div className="panel stack">
          <h3>Find accounts</h3>
          <label>
            Name or email
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadUsers()} />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="LOCKED">Locked</option>
            </select>
          </label>
          <label>
            Role
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">All roles</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </select>
          </label>
          <button type="button" className="ghost-button" onClick={loadUsers}>Search</button>
        </div>
      </div>

      <div className="table-wrap panel">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td><span className="pill">{user.role}</span></td>
                <td><span className={`pill ${user.status === 'ACTIVE' ? 'success' : 'danger'}`}>{user.status}</span></td>
                <td>
                  <div className="action-row">
                    <button type="button" className="ghost-button" onClick={() => editUser(user)}>Edit</button>
                    <button type="button" className={user.status === 'ACTIVE' ? 'danger-button ghost-button' : 'ghost-button'} onClick={() => toggleStatus(user)}>
                      {user.status === 'ACTIVE' ? 'Lock' : 'Unlock'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  )
}
