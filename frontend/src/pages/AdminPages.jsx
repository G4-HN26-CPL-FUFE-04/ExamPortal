import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CrudPage, DataTable, InfoGrid, PageSection, StatsCards } from '../components/CommonUI'
import { api, formatDate, toSubjectSlug } from '../lib/appCore'

const questionImportSample = `Q: What is 2 + 2?
A: 3
B: 4
C: 5
D: 6
ANSWER: B

Q: Java is a ...
A: Database
B: Operating System
C: Programming Language
D: Browser
ANSWER: C`

export function AdminHomePage() {
  return (
    <PageSection title="Admin Area" description="Management entry point for questions, exams, sessions, attempts, and statistics.">
      <InfoGrid
        items={[
          ['User management', 'Search, assign roles, lock or unlock accounts'],
          ['Content management', 'Subjects, question bank, exams, sessions'],
          ['Monitoring', 'Attempts, result review, and basic dashboard statistics'],
        ]}
      />
    </PageSection>
  )
}

export function UsersPage() {
  return <CrudPage title="Users" endpoint="/users" fields={['fullName', 'email', 'role', 'status']} />
}

export function SubjectsPage() {
  return <CrudPage title="Subjects" endpoint="/subjects" fields={['name', 'description']} />
}

export function QuestionsHomePage() {
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    api.get('/subjects').then(({ data }) => setSubjects(data))
  }, [])

  return (
    <PageSection title="Question Bank" description="Choose a subject first. Each subject has its own question bank URL.">
      <div className="card-grid">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            to={`/questions/${toSubjectSlug(subject.name)}`}
            className="panel subject-link-card"
          >
            <h3>{subject.name}</h3>
            <p className="muted">{subject.description || 'No description'}</p>
            <span className="primary-link faux-link">Open bank</span>
          </Link>
        ))}
      </div>
    </PageSection>
  )
}

function QuestionEditor({ title, form, onSubmit, onCancel, onChangeContent, onOptionChange, onSetCorrect }) {
  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <div className="row-between wrap-row">
        <h3>{title}</h3>
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <label>
        Question content
        <textarea
          value={form.content}
          onChange={(event) => onChangeContent(event.target.value)}
          rows="4"
          required
        />
      </label>

      <div className="stack">
        <div className="row-between wrap-row">
          <h3>Answer options</h3>
          <span className="muted">Exactly one correct answer</span>
        </div>
        {form.options.map((option, index) => (
          <div key={option.label} className="option-editor">
            <label className="radio-inline">
              <input
                type="radio"
                name="correct-option"
                checked={option.correct}
                onChange={() => onSetCorrect(option.label)}
              />
              Correct
            </label>
            <span className="option-label">{option.label}</span>
            <input
              value={option.content}
              onChange={(event) => onOptionChange(index, event.target.value)}
              placeholder={`Option ${option.label}`}
              required
            />
          </div>
        ))}
      </div>
      <button type="submit" className="primary-button">
        Save question
      </button>
    </form>
  )
}

function QuestionImportPanel({
  importText,
  importError,
  importMessage,
  busy,
  onChangeText,
  onFileSelect,
  onImport,
  onCancel,
}) {
  return (
    <div className="panel stack">
      <div className="row-between wrap-row">
        <div>
          <h3>Import questions</h3>
          <p className="muted">Use format Q / A / B / C / D / ANSWER. Questions are imported into the current subject only.</p>
        </div>
        <button type="button" className="ghost-button" onClick={onCancel}>
          Close
        </button>
      </div>

      <label>
        Paste text
        <textarea
          value={importText}
          onChange={(event) => onChangeText(event.target.value)}
          rows="14"
          placeholder={questionImportSample}
        />
      </label>

      <label>
        Or choose a .txt file
        <input type="file" accept=".txt,text/plain" onChange={onFileSelect} />
      </label>

      <div className="action-row">
        <button type="button" className="ghost-button" onClick={() => onChangeText(questionImportSample)}>
          Use sample
        </button>
        <button type="button" className="primary-button" onClick={onImport} disabled={busy || !importText.trim()}>
          Import all
        </button>
      </div>

      {importError ? <p className="error-text">{importError}</p> : null}
      {importMessage ? <p className="success-text">{importMessage}</p> : null}
    </div>
  )
}

