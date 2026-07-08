import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageSection } from '../../components/CommonUI'
import { api, toSubjectSlug } from '../../lib/appCore'

function getManagerBasePath() {
  return window.location.pathname.startsWith('/instructor') ? '/instructor' : '/admin'
}

const emptyForm = { name: '' }

export default function SubjectsPage() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showCreatePopover, setShowCreatePopover] = useState(false)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const createPopoverRef = useRef(null)
  const pendingSubjectSlugRef = useRef(null)
  const basePath = getManagerBasePath()

  const sortedSubjects = useMemo(
    () => [...subjects].sort((left, right) => left.name.localeCompare(right.name)),
    [subjects],
  )

  const loadSubjects = async () => {
    const { data } = await api.get('/subjects')
    setSubjects(data)
  }

  useEffect(() => {
    loadSubjects().catch(() => setError('Unable to load subjects.'))
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.post('/subjects', { name: form.name.trim() })
      setMessage('Subject created.')
      resetForm()
      setShowCreatePopover(false)
      await loadSubjects()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save subject.')
    }
  }

  const handleDelete = async (subject) => {
    setError('')
    setMessage('')
    try {
      await api.delete(`/subjects/${subject.id}`)
      setMessage('Subject deleted.')
      setSubjects((prev) => prev.filter((item) => item.id !== subject.id))
      setConfirmingDeleteId(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete subject.')
    }
  }

  useEffect(() => {
    if (!showCreatePopover) return undefined

    const handlePointerDown = (event) => {
      if (!createPopoverRef.current?.contains(event.target)) {
        setShowCreatePopover(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showCreatePopover])

  return (
    <PageSection title="Subjects" description="Open a subject to manage its question banks and questions.">
      <div className="stack">
        <div className="row-between wrap-row">
          <div>
            {error ? <p className="error-text">{error}</p> : null}
            {message ? <p className="success-text">{message}</p> : null}
          </div>
          <div className="subject-create-anchor" ref={createPopoverRef}>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setShowCreatePopover((prev) => !prev)
                setError('')
                setMessage('')
                resetForm()
              }}
            >
              Create Subject
            </button>

            {showCreatePopover ? (
              <div className="subject-create-popover panel">
                <form className="stack" onSubmit={handleSubmit}>
                  <h3>Create subject</h3>
                  <label>
                    Subject name
                    <input
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                      autoFocus
                    />
                  </label>

                  <div className="action-row">
                    <button type="submit" className="primary-button">
                      Create
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setShowCreatePopover(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>

        <div className="card-grid">
          {sortedSubjects.map((subject) => (
            <article
              key={subject.id}
              className="panel stack subject-card"
              onClick={() => {
                pendingSubjectSlugRef.current = toSubjectSlug(subject.name)
                navigate(`${basePath}/subjects/${toSubjectSlug(subject.name)}`)
              }}
            >
              <div className="row-between wrap-row">
                <div>
                  <h3>{subject.name}</h3>
                  <div className="question-meta">
                    <span className="pill">{subject.questionBankCount ?? 0} banks</span>
                    <span className="pill">{subject.totalQuestionCount ?? 0} questions</span>
                  </div>
                </div>
                <div className="action-row subject-create-anchor">
                  <button
                    type="button"
                    className="ghost-button danger-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setConfirmingDeleteId((prev) => (prev === subject.id ? null : subject.id))
                    }}
                  >
                    Delete
                  </button>

                  {confirmingDeleteId === subject.id ? (
                    <div className="confirm-popover panel" onClick={(event) => event.stopPropagation()}>
                      <p className="muted">Deleting this subject will remove all banks, questions, and related exam data.</p>
                      <div className="action-row">
                        <button type="button" className="ghost-button" onClick={() => setConfirmingDeleteId(null)}>
                          Cancel
                        </button>
                        <button type="button" className="ghost-button danger-button" onClick={() => handleDelete(subject)}>
                          Confirm delete
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        {!sortedSubjects.length ? <p className="muted">No subjects yet.</p> : null}
      </div>
    </PageSection>
  )
}
