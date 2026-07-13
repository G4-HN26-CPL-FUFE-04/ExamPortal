import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, normalizeAuth } from '../lib/appCore'

function getDefaultRouteForRole(role) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'TEACHER') return '/teacher'
  return '/student'
}

function AuthPage({ mode, setAuth }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isLogin = mode === 'login'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload = isLogin ? { email: form.email, password: form.password } : form
      const { data } = await api.post(endpoint, payload)
      const normalizedAuth = normalizeAuth(data)
      setAuth(normalizedAuth)
      navigate(getDefaultRouteForRole(normalizedAuth.user.role))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to authenticate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-panel auth-hero">
        <p className="eyebrow">ExamPortal</p>
        <h1>Exam management and online testing in one flow</h1>
        <p>
          Instructors build question banks and exam sessions. Students join scheduled exams,
          answer 4-option multiple-choice questions, and receive automatic scores.
        </p>
      </section>

      <section className="auth-panel">
        <h2>{isLogin ? 'Login' : 'Create student account'}</h2>
        <form className="stack" onSubmit={handleSubmit}>
          {!isLogin && (
            <label>
              Full name
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="muted">
          {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Register here' : 'Go to login'}</Link>
        </p>
      </section>
    </div>
  )
}

export default AuthPage