export function SubjectQuestionBankPage() {
  const { subjectSlug } = useParams()
  const navigate = useNavigate()
  const emptyForm = {
    content: '',
    options: [
      { label: 'A', content: '', correct: true },
      { label: 'B', content: '', correct: false },
      { label: 'C', content: '', correct: false },
      { label: 'D', content: '', correct: false },
    ],
  }

  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [importBusy, setImportBusy] = useState(false)

  const selectedSubject = useMemo(
    () => subjects.find((subject) => toSubjectSlug(subject.name) === subjectSlug),
    [subjects, subjectSlug],
  )

  const loadQuestions = async () => {
    if (!selectedSubject) return
    const params = {}
    params.subjectId = Number(selectedSubject.id)
    if (keyword.trim()) params.keyword = keyword.trim()
    const { data } = await api.get('/questions', { params })
    setQuestions(data)
  }

  useEffect(() => {
    api.get('/subjects').then(({ data }) => setSubjects(data))
  }, [])

  useEffect(() => {
    if (subjects.length && !selectedSubject) {
      navigate('/questions', { replace: true })
    }
  }, [subjects, selectedSubject, navigate])

  useEffect(() => {
    loadQuestions()
  }, [selectedSubject?.id, keyword])

  const closeEditor = () => {
    setForm(emptyForm)
    setEditingQuestionId(null)
    setShowCreateForm(false)
    setError('')
  }

  const closeImportPanel = () => {
    setShowImportPanel(false)
    setImportError('')
    setImportMessage('')
  }

  const handleOptionChange = (index, value) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) => (
        optionIndex === index ? { ...option, content: value } : option
      )),
    }))
  }

  const setCorrectOption = (label) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option) => ({ ...option, correct: option.label === label })),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      if (!selectedSubject) {
        setError('Please choose a subject first.')
        return
      }
      const payload = {
        ...form,
        subjectId: Number(selectedSubject.id),
        options: form.options.map((option) => ({
          label: option.label,
          content: option.content,
          correct: option.correct,
        })),
      }
      const endpoint = editingQuestionId ? `/questions/${editingQuestionId}` : '/questions'
      const method = editingQuestionId ? 'put' : 'post'
      await api[method](endpoint, payload)
      setMessage(editingQuestionId ? 'Question updated.' : 'Question created.')
      closeEditor()
      loadQuestions()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save question.')
    }
  }

  const handleEdit = async (id) => {
    const { data } = await api.get(`/questions/${id}`)
    setEditingQuestionId(id)
    setShowCreateForm(false)
    setShowImportPanel(false)
    setMessage('')
    setError('')
    setExpandedQuestionId(id)
    setForm({
      content: data.content,
      options: data.options.map((option) => ({
        label: option.label,
        content: option.content,
        correct: option.correct,
      })),
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return
    await api.delete(`/questions/${id}`)
    if (editingQuestionId === id) closeEditor()
    if (expandedQuestionId === id) setExpandedQuestionId(null)
    setMessage('Question deleted.')
    loadQuestions()
  }

  const startCreate = () => {
    setShowCreateForm(true)
    setShowImportPanel(false)
    setEditingQuestionId(null)
    setExpandedQuestionId(null)
    setError('')
    setMessage('')
    setForm(emptyForm)
  }

  const startImport = () => {
    closeEditor()
    setShowImportPanel(true)
    setExpandedQuestionId(null)
    setImportError('')
    setImportMessage('')
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const content = await file.text()
    setImportText(content)
    setImportError('')
    setImportMessage('')
  }

  const handleConfirmImport = async () => {
    if (!selectedSubject) return
    setImportBusy(true)
    setImportError('')
    setImportMessage('')
    try {
      const { data } = await api.post('/question-imports', {
        subjectId: Number(selectedSubject.id),
        rawText: importText,
      })
      setImportMessage(`Imported ${data.importedCount} questions.`)
      setImportText('')
      loadQuestions()
    } catch (requestError) {
      setImportError(requestError.response?.data?.message || `Unable to import questions (${requestError.response?.status || 'network error'}).`)
    } finally {
      setImportBusy(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedQuestionId((prev) => (prev === id ? null : id))
  }

  if (!selectedSubject) {
    return (
      <PageSection title="Question Bank" description="Loading subject bank...">
        <div className="panel">
          <p>Loading...</p>
        </div>
      </PageSection>
    )
  }

  return (
    <PageSection title={`${selectedSubject.name} Question Bank`} description="Questions in this bank belong only to the selected subject.">
      <div className="stack">
        <div className="panel stack">
          <div className="row-between wrap-row">
            <div>
              <p className="eyebrow">Subject</p>
              <h3>{selectedSubject.name}</h3>
            </div>
            <div className="action-row">
              <Link to="/questions" className="ghost-button back-link-button">Change subject</Link>
              <button type="button" className="ghost-button" onClick={startImport}>
                Import questions
              </button>
              <button type="button" className="primary-button" onClick={startCreate}>
                Create question
              </button>
            </div>
          </div>

          <label>
            Search content
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search question text"
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}
        </div>

        {showImportPanel ? (
          <QuestionImportPanel
            importText={importText}
            importError={importError}
            importMessage={importMessage}
            busy={importBusy}
            onChangeText={setImportText}
            onFileSelect={handleImportFile}
            onImport={handleConfirmImport}
            onCancel={closeImportPanel}
          />
        ) : null}

        {showCreateForm ? (
          <QuestionEditor
            title="Create question"
            form={form}
            onSubmit={handleSubmit}
            onCancel={closeEditor}
            onChangeContent={(value) => setForm({ ...form, content: value })}
            onOptionChange={handleOptionChange}
            onSetCorrect={setCorrectOption}
          />
        ) : null}

        {editingQuestionId ? (
          <QuestionEditor
            title="Edit question"
            form={form}
            onSubmit={handleSubmit}
            onCancel={closeEditor}
            onChangeContent={(value) => setForm({ ...form, content: value })}
            onOptionChange={handleOptionChange}
            onSetCorrect={setCorrectOption}
          />
        ) : null}

        <div className="stack">
          {questions.map((item) => (
            <article key={item.id} className="question-card">
              <div className="question-topbar">
                <div className="question-icon-actions">
                  <button type="button" className="icon-button danger-icon-button" onClick={() => handleDelete(item.id)}>
                    x
                  </button>
                  <button type="button" className="icon-button" onClick={() => handleEdit(item.id)}>
                    edit
                  </button>
                </div>
              </div>

              <button type="button" className="question-title-button" onClick={() => toggleExpand(item.id)}>
                {item.content}
              </button>

              <p className="muted">
                Correct answer: {item.correctOptionLabel ? `${item.correctOptionLabel}. ${item.correctOptionContent}` : 'Not set'}
              </p>

              {expandedQuestionId === item.id ? (
                <div className="stack">
                  {item.options?.length ? (
                    item.options.map((option) => (
                      <div key={option.label} className={option.correct ? 'preview-option correct-preview' : 'preview-option'}>
                        <strong>{option.label}.</strong> {option.content}
                      </div>
                    ))
                  ) : (
                    <QuestionDetailsLoader questionId={item.id} />
                  )}
                </div>
              ) : null}
            </article>
          ))}

          {!questions.length ? <p className="muted">No questions found for this subject.</p> : null}
        </div>
      </div>
    </PageSection>
  )
}

function QuestionDetailsLoader({ questionId }) {
  const [question, setQuestion] = useState(null)

  useEffect(() => {
    api.get(`/questions/${questionId}`).then(({ data }) => setQuestion(data))
  }, [questionId])

  if (!question) {
    return <p className="muted">Loading answers...</p>
  }

  return (
    <>
      {question.options.map((option) => (
        <div key={option.label} className={option.correct ? 'preview-option correct-preview' : 'preview-option'}>
          <strong>{option.label}.</strong> {option.content}
        </div>
      ))}
    </>
  )
}

const emptyExamForm = {
  title: '',
  subjectId: '',
  requiredQuestionCount: 10,
}

function ExamEditor({ form, subjects, busy, editingId, onChange, onSubmit, onCancel }) {
  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <div className="row-between wrap-row">
        <div>
          <h3>{editingId ? 'Edit draft' : 'Create draft'}</h3>
          <p className="muted">Drafts store the question set that you will publish later.</p>
        </div>
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <label>
        Title
        <input value={form.title} onChange={(event) => onChange('title', event.target.value)} required />
      </label>

      <div className="two-column">
        <label>
          Subject
          <select value={form.subjectId} onChange={(event) => onChange('subjectId', event.target.value)} required>
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

      <button type="submit" className="primary-button" disabled={busy}>
        {busy ? 'Saving...' : editingId ? 'Update draft' : 'Create draft'}
      </button>
    </form>
  )
}

export function DraftsPage() {
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subjectQuestions, setSubjectQuestions] = useState([])
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [selectedExamDetail, setSelectedExamDetail] = useState(null)
  const [form, setForm] = useState(emptyExamForm)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExamId, setEditingExamId] = useState(null)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([])
  const [selectedExamQuestionIds, setSelectedExamQuestionIds] = useState([])
  const [bankKeyword, setBankKeyword] = useState('')
  const [examQuestionKeyword, setExamQuestionKeyword] = useState('')
  const [randomCount, setRandomCount] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const normalizeExam = (exam) => ({
    ...exam,
    requiredQuestionCount: Number(exam.requiredQuestionCount ?? exam.questionCount ?? 0),
    questionCount: Number(exam.questionCount ?? exam.questions?.length ?? 0),
    published: Boolean(exam.published),
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

  const getExamQuestionKey = (question, index = 0) => question.id ?? `${question.questionId}-${question.displayOrder}-${index}`

  useEffect(() => {
    setSelectedQuestionIds((current) => current.filter((id) => availableQuestions.some((question) => question.id === id)))
  }, [availableQuestions])

  useEffect(() => {
    setSelectedExamQuestionIds((current) => current.filter((id) => selectedExam?.questions?.some((question) => question.id === id)))
  }, [selectedExam])

  const filteredBankQuestions = useMemo(() => {
    const keyword = bankKeyword.trim().toLowerCase()
    if (!keyword) return availableQuestions
    return availableQuestions.filter((question) => question.content.toLowerCase().includes(keyword))
  }, [availableQuestions, bankKeyword])

  const filteredExamQuestions = useMemo(() => {
    const keyword = examQuestionKeyword.trim().toLowerCase()
    const examQuestions = selectedExam?.questions || []
    if (!keyword) return examQuestions
    return examQuestions.filter((question) => question.content.toLowerCase().includes(keyword))
  }, [selectedExam, examQuestionKeyword])

  const remainingSlots = Math.max((selectedExam?.requiredQuestionCount || 0) - (selectedExam?.questionCount || 0), 0)

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
    if (!selectedExam?.subjectId) {
      setSubjectQuestions([])
      setSelectedQuestionIds([])
      setSelectedExamQuestionIds([])
      return
    }

    api.get('/questions', { params: { subjectId: selectedExam.subjectId } })
      .then(({ data }) => {
        setSubjectQuestions(data)
      })
      .catch(() => {
        setSubjectQuestions([])
        setSelectedQuestionIds([])
        setSelectedExamQuestionIds([])
      })
  }, [selectedExam?.id, selectedExam?.subjectId])

  useEffect(() => {
    setSelectedQuestionIds([])
    setSelectedExamQuestionIds([])
    setBankKeyword('')
    setExamQuestionKeyword('')
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
    setSelectedExamQuestionIds(filteredExamQuestions.map((question) => question.id))
  }

  const handleSelectAllBankQuestions = () => {
    setSelectedQuestionIds(filteredBankQuestions.map((question) => question.id))
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
        await api.post(`/drafts/${selectedExam.id}/questions/bulk`, {
          questionIds,
        })
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
      await loadExams(selectedExam.id)
      const { data } = await api.get(`/drafts/${selectedExam.id}`)
      setSelectedExamDetail(normalizeExam(data))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add selected questions.')
    } finally {
      setBusy(false)
    }
  }

  const handleRandomizeQuestions = async () => {
    if (!selectedExam) return
    const pool = availableQuestions
    const maxCount = Math.min(Number(randomCount) || 0, pool.length, remainingSlots)
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
    if (!selectedExam || !examQuestionIds.length) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      for (const examQuestionId of examQuestionIds) {
        await api.delete(`/drafts/${selectedExam.id}/questions/${examQuestionId}`)
      }
      setSelectedExamQuestionIds([])
      setMessage(`${examQuestionIds.length} question(s) removed from draft.`)
      await loadExams(selectedExam.id)
      const { data } = await api.get(`/drafts/${selectedExam.id}`)
      setSelectedExamDetail(normalizeExam(data))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove selected questions.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageSection title="Draft Management" description="Create draft question sets and prepare them for publishing later.">
      <div className="stack">
        <div className="two-column draft-top-layout">
          <div className="panel stack">
            <div className="row-between wrap-row">
              <div>
                <h3>Draft list</h3>
                <p className="muted">Select a draft to manage its questions.</p>
              </div>
              <button type="button" className="primary-button" onClick={beginCreate}>
                Create draft
              </button>
            </div>

            {error ? <p className="error-text">{error}</p> : null}
            {message ? <p className="success-text">{message}</p> : null}

            <div className="draft-list">
              {exams.map((exam) => (
                <article
                  key={exam.id}
                  className={selectedExamId === exam.id ? 'question-card selected-card draft-list-card draft-list-card-compact' : 'question-card draft-list-card draft-list-card-compact'}
                  onClick={() => {
                    setSelectedExamId(exam.id)
                    beginEdit(exam)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedExamId(exam.id)
                      beginEdit(exam)
                    }
                  }}
                >
                  <div className="row-between wrap-row">
                    <div>
                      <h3>{exam.title}</h3>
                      <p className="muted">{exam.subjectName}</p>
                    </div>
                    <div className="action-row">
                      <span className="muted">{exam.questionCount} / {exam.requiredQuestionCount} questions</span>
                      {exam.published ? <span className="pill">Published</span> : null}
                      <button
                        type="button"
                        className="icon-button danger-icon-button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDeleteExam(exam.id)
                        }}
                        disabled={busy}
                        aria-label={`Delete ${exam.title}`}
                      >
                        x
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!exams.length ? <p className="muted">No drafts yet. Create the first draft to get started.</p> : null}
          </div>

          {showCreateForm || editingExamId ? (
            <ExamEditor
              form={form}
              subjects={subjects}
              busy={busy}
              editingId={editingExamId}
              onChange={updateForm}
              onSubmit={handleSubmitExam}
              onCancel={resetForm}
            />
          ) : (
            <div className="panel stack draft-editor-placeholder">
              <h3>Edit draft</h3>
              <p className="muted">Select a draft card or create a new draft to edit it here.</p>
            </div>
          )}
        </div>

        {selectedExam ? (
          <div className="stack">
            <div className="two-column exam-management-layout">
              <div className="panel stack exam-bank-panel">
                <div className="row-between wrap-row">
                  <h3>Exam question list</h3>
                  <span className="muted">{selectedExam.questionCount} / {selectedExam.requiredQuestionCount} questions</span>
                </div>

                <label>
                  Search exam questions
                  <input
                    value={examQuestionKeyword}
                    onChange={(event) => setExamQuestionKeyword(event.target.value)}
                    placeholder="Search question text"
                  />
                </label>

                <div className="question-bank-list">
                  {filteredExamQuestions.map((question, index) => (
                    <label key={getExamQuestionKey(question, index)} className="question-bank-item">
                      <input
                        type="checkbox"
                        checked={selectedExamQuestionIds.includes(question.id)}
                        onChange={() => handleToggleExamQuestion(question.id)}
                        disabled={busy}
                      />
                      <span>{question.content}</span>
                    </label>
                  ))}
                </div>

                <div className="action-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleSelectAllExamQuestions}
                    disabled={busy || !filteredExamQuestions.length}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setSelectedExamQuestionIds([])}
                    disabled={busy || !selectedExamQuestionIds.length}
                  >
                    Clear selected
                  </button>
                  
                </div>
                <div>
                  <span className="muted">{selectedExamQuestionIds.length} selected</span>
                <div className="action-row action-row-end">
                  <button
                    type="button"
                    className="danger-button ghost-button"
                    onClick={() => handleRemoveSelectedQuestions()}
                    disabled={busy || !selectedExamQuestionIds.length}
                  >
                    Remove selected
                  </button>
                  
                </div>
                </div>
                  

                {!selectedExam.questions?.length ? <p className="muted">This draft has no questions yet.</p> : null}
              </div>

              <div className="panel stack exam-bank-panel">
                <div className="row-between wrap-row">
                  <div>
                    <h3>Question bank</h3>
                  </div>
                </div>

                <label>
                  Search bank
                  <input
                    value={bankKeyword}
                    onChange={(event) => setBankKeyword(event.target.value)}
                    placeholder="Search question text"
                  />
                </label>

                <div className="question-bank-list">
                  {filteredBankQuestions.map((question) => (
                    <label key={question.id} className="question-bank-item">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(question.id)}
                        onChange={() => handleToggleQuestion(question.id)}
                        disabled={busy}
                      />
                      <span>{question.content}</span>
                    </label>
                  ))}
                </div>

                <div className="action-row">
                 
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleRandomizeQuestions()}
                    disabled={busy || !availableQuestions.length || remainingSlots < 1}
                  >
                    Random select
                    
                  </button>
                  
                  <label className="inline-number-field">

                    <input
                      type="number"
                      min="1"
                      value={randomCount}
                      onChange={(event) => setRandomCount(event.target.value)}
                      disabled={busy || remainingSlots < 1}
                    />
                  </label>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setSelectedQuestionIds([])}
                    disabled={busy || !selectedQuestionIds.length}
                  >
                    Clear selected
                  </button>
                </div>
                <div>
                  <span className="muted">{selectedQuestionIds.length} selected       | </span>
                  <span className="muted">{remainingSlots} slots remaining</span>
                  <div className="action-row action-row-end">
                  
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleAddSelectedQuestions()}
                    disabled={busy || !selectedQuestionIds.length || remainingSlots < 1}
                  >
                    Add selected
                  </button>
                </div>
                </div>
                  
                

                {!availableQuestions.length ? <p className="muted">All questions from this subject are already in the draft.</p> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageSection>
  )
}

