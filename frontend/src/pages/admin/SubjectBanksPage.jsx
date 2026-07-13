import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageSection } from '../../components/CommonUI'
import { api, toQuestionBankSlug, toSubjectSlug } from '../../lib/appCore'

function getManagerBasePath() {
  return '/teacher'
}

const emptyForm = { name: '' }

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M4 20l4.2-1 9.1-9.1-3.2-3.2L5 15.8 4 20zm12.6-14.9 2.3 2.3 1.1-1.1a1.6 1.6 0 000-2.3l-.1-.1a1.6 1.6 0 00-2.3 0l-1 1.2z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function SubjectBanksPage() {
  const { subjectSlug } = useParams()
  const navigate = useNavigate()
  const basePath = getManagerBasePath()
  const [subjects, setSubjects] = useState([])
  const [subjectsLoaded, setSubjectsLoaded] = useState(false)
  const [banks, setBanks] = useState([])
  const [banksLoaded, setBanksLoaded] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [showCreatePopover, setShowCreatePopover] = useState(false)
  const [isEditingSubjectName, setIsEditingSubjectName] = useState(false)
  const [subjectNameDraft, setSubjectNameDraft] = useState('')
  const [confirmingDeleteBankId, setConfirmingDeleteBankId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const createPopoverRef = useRef(null)
  const pendingSubjectSlugRef = useRef(null)

  const selectedSubject = useMemo(
    () => {
      const activeSlug = pendingSubjectSlugRef.current || subjectSlug
      return subjects.find((subject) => toSubjectSlug(subject.name) === activeSlug)
    },
    [subjects, subjectSlug],
  )

  const sortedBanks = useMemo(
    () => [...banks].sort((left, right) => left.name.localeCompare(right.name)),
    [banks],
  )

  const loadSubjects = async () => {
    const { data } = await api.get('/subjects')
    setSubjects(data)
    setSubjectsLoaded(true)
  }

  const loadBanks = async (subjectId) => {
    const { data } = await api.get('/question-banks', { params: { subjectId } })
    setBanks(data)
    setBanksLoaded(true)
  }

  useEffect(() => {
    loadSubjects().catch(() => {
      setSubjectsLoaded(true)
      setError('Unable to load subjects.')
    })
  }, [])

  useEffect(() => {
    if (pendingSubjectSlugRef.current === subjectSlug) {
      pendingSubjectSlugRef.current = null
    }
  }, [subjectSlug])

  useEffect(() => {
    if (subjectsLoaded && subjects.length && !selectedSubject) {
      navigate(`${basePath}/subjects`, { replace: true })
    }
  }, [basePath, navigate, selectedSubject, subjects, subjectsLoaded])

  useEffect(() => {
    if (!selectedSubject) return
    setSubjectNameDraft(selectedSubject.name)
    setBanksLoaded(false)
    loadBanks(selectedSubject.id).catch(() => {
      setBanksLoaded(true)
      setError('Unable to load question banks.')
    })
  }, [selectedSubject?.id, selectedSubject?.name])

  const resetForm = () => {
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedSubject) return
    setError('')
    setMessage('')
    try {
      const payload = {
        name: form.name.trim(),
        subjectId: selectedSubject.id,
      }
      const { data } = await api.post('/question-banks', payload)
      setBanks((prev) => [...prev, data])
      setSubjects((prev) => prev.map((subject) => (
        subject.id === selectedSubject.id
          ? { ...subject, questionBankCount: (subject.questionBankCount ?? 0) + 1 }
          : subject
      )))
      setMessage('Question bank created.')
      resetForm()
      setShowCreatePopover(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save question bank.')
    }
  }

  const handleSubjectRename = async (event) => {
    event.preventDefault()
    if (!selectedSubject) return
    setError('')
    setMessage('')
    try {
      const { data } = await api.put(`/subjects/${selectedSubject.id}`, {
        name: subjectNameDraft.trim(),
      })
      pendingSubjectSlugRef.current = toSubjectSlug(data.name)
      setSubjects((prev) => prev.map((subject) => (subject.id === data.id ? data : subject)))
      setMessage('Subject updated.')
      setIsEditingSubjectName(false)
      navigate(`${basePath}/subjects/${toSubjectSlug(data.name)}`, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save subject.')
    }
  }

  const handleDelete = async (bank) => {
    setError('')
    setMessage('')
    try {
      await api.delete(`/question-banks/${bank.id}`)
      setBanks((prev) => prev.filter((item) => item.id !== bank.id))
      setSubjects((prev) => prev.map((subject) => (
        subject.id === selectedSubject.id
          ? {
              ...subject,
              questionBankCount: Math.max(0, (subject.questionBankCount ?? 0) - 1),
              totalQuestionCount: Math.max(0, (subject.totalQuestionCount ?? 0) - (bank.questionCount ?? 0)),
            }
          : subject
      )))
      setConfirmingDeleteBankId(null)
      setMessage('Question bank deleted.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete question bank.')
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

  if (!selectedSubject) {
    return (
      <PageSection title="Question Banks" description="Loading subject...">
        <div className="panel">
          <p>Loading...</p>
        </div>
      </PageSection>
    )
  }

  return (
    <PageSection title={null} description={null}>
      <div className="stack">
        <div className="page-header subject-page-header">
          <div className="row-between wrap-row">
            <div className="stack">
              
              {isEditingSubjectName ? (
                <form className="subject-inline-edit" onSubmit={handleSubjectRename}>
                  <input
                    value={subjectNameDraft}
                    onChange={(event) => setSubjectNameDraft(event.target.value)}
                    required
                    autoFocus
                  />
                  <div className="action-row">
                    <button type="submit" className="primary-button">
                      Save
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setIsEditingSubjectName(false)
                        setSubjectNameDraft(selectedSubject.name)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="subject-title-row">
                  <h2>{selectedSubject.name}</h2>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Edit subject name"
                    onClick={() => {
                      setIsEditingSubjectName(true)
                      setSubjectNameDraft(selectedSubject.name)
                    }}
                  >
                    <PencilIcon />
                  </button>
                </div>
              )}
              <div className="question-meta">
                <span className="pill">{selectedSubject.questionBankCount ?? 0} banks</span>
                <span className="pill">{selectedSubject.totalQuestionCount ?? 0} questions</span>
              </div>
            </div>
            <div className="action-row">

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
                  Create Bank
                </button>

                {showCreatePopover ? (
                  <div className="subject-create-popover panel">
                    <form className="stack" onSubmit={handleSubmit}>
                      <h3>Create question bank</h3>
                      <label>
                        Bank name
                        <input
                          value={form.name}
                          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                          required
                          autoFocus
                        />
                      </label>

                      <div className="action-row">
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
                        <button type="submit" className="primary-button">
                          Create
                        </button>
                        
                      </div>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}
        </div>

        <div className="card-grid">
          {sortedBanks.map((bank) => (
            <article
              key={bank.id}
              className="panel stack subject-card"
              onClick={() => navigate(`${basePath}/subjects/${subjectSlug}/${toQuestionBankSlug(bank.name)}`)}
            >
              <div className="row-between wrap-row">
                <div>
                  <h3>{bank.name}</h3>
                  <div className="question-meta">
                    <span className="pill">{bank.questionCount ?? 0} questions</span>
                  </div>
                </div>
                <div className="action-row subject-create-anchor">
                  <button
                    type="button"
                    className="ghost-button danger-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setConfirmingDeleteBankId((prev) => (prev === bank.id ? null : bank.id))
                    }}
                  >
                    Delete
                  </button>

                  {confirmingDeleteBankId === bank.id ? (
                    <div className="confirm-popover panel" onClick={(event) => event.stopPropagation()}>
                      <p className="muted">Deleting this bank will remove all questions inside it.</p>
                      <div className="action-row">
                        <button type="button" className="ghost-button" onClick={() => setConfirmingDeleteBankId(null)}>
                          Cancel
                        </button>
                        <button type="button" className="ghost-button danger-button" onClick={() => handleDelete(bank)}>
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

        {banksLoaded && !sortedBanks.length ? <p className="muted">No question banks yet for this subject.</p> : null}
      </div>
    </PageSection>
  )
}
