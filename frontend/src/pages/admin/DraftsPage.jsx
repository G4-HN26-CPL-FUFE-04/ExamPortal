import { useEffect, useMemo, useState } from 'react'
import { PageSection } from '../../components/CommonUI'
import DraftList from '../../components/DraftList'
import { api } from '../../lib/appCore'

const emptyExamForm = {
  title: '',
  subjectId: '',
  requiredQuestionCount: 10,
  showAnswersAfterSubmit: false,
}

function ExamEditor({ form, subjects, busy, editingId, onChange, onSubjectChange, onSubmit }) {
  return (
    <form className="panel stack draft-editor-panel" onSubmit={onSubmit}>
      <div className="row-between wrap-row">
        <h3>{editingId ? 'Edit draft' : 'Create draft'}</h3>
        <button type="submit" className="primary-button" disabled={busy}>
          {busy ? 'Saving...' : editingId ? 'Update' : 'Create'}
        </button>
      </div>

      <label>
        Title
        <input value={form.title} onChange={(event) => onChange('title', event.target.value)} required />
      </label>

      <div className="two-column">
        <label>
          Subject
          <select value={form.subjectId} onChange={(event) => onSubjectChange(event.target.value)} required>
            <option value="">Choose subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </label>

        <label>
          Required questions
          <input
            type="number"
            min="1"
            value={form.requiredQuestionCount}
            onChange={(event) => onChange('requiredQuestionCount', event.target.value)}
            required
          />
        </label>
      </div>

      <label className="session-toggle-field">
        <span>Show correct answers after submit</span>
        <input
          type="checkbox"
          checked={form.showAnswersAfterSubmit}
          onChange={(event) => onChange('showAnswersAfterSubmit', event.target.checked)}
        />
      </label>
    </form>
  )
}