export function PublishedExamsPage() {
  const [drafts, setDrafts] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadDrafts = async () => {
    const { data } = await api.get('/drafts')
    setDrafts(data)
  }

  useEffect(() => {
    loadDrafts().catch(() => setError('Unable to load drafts for publishing.'))
  }, [])

  const handlePublishToggle = async (draft) => {
    setBusyId(draft.id)
    setError('')
    setMessage('')
    try {
      if (draft.published) {
        await api.patch(`/exams/${draft.id}/unpublish`)
        setMessage('Draft unpublished.')
      } else {
        await api.patch(`/exams/${draft.id}/publish`)
        setMessage('Draft published.')
      }
      await loadDrafts()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update publish state.')
    } finally {
      setBusyId(null)
    }
  }

  const publishedDrafts = drafts.filter((draft) => draft.published)

  return (
    <PageSection title="Exam Publishing" description="Choose which drafts are published and ready for scheduling.">
      <div className="stack">
        <div className="panel stack">
          <div>
            <h3>Published exams</h3>
            <p className="muted">{publishedDrafts.length} published draft(s).</p>
          </div>
          {publishedDrafts.length ? (
            <div className="card-grid">
              {publishedDrafts.map((draft) => (
                <article key={draft.id} className="question-card selected-card">
                  <div className="row-between wrap-row">
                    <div>
                      <h3>{draft.title}</h3>
                      <p className="muted">{draft.subjectName}</p>
                    </div>
                    <span className="pill">Published</span>
                  </div>
                  <p className="muted">{draft.description || 'No description'}</p>
                  <div className="question-meta">
                    <span>{draft.questionCount} / {draft.requiredQuestionCount} questions</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No published exams yet.</p>
          )}
        </div>

        <div className="panel stack">
          <div>
            <h3>Drafts ready to publish</h3>
            <p className="muted">A draft can be published when its current question count exactly matches the required question count.</p>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="success-text">{message}</p> : null}

          <div className="card-grid">
            {drafts.map((draft) => {
              const isReady = draft.questionCount === draft.requiredQuestionCount && draft.questionCount > 0
              const isBusy = busyId === draft.id

              return (
                <article key={draft.id} className={draft.published ? 'question-card selected-card' : 'question-card'}>
                  <div className="row-between wrap-row">
                    <div>
                      <h3>{draft.title}</h3>
                      <p className="muted">{draft.subjectName}</p>
                    </div>
                    {draft.published ? <span className="pill">Published</span> : null}
                  </div>
                  <p className="muted">{draft.description || 'No description'}</p>
                  <div className="question-meta">
                    <span>{draft.questionCount} / {draft.requiredQuestionCount} questions</span>
                  </div>
                  {!draft.published && !isReady ? (
                    <p className="error-text">This draft is not ready to publish yet.</p>
                  ) : null}
                  <div className="action-row">
                    <button
                      type="button"
                      className={draft.published ? 'ghost-button' : 'primary-button'}
                      onClick={() => handlePublishToggle(draft)}
                      disabled={isBusy || (!draft.published && !isReady)}
                    >
                      {isBusy ? 'Saving...' : draft.published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {!drafts.length ? <p className="muted">No drafts available.</p> : null}
        </div>
      </div>
    </PageSection>
  )
}

export function AdminSessionsPage() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    api.get('/exam-sessions').then(({ data }) => setSessions(data))
  }, [])

  return (
    <PageSection title="Session Management" description="Scheduled exam instances with open/close times and attempt rules.">
      <DataTable
        columns={['Title', 'Exam', 'Status', 'Duration', 'Attempts', 'Window']}
        rows={sessions.map((session) => [
          session.title,
          session.examTitle,
          session.status,
          `${session.durationMinutes} min`,
          session.maxAttempts,
          `${formatDate(session.openTime)} - ${formatDate(session.closeTime)}`,
        ])}
      />
    </PageSection>
  )
}

export function ResultsMonitorPage() {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState('')
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    api.get('/exam-sessions').then(({ data }) => {
      setSessions(data)
      if (data[0]) setSelectedSession(String(data[0].id))
    })
  }, [])

  useEffect(() => {
    if (!selectedSession) return
    api.get(`/exam-sessions/${selectedSession}/attempts`).then(({ data }) => setAttempts(data))
  }, [selectedSession])

  return (
    <PageSection title="Attempt Monitoring" description="Review result details by exam session.">
      <div className="panel stack">
        <label>
          Select session
          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>{session.title}</option>
            ))}
          </select>
        </label>
      </div>
      <DataTable
        columns={['Exam', 'Session', 'Status', 'Score', 'Started', 'Submitted']}
        rows={attempts.map((attempt) => [
          attempt.examTitle,
          attempt.sessionTitle,
          attempt.status,
          attempt.score,
          formatDate(attempt.startedAt),
          formatDate(attempt.submittedAt),
        ])}
      />
    </PageSection>
  )
}

export function StatisticsPage() {
  const [overview, setOverview] = useState(null)
  const [examStats, setExamStats] = useState([])
  const [questionStats, setQuestionStats] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/exam-stats'),
      api.get('/dashboard/question-stats'),
    ]).then(([overviewRes, examRes, questionRes]) => {
      setOverview(overviewRes.data)
      setExamStats(examRes.data)
      setQuestionStats(questionRes.data)
    })
  }, [])

  return (
    <PageSection title="Statistics" description="Basic system reporting for the first version MVP.">
      <StatsCards
        stats={[
          ['Users', overview?.totalUsers ?? 0],
          ['Attempts', overview?.totalAttempts ?? 0],
          ['Total questions', questionStats?.totalQuestions ?? 0],
          ['Subjects', questionStats?.totalSubjects ?? 0],
        ]}
      />
      <DataTable
        columns={['Session', 'Average score', 'Highest', 'Lowest', 'Participation']}
        rows={examStats.map((item) => [item.sessionTitle, item.averageScore, item.highestScore, item.lowestScore, item.participationCount])}
      />
    </PageSection>
  )
}
