import { useEffect, useMemo, useState } from 'react'
import DraftList from '../../components/DraftList'
import { PageSection } from '../../components/CommonUI'
import { api, formatDate } from '../../lib/appCore'

const emptySessionForm = {
  examId: '',
  title: '',
  openTime: '',
  closeTime: '',
  durationMinutes: 60,
  maxAttempts: 1,
  status: 'UPCOMING',
  shuffleQuestions: false,
}

function toLocalDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function getWindowDurationMinutes(openTime, closeTime) {
  if (!openTime || !closeTime) return 0
  const start = new Date(openTime)
  const end = new Date(closeTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.floor((end.getTime() - start.getTime()) / 60_000)
}

function SessionEditor({
  drafts,
  selectedDraft,
  editingId,
  busy,
  form,
  onChange,
  onSubmit,
  onReset,
}) {
  const windowMinutes = getWindowDurationMinutes(form.openTime, form.closeTime)
  const isWindowValid = !form.openTime || !form.closeTime || windowMinutes > Number(form.durationMinutes)

  return (
    <form className="panel stack draft-editor-panel exam-session-editor-panel" onSubmit={onSubmit}>
      <div className="row-between wrap-row">
        <h3>{editingId ? 'Edit session' : 'Create session'}</h3>
        <div className="action-row">
          {editingId ? (
            <button type="button" className="ghost-button" onClick={onReset} disabled={busy}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className="primary-button" disabled={busy || !selectedDraft || !isWindowValid}>
            {busy ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>

      <div className="two-column">
        <label>
          Draft
          <select value={form.examId} onChange={(event) => onChange('examId', event.target.value)} required>
            <option value="">Choose draft</option>
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select value={form.status} onChange={(event) => onChange('status', event.target.value)} required>
            <option value="UPCOMING">UPCOMING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
      </div>

      <label>
        Session title
        <input value={form.title} onChange={(event) => onChange('title', event.target.value)} required />
      </label>

      <div className="three-column">
        <label>
          Duration (minutes)
          <input
            type="number"
            min="1"
            value={form.durationMinutes}
            onChange={(event) => onChange('durationMinutes', event.target.value)}
            required
          />
        </label>

        <label>
          Start time
          <input
            type="datetime-local"
            value={form.openTime}
            onChange={(event) => onChange('openTime', event.target.value)}
            required
          />
        </label>

        <label>
          End time
          <input
            type="datetime-local"
            value={form.closeTime}
            onChange={(event) => onChange('closeTime', event.target.value)}
            required
          />
        </label>
      </div>

      <div className="two-column session-settings-row">
        <label>
          Max attempts
          <input
            type="number"
            min="1"
            value={form.maxAttempts}
            onChange={(event) => onChange('maxAttempts', event.target.value)}
            required
          />
        </label>

        <label className="session-toggle-field">
          <span>Shuffle questions</span>
          <input
            type="checkbox"
            checked={form.shuffleQuestions}
            onChange={(event) => onChange('shuffleQuestions', event.target.checked)}
          />
        </label>
      </div>

      {selectedDraft ? (
        <div className="session-draft-hint">
          <strong>{selectedDraft.title}</strong>
          <span className="muted">{selectedDraft.subjectName}</span>
          <span className="muted">{selectedDraft.questionCount} / {selectedDraft.requiredQuestionCount} questions</span>
          <span className="muted">
            Review mode: {selectedDraft.showAnswersAfterSubmit ? 'show correct answers after submit' : 'score only after submit'}
          </span>
        </div>
      ) : (
        <p className="muted">Select a draft from the list or the dropdown before creating a session.</p>
      )}

      {!isWindowValid ? (
        <p className="error-text">End time minus start time must be greater than duration.</p>
      ) : null}
    </form>
  )
}

export default function ExamSessionsPage() {
  const [drafts, setDrafts] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedDraftId, setSelectedDraftId] = useState(null)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [form, setForm] = useState(emptySessionForm)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const normalizeDraft = (draft) => ({
    ...draft,
    requiredQuestionCount: Number(draft.requiredQuestionCount ?? draft.questionCount ?? 0),
    questionCount: Number(draft.questionCount ?? draft.questions?.length ?? 0),
  })

  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === Number(form.examId || selectedDraftId)) || null,
    [drafts, form.examId, selectedDraftId],
  )

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime()),
    [sessions],
  )

  const loadDrafts = async (preferredDraftId = selectedDraftId) => {
    const { data } = await api.get('/drafts')
    const normalizedDrafts = data.map(normalizeDraft)
    setDrafts(normalizedDrafts)

    if (!normalizedDrafts.length) {
      setSelectedDraftId(null)
      return
    }

    const matchedDraft = preferredDraftId && normalizedDrafts.find((draft) => draft.id === Number(preferredDraftId))
    setSelectedDraftId(matchedDraft ? matchedDraft.id : normalizedDrafts[0].id)
  }

  const loadSessions = async () => {
    const { data } = await api.get('/exam-sessions')
    setSessions(data)
  }

  useEffect(() => {
    Promise.all([loadDrafts(), loadSessions()]).catch(() => {
      setError('Unable to load exam session data.')
    })
  }, [])

  useEffect(() => {
    if (!form.examId && selectedDraftId && !editingSessionId) {
      setForm((current) => ({ ...current, examId: String(selectedDraftId) }))
    }
  }, [selectedDraftId, form.examId, editingSessionId])

  const updateForm = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value }

      if (key === 'examId') {
        const matchedDraft = drafts.find((draft) => draft.id === Number(value))
        if (matchedDraft && (!editingSessionId || !current.title.trim() || current.title === `${selectedDraft?.title || ''} Session`)) {
          next.title = matchedDraft.title ? `${matchedDraft.title} Session` : current.title
        }
      }

      return next
    })
  }

  const resetForm = () => {
    setEditingSessionId(null)
    setForm({
      ...emptySessionForm,
      examId: selectedDraftId ? String(selectedDraftId) : '',
      title: selectedDraft ? `${selectedDraft.title} Session` : '',
    })
  }

  useEffect(() => {
    if (!editingSessionId) {
      resetForm()
    }
  }, [selectedDraftId, drafts.length])

  const handleSelectDraft = (draft) => {
    setSelectedDraftId(draft.id)
    setForm((current) => ({
      ...current,
      examId: String(draft.id),
      title: current.title.trim() ? current.title : `${draft.title} Session`,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const windowMinutes = getWindowDurationMinutes(form.openTime, form.closeTime)
    if (windowMinutes <= Number(form.durationMinutes)) {
      setError('End time minus start time must be greater than duration.')
      return
    }

    const payload = {
      examId: Number(form.examId),
      title: form.title.trim(),
      openTime: form.openTime,
      closeTime: form.closeTime,
      durationMinutes: Number(form.durationMinutes),
      maxAttempts: Number(form.maxAttempts),
      status: form.status,
      shuffleQuestions: form.shuffleQuestions,
    }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (editingSessionId) {
        await api.put(`/exam-sessions/${editingSessionId}`, payload)
        setMessage('Exam session updated.')
      } else {
        await api.post('/exam-sessions', payload)
        setMessage('Exam session created.')
      }
      await Promise.all([loadDrafts(payload.examId), loadSessions()])
      setSelectedDraftId(payload.examId)
      resetForm()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save exam session.')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = (session) => {
    setEditingSessionId(session.id)
    setSelectedDraftId(session.examId)
    setForm({
      examId: String(session.examId),
      title: session.title,
      openTime: toLocalDateTimeInput(session.openTime),
      closeTime: toLocalDateTimeInput(session.closeTime),
      durationMinutes: session.durationMinutes,
      maxAttempts: session.maxAttempts,
      status: session.status,
      shuffleQuestions: Boolean(session.shuffleQuestions),
    })
    setError('')
    setMessage('')
  }

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Delete this exam session?')) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.delete(`/exam-sessions/${sessionId}`)
      if (editingSessionId === sessionId) resetForm()
      await loadSessions()
      setMessage('Exam session deleted.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete exam session.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageSection title="Session Management" description="Choose a draft, then schedule when students can take it.">
      <div className="draft-workspace">
        <div className="stack">
          <div className="draft-status-slot">
            {error ? <p className="error-text">{error}</p> : null}
            {!error && message ? <p className="success-text">{message}</p> : null}
          </div>
          <DraftList
            drafts={drafts}
            selectedDraftId={Number(form.examId || selectedDraftId)}
            onSelect={handleSelectDraft}
            title="Draft list"
            emptyMessage="No drafts yet. Finish at least one draft before creating exam sessions."
          />
        </div>

        <div className="stack draft-main-column">
          <SessionEditor
            drafts={drafts}
            selectedDraft={selectedDraft}
            editingId={editingSessionId}
            busy={busy}
            form={form}
            onChange={updateForm}
            onSubmit={handleSubmit}
            onReset={resetForm}
          />

          <div className="panel stack exam-bank-panel">
            <div className="row-between wrap-row exam-panel-heading">
              <h3>Created sessions</h3>
              <span className="muted">{sessions.length} total</span>
            </div>

            <div className="session-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Draft</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Attempts</th>
                    <th>Window</th>
                    <th>Shuffle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.title}</td>
                      <td>{session.examTitle}</td>
                      <td>{session.status}</td>
                      <td>{session.durationMinutes} min</td>
                      <td>{session.maxAttempts}</td>
                      <td>{formatDate(session.openTime)} - {formatDate(session.closeTime)}</td>
                      <td>{session.shuffleQuestions ? 'Yes' : 'No'}</td>
                      <td>
                        <div className="action-row">
                          <button type="button" className="ghost-button" onClick={() => handleEdit(session)} disabled={busy}>
                            Edit
                          </button>
                          <button type="button" className="danger-button ghost-button" onClick={() => handleDelete(session.id)} disabled={busy}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!sortedSessions.length ? <p className="muted">No exam sessions yet.</p> : null}
          </div>
        </div>
      </div>
    </PageSection>
  )
}