export default function DraftsPage() {
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subjectBanks, setSubjectBanks] = useState([])
  const [subjectQuestions, setSubjectQuestions] = useState([])
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [selectedExamDetail, setSelectedExamDetail] = useState(null)
  const [form, setForm] = useState(emptyExamForm)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExamId, setEditingExamId] = useState(null)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([])
  const [selectedExamQuestionIds, setSelectedExamQuestionIds] = useState([])
  const [selectedQuestionBankId, setSelectedQuestionBankId] = useState('')
  const [bankKeyword, setBankKeyword] = useState('')
  const [examQuestionKeyword, setExamQuestionKeyword] = useState('')
  const [randomCount, setRandomCount] = useState(1)
  const [showQuestionBank, setShowQuestionBank] = useState(false)
  const [previewDraft, setPreviewDraft] = useState(null)
  const [previewQuestions, setPreviewQuestions] = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const normalizeExam = (exam) => ({
    ...exam,
    requiredQuestionCount: Number(exam.requiredQuestionCount ?? exam.questionCount ?? 0),
    questionCount: Number(exam.questionCount ?? exam.questions?.length ?? 0),
    questions: exam.questions || [],
  })

  const selectedExam = useMemo(() => {
    if (!selectedExamId) return null
    if (selectedExamDetail?.id === selectedExamId) {
      return normalizeExam(selectedExamDetail)
    }
    return exams.find((exam) => exam.id === selectedExamId) || null
  }, [exams, selectedExamId, selectedExamDetail])

  const availableQuestions = useMemo(() => {
    if (!selectedExam) return []
    const usedIds = new Set((selectedExam.questions || []).map((question) => question.questionId))
    return subjectQuestions.filter((question) => !usedIds.has(question.id))
  }, [selectedExam, subjectQuestions])

  const filteredBankQuestions = useMemo(() => {
    const keyword = bankKeyword.trim().toLowerCase()
    return availableQuestions.filter((question) => {
      const matchesBank = !selectedQuestionBankId || String(question.questionBankId) === String(selectedQuestionBankId)
      const matchesKeyword = !keyword || question.content.toLowerCase().includes(keyword)
      return matchesBank && matchesKeyword
    })
  }, [availableQuestions, bankKeyword, selectedQuestionBankId])

  const filteredExamQuestions = useMemo(() => {
    const keyword = examQuestionKeyword.trim().toLowerCase()
    const examQuestions = selectedExam?.questions || []
    if (!keyword) return examQuestions
    return examQuestions.filter((question) => question.content.toLowerCase().includes(keyword))
  }, [selectedExam, examQuestionKeyword])

  const activeSubjectId = editingExamId ? Number(form.subjectId || selectedExam?.subjectId || 0) : selectedExam?.subjectId
  const remainingSlots = Math.max((selectedExam?.requiredQuestionCount || 0) - (selectedExam?.questionCount || 0), 0)
  const normalizedRandomCount = Math.max(0, Math.min(Number(randomCount) || 0, remainingSlots))

  useEffect(() => {
    setSelectedQuestionIds((current) => current.filter((id) => availableQuestions.some((question) => question.id === id)))
  }, [availableQuestions])

  useEffect(() => {
    setSelectedExamQuestionIds((current) => current.filter((id) => selectedExam?.questions?.some((question) => question.id === id)))
  }, [selectedExam])

  useEffect(() => {
    setRandomCount((current) => {
      const numeric = Number(current) || 0
      if (numeric > remainingSlots) return remainingSlots
      if (numeric < 0) return 0
      return numeric
    })
  }, [remainingSlots])

  const loadExams = async (preferredExamId = selectedExamId) => {
    const { data } = await api.get('/drafts')
    const normalizedExams = data.map(normalizeExam)
    setExams(normalizedExams)
    if (!normalizedExams.length) {
      setSelectedExamId(null)
      return
    }

    const hasPreferred = preferredExamId && normalizedExams.some((exam) => exam.id === preferredExamId)
    setSelectedExamId(hasPreferred ? preferredExamId : normalizedExams[0].id)
  }

  const loadSubjects = async () => {
    const { data } = await api.get('/subjects')
    setSubjects(data)
  }

  useEffect(() => {
    Promise.all([loadExams(), loadSubjects()]).catch(() => {
      setError('Unable to load draft management data.')
    })
  }, [])

  useEffect(() => {
    if (!activeSubjectId) {
      setSubjectBanks([])
      setSubjectQuestions([])
      setSelectedQuestionIds([])
      setSelectedExamQuestionIds([])
      return
    }

    Promise.all([
      api.get('/question-banks', { params: { subjectId: activeSubjectId } }),
      api.get('/questions', { params: { subjectId: activeSubjectId } }),
    ])
      .then(([banksRes, questionsRes]) => {
        setSubjectBanks(banksRes.data)
        setSubjectQuestions(questionsRes.data)
      })
      .catch(() => {
        setSubjectBanks([])
        setSubjectQuestions([])
        setSelectedQuestionIds([])
        setSelectedExamQuestionIds([])
      })
  }, [activeSubjectId, selectedExam?.id])

  useEffect(() => {
    setSelectedQuestionIds([])
    setSelectedExamQuestionIds([])
    setSelectedQuestionBankId('')
    setBankKeyword('')
    setExamQuestionKeyword('')
    setShowQuestionBank(false)
  }, [selectedExam?.id])

  useEffect(() => {
    if (!selectedExamId) {
      setSelectedExamDetail(null)
      return
    }

    api.get(`/drafts/${selectedExamId}`)
      .then(({ data }) => setSelectedExamDetail(normalizeExam(data)))
      .catch(() => setSelectedExamDetail(null))
  }, [selectedExamId])

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubjectChange = async (value) => {
    if (!editingExamId || !selectedExam) {
      updateForm('subjectId', value)
      return
    }

    if (String(selectedExam.subjectId) === String(value)) {
      updateForm('subjectId', value)
      return
    }

    if ((selectedExam.questionCount || 0) > 0) {
      const confirmed = window.confirm('If you continue, all current questions in this draft will be removed. Continue?')
      if (!confirmed) {
        setForm((prev) => ({ ...prev, subjectId: String(selectedExam.subjectId) }))
        return
      }

      setBusy(true)
      setError('')
      setMessage('')
      try {
        for (const examQuestion of selectedExam.questions || []) {
          await api.delete(`/drafts/${selectedExam.id}/questions/${examQuestion.id}`)
        }

        const payload = {
          title: form.title.trim(),
          subjectId: Number(value),
          requiredQuestionCount: Number(form.requiredQuestionCount),
          showAnswersAfterSubmit: form.showAnswersAfterSubmit,
        }

        await api.put(`/drafts/${editingExamId}`, payload)
        const { data } = await api.get(`/drafts/${editingExamId}`)
        const normalized = normalizeExam(data)
        setSelectedExamDetail(normalized)
        setExams((current) => current.map((exam) => (exam.id === editingExamId ? normalized : exam)))
        setForm((prev) => ({ ...prev, subjectId: value }))
        setSelectedQuestionIds([])
        setSelectedExamQuestionIds([])
        setMessage('Subject changed. Existing questions were removed.')
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to change subject.')
        setForm((prev) => ({ ...prev, subjectId: String(selectedExam.subjectId) }))
      } finally {
        setBusy(false)
      }
      return
    }

    updateForm('subjectId', value)
  }

  const resetForm = () => {
    setForm(emptyExamForm)
    setEditingExamId(null)
    setShowCreateForm(false)
  }

  const beginCreate = () => {
    setError('')
    setMessage('')
    setForm(emptyExamForm)
    setEditingExamId(null)
    setShowCreateForm(true)
    setSelectedExamId(null)
    setSelectedExamDetail(null)
  }

  const beginEdit = (exam) => {
    setError('')
    setMessage('')
    setShowCreateForm(false)
    setEditingExamId(exam.id)
    setForm({
      title: exam.title,
      subjectId: String(exam.subjectId),
      requiredQuestionCount: exam.requiredQuestionCount || exam.questionCount || 1,
      showAnswersAfterSubmit: Boolean(exam.showAnswersAfterSubmit),
    })
  }

  const handleSubmitExam = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        title: form.title.trim(),
        subjectId: Number(form.subjectId),
        requiredQuestionCount: Number(form.requiredQuestionCount),
        showAnswersAfterSubmit: form.showAnswersAfterSubmit,
      }

      if (editingExamId) {
        await api.put(`/drafts/${editingExamId}`, payload)
        setMessage('Draft updated.')
        await loadExams(editingExamId)
      } else {
        const { data } = await api.post('/drafts', payload)
        setMessage('Draft created.')
        await loadExams(data.id)
      }
      resetForm()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save draft.')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Delete this exam?')) return
    setError('')
    setMessage('')
    try {
      await api.delete(`/drafts/${examId}`)
      setMessage('Draft deleted.')
      setSelectedExamDetail(null)
      await loadExams(selectedExamId === examId ? null : selectedExamId)
      if (editingExamId === examId) resetForm()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete draft.')
    }
  }

  const handleToggleQuestion = (questionId) => {
    setSelectedQuestionIds((current) => (
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    ))
  }

  const handleToggleExamQuestion = (examQuestionId) => {
    setSelectedExamQuestionIds((current) => (
      current.includes(examQuestionId)
        ? current.filter((id) => id !== examQuestionId)
        : [...current, examQuestionId]
    ))
  }

  const handleSelectAllExamQuestions = () => {
    setSelectedExamQuestionIds(
      filteredExamQuestions
        .map((question) => question.id)
        .filter((id) => id != null),
    )
  }

  const handleSelectAllBankQuestions = () => {
    setSelectedQuestionIds(filteredBankQuestions.map((question) => question.id))
  }

  const handleOpenPreview = async (draft) => {
    setPreviewDraft(draft)
    setPreviewQuestions([])
    setPreviewLoading(true)
    try {
      const { data } = await api.get(`/drafts/${draft.id}`)
      const questionDetails = await Promise.all(
        (data.questions || []).map(async (question, index) => {
          const detailRes = await api.get(`/questions/${question.questionId}`)
          return {
            draftQuestionId: question.id ?? `${question.questionId}-${index}`,
            order: index + 1,
            content: question.content,
            options: detailRes.data.options || [],
          }
        }),
      )
      setPreviewQuestions(questionDetails)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load draft preview.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const refreshSelectedExam = async (examId) => {
    await loadExams(examId)
    const { data } = await api.get(`/drafts/${examId}`)
    setSelectedExamDetail(normalizeExam(data))
  }

  const handleClosePreview = () => {
    setPreviewDraft(null)
    setPreviewQuestions([])
    setPreviewLoading(false)
  }

  const handleAddSelectedQuestions = async (questionIds = selectedQuestionIds) => {
    if (!selectedExam || !questionIds.length) return
    if (questionIds.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more question(s) to this draft.`)
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      try {
        await api.post(`/drafts/${selectedExam.id}/questions/bulk`, { questionIds })
      } catch (requestError) {
        const status = requestError.response?.status
        if (status !== 404 && status !== 405) {
          throw requestError
        }
        for (const questionId of questionIds) {
          await api.post(`/drafts/${selectedExam.id}/questions`, {
            questionId,
            displayOrder: 1,
          })
        }
      }
      setSelectedQuestionIds([])
      setMessage(`${questionIds.length} question(s) added to draft.`)
      await refreshSelectedExam(selectedExam.id)
      setShowQuestionBank(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add selected questions.')
    } finally {
      setBusy(false)
    }
  }

  const handleRandomizeQuestions = (countOverride = null) => {
    if (!selectedExam) return
    const pool = filteredBankQuestions
    const requestedCount = countOverride == null ? normalizedRandomCount : countOverride
    const maxCount = Math.min(requestedCount, pool.length, remainingSlots)
    if (maxCount < 1) {
      setError('No available questions to randomize.')
      return
    }

    const shuffled = [...pool]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }
    const pickedIds = shuffled.slice(0, maxCount).map((question) => question.id)
    if (!pickedIds.length) {
      setError('No available questions to randomize.')
      return
    }

    setSelectedQuestionIds(pickedIds)
    setMessage('Questions randomized. Review the checked questions, then add selected.')
  }

  const handleRemoveSelectedQuestions = async (examQuestionIds = selectedExamQuestionIds) => {
    const validExamQuestionIds = examQuestionIds.filter((id) => id != null)
    if (!selectedExam || !validExamQuestionIds.length) {
      setError('No questions selected to remove.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await Promise.all(
        validExamQuestionIds.map((examQuestionId) => api.delete(`/drafts/${selectedExam.id}/questions/${examQuestionId}`)),
      )
      setSelectedExamQuestionIds([])
      setMessage(`${validExamQuestionIds.length} question(s) removed from draft.`)
      await refreshSelectedExam(selectedExam.id)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove selected questions.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageSection title="Draft Management" compactHeader>
      <div className="draft-workspace">
        <div className="stack">
          <div className="draft-status-slot">
            {error ? <p className="error-text">{error}</p> : null}
            {!error && message ? <p className="success-text">{message}</p> : null}
          </div>
          <DraftList
            drafts={exams}
            selectedDraftId={selectedExamId}
            busy={busy}
            onCreate={beginCreate}
            onSelect={(exam) => {
              setSelectedExamId(exam.id)
              beginEdit(exam)
            }}
            onPreview={handleOpenPreview}
            onDelete={(exam) => handleDeleteExam(exam.id)}
            emptyMessage="No drafts yet. Create the first draft to get started."
          />
        </div>

        <div className="stack draft-main-column">
          {showCreateForm || editingExamId ? (
            <ExamEditor
              form={form}
              subjects={subjects}
              busy={busy}
              editingId={editingExamId}
              onChange={updateForm}
              onSubjectChange={handleSubjectChange}
              onSubmit={handleSubmitExam}
            />
          ) : (
            <div className="panel stack draft-editor-placeholder">
              <h3>Edit draft</h3>
              <p className="muted">Select a draft card or create a new draft to edit it here.</p>
            </div>
          )}

          {selectedExam ? (
            <div className="panel stack exam-bank-panel">
            <div className="row-between wrap-row">
              <div className="row-between wrap-row exam-panel-heading">
                <h3>Exam question list</h3>
                <span className="muted">{selectedExam.questionCount} / {selectedExam.requiredQuestionCount} questions</span>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowQuestionBank(true)}
                disabled={busy || remainingSlots < 1}
              >
                Add question
              </button>
            </div>

            <label>

              <input
                value={examQuestionKeyword}
                onChange={(event) => setExamQuestionKeyword(event.target.value)}
                placeholder="Search question text"
              />
            </label>

            <div className={filteredExamQuestions.length ? 'question-bank-list exam-question-list-scroll' : 'question-bank-list exam-question-list-empty'}>
              {filteredExamQuestions.map((question, index) => (
                <label key={question.id ?? `${question.questionId}-${index}`} className="question-bank-item">
                  <input
                    type="checkbox"
                    checked={selectedExamQuestionIds.includes(question.id)}
                    onChange={() => handleToggleExamQuestion(question.id)}
                    disabled={busy || question.id == null}
                  />
                  <span>{question.content}</span>
                </label>
              ))}
            </div>

            <div className="action-row question-list-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={handleSelectAllExamQuestions}
                disabled={busy || !filteredExamQuestions.length}
              >
                Select all
              </button>
              <div>
              <span className="muted">{selectedExamQuestionIds.length} selected</span>
            </div>
              <div className="action-row question-list-actions-right">
                {selectedExamQuestionIds.length ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setSelectedExamQuestionIds([])}
                    disabled={busy}
                  >
                    Clear selected
                  </button>
                ) : null}
                {selectedExamQuestionIds.length ? (
                  <button
                    type="button"
                    className="danger-button ghost-button"
                    onClick={() => handleRemoveSelectedQuestions()}
                    disabled={busy}
                  >
                    Remove selected
                  </button>
                ) : null}
              </div>
            </div>

            

            {!selectedExam.questions?.length ? <p className="muted">This draft has no questions yet.</p> : null}
            </div>
          ) : (
            <div className="panel stack exam-bank-panel draft-editor-placeholder">
              <h3>Exam question list</h3>
              <p className="muted">Select a draft to manage its questions here.</p>
            </div>
          )}
        </div>
      </div>

      {showQuestionBank && selectedExam ? (
        <div className="preview-overlay" onClick={() => setShowQuestionBank(false)} role="presentation">
          <div className="preview-dialog question-bank-dialog" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="row-between wrap-row">
              <div>
                <h3>Question bank</h3>
                <p className="muted">{remainingSlots} slots remaining</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowQuestionBank(false)}>
                Close
              </button>
            </div>

            <label>
              Question bank
              <select
                value={selectedQuestionBankId}
                onChange={(event) => setSelectedQuestionBankId(event.target.value)}
              >
                <option value="">All banks</option>
                {subjectBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </label>

            <label>
              Search bank
              <input
                value={bankKeyword}
                onChange={(event) => setBankKeyword(event.target.value)}
                placeholder="Search question text"
              />
            </label>

            <div className="question-bank-list question-bank-list-modal">
              {filteredBankQuestions.map((question) => (
                <label key={question.id} className="question-bank-item">
                  <input
                    type="checkbox"
                    checked={selectedQuestionIds.includes(question.id)}
                    onChange={() => handleToggleQuestion(question.id)}
                    disabled={busy}
                  />
                  <span>
                    {question.content}
                    <small className="muted">{question.questionBankName}</small>
                  </span>
                </label>
              ))}
            </div>

            <div className="question-bank-toolbar">
              <div className="action-row wrap-row question-list-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleRandomizeQuestions}
                  disabled={busy || !filteredBankQuestions.length || remainingSlots < 1}
                >
                  Random select
                </button>
                <label className="inline-number-field">
                  <input
                    type="number"
                    min="0"
                    max={remainingSlots}
                    value={randomCount}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value) || 0
                      setRandomCount(Math.max(0, Math.min(nextValue, remainingSlots)))
                    }}
                    disabled={busy || remainingSlots < 1}
                  />
                </label>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setRandomCount(remainingSlots)
                    handleRandomizeQuestions(remainingSlots)
                  }}
                  disabled={busy || !filteredBankQuestions.length || remainingSlots < 1}
                >
                  Random max
                </button>
                <div className="action-row question-list-actions-right">
                  
                </div>
                
              </div>
              <div className="action-row question-bank-selection-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleSelectAllBankQuestions}
                  disabled={busy || !filteredBankQuestions.length || remainingSlots < 1}
                >
                  Select all
                </button>
                {selectedQuestionIds.length ? (
                    <button
                      type="button"
                      className="ghost-button question-bank-secondary-action"
                      onClick={() => setSelectedQuestionIds([])}
                      disabled={busy}
                    >
                      Clear selected
                    </button>
                  ) : null}
              </div>
              <div className="row-between wrap-row">
                <div className="muted">{selectedQuestionIds.length} selected</div>
                {remainingSlots > 0 ? (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleAddSelectedQuestions()}
                    disabled={busy || !selectedQuestionIds.length}
                  >
                    Add selected
                  </button>
                ) : null}
              </div>
            </div>

            {!availableQuestions.length ? <p className="muted">All questions from this subject are already in the draft.</p> : null}
            {availableQuestions.length && !filteredBankQuestions.length ? <p className="muted">No questions match the current bank filter.</p> : null}
          </div>
        </div>
      ) : null}

      {previewDraft ? (
        <div className="preview-overlay" onClick={handleClosePreview} role="presentation">
          <div className="preview-dialog" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="row-between wrap-row">
              <div>
                <h3>{previewDraft.title}</h3>
                <p className="muted">{previewDraft.subjectName}</p>
              </div>
              <button type="button" className="ghost-button" onClick={handleClosePreview}>
                Close
              </button>
            </div>

            <div className="question-meta">
              <span>{previewDraft.questionCount} / {previewDraft.requiredQuestionCount} questions</span>
            </div>

            {previewLoading ? <p className="muted">Loading draft preview...</p> : null}

            <div className="preview-question-list">
              {previewQuestions.map((question) => (
                <article key={question.draftQuestionId} className="question-card">
                  <div className="row-between wrap-row">
                    <strong>Question {question.order}</strong>
                  </div>
                  <p>{question.content}</p>
                  <div className="stack">
                    {question.options.map((option) => (
                      <div key={`${question.draftQuestionId}-${option.label}`} className={option.correct ? 'preview-option correct-preview' : 'preview-option'}>
                        <strong>{option.label}.</strong> {option.content}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </PageSection>
  )
}
