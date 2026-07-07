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

export function ExamsPage() {
  const [exams, setExams] = useState([])

  useEffect(() => {
    api.get('/exams').then(({ data }) => setExams(data))
  }, [])

  return (
    <PageSection title="Exam Management" description="Review exam status, duration, score configuration, and question count.">
      <DataTable
        columns={['Title', 'Subject', 'Duration', 'Total Score', 'Status', 'Questions']}
        rows={exams.map((exam) => [exam.title, exam.subjectName, `${exam.durationMinutes} min`, exam.totalScore, exam.status, exam.questionCount])}
      />
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
