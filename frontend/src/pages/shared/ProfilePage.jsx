import { useState } from 'react'
import { PageSection } from '../../components/CommonUI'
import { api } from '../../lib/appCore'

export default function ProfilePage({ auth, setAuth }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [message, setMessage] = useState('')

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    await api.post('/auth/change-password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    setMessage('Password changed successfully.')
    setForm({ currentPassword: '', newPassword: '' })
  }

  const refreshProfile = async () => {
    const { data } = await api.get('/auth/me')
    setAuth((prev) => ({ ...prev, user: data }))
  }

  return (
    <PageSection title="Profile" description="View current identity details and change password.">
      <div className="two-column">
        <div className="panel stack">
          <h3>Account</h3>
          <p>Name: {auth.user.fullName}</p>
          <p>Email: {auth.user.email}</p>
          <p>Role: {auth.user.role}</p>
          <button type="button" className="ghost-button" onClick={refreshProfile}>Refresh profile</button>
        </div>
        <form className="panel stack" onSubmit={handlePasswordChange}>
          <h3>Change Password</h3>
          <label>
            Current password
            <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
          </label>
          <label>
            New password
            <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
          </label>
          {message ? <p className="success-text">{message}</p> : null}
          <button type="submit" className="primary-button">Update password</button>
        </form>
      </div>
    </PageSection>
  )
}
