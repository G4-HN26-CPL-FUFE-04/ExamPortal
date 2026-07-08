import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageSection } from '../../components/CommonUI'
import { api, toQuestionBankSlug, toSubjectSlug } from '../../lib/appCore'

function getManagerBasePath() {
  return window.location.pathname.startsWith('/instructor') ? '/instructor' : '/admin'
}

const questionImportSample = `Q: What is 2 + 2?
A: 3
B: 4
C: 5
D: 6
ANSWER: B
`

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
  importPreviewErrors,
  importMessage,
  busy,
  onChangeText,
  onFileSelect,
  onClear,
  onRemoveInvalidBlocks,
  onImport,
  onCancel,
}) {
  return (
    <div className="panel stack">
      <div className="row-between wrap-row">
        <div>
          <h3>Import questions</h3>
          <p className="muted">Use format Q / A / B / C / D / ANSWER. Questions are imported into the current bank only.</p>
        </div>
        <button type="button" className="ghost-button" onClick={onCancel}>
          Close
        </button>
      </div>

      <label>
        Paste text
        <div className="import-textarea-wrap">
          <textarea
            value={importText}
            onChange={(event) => onChangeText(event.target.value)}
            rows="8"
            placeholder={questionImportSample}
            className="import-textarea"
          />
          <button type="button" className="import-clear-button" onClick={onClear} disabled={!importText.trim()}>
            Clear
          </button>
        </div>
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
        {importPreviewErrors.length ? (
          <button type="button" className="ghost-button danger-button" onClick={onRemoveInvalidBlocks} disabled={busy}>
            Remove invalid blocks
          </button>
        ) : null}
      </div>

      {importError ? <p className="error-text">{importError}</p> : null}
      {importMessage ? <p className="success-text">{importMessage}</p> : null}
      {importPreviewErrors.length ? (
        <div className="stack">
          <h4>Invalid blocks</h4>
          {importPreviewErrors.map((item) => (
            <article key={item.blockNumber} className="import-error-card">
              <strong>Block {item.blockNumber}</strong>
              <p className="muted">{item.message}</p>
              <pre className="json-preview">{item.rawBlock}</pre>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function splitImportBlocks(rawText) {
  return String(rawText || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
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

export default function SubjectQuestionsPage() {
  const { subjectSlug, bankSlug } = useParams()
  const navigate = useNavigate()
  const basePath = getManagerBasePath()
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
  const [subjectsLoaded, setSubjectsLoaded] = useState(false)
  const [banks, setBanks] = useState([])
  const [banksLoaded, setBanksLoaded] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [isEditingBankName, setIsEditingBankName] = useState(false)
  const [bankNameDraft, setBankNameDraft] = useState('')
  const [keyword, setKeyword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [importPreviewErrors, setImportPreviewErrors] = useState([])
  const [importBusy, setImportBusy] = useState(false)
  const [pendingSubjectSlug, setPendingSubjectSlug] = useState('')
  const [pendingBankSlug, setPendingBankSlug] = useState('')

  const selectedSubject = useMemo(
    () => {
      const activeSlug = pendingSubjectSlug || subjectSlug
      return subjects.find((subject) => toSubjectSlug(subject.name) === activeSlug)
    },
    [pendingSubjectSlug, subjects, subjectSlug],
  )

  const selectedBank = useMemo(
    () => {
      const activeSlug = pendingBankSlug || bankSlug
      return banks.find((bank) => toQuestionBankSlug(bank.name) === activeSlug)
    },
    [bankSlug, banks, pendingBankSlug],
  )

  const loadQuestions = async (questionBankId = selectedBank?.id) => {
    if (!questionBankId) return
    const params = { questionBankId }
    if (keyword.trim()) params.keyword = keyword.trim()
    const { data } = await api.get('/questions', { params })
    setQuestions(data)
  }

  useEffect(() => {
    api.get('/subjects')
      .then(({ data }) => {
        setSubjects(data)
        setSubjectsLoaded(true)
      })
      .catch(() => {
        setSubjectsLoaded(true)
        setError('Unable to load subjects.')
      })
  }, [])

  useEffect(() => {
    if (subjectsLoaded && subjects.length && !selectedSubject) {
      navigate(`${basePath}/subjects`, { replace: true })
    }
  }, [basePath, navigate, selectedSubject, subjects, subjectsLoaded])

  useEffect(() => {
    if (pendingSubjectSlug === subjectSlug) {
      setPendingSubjectSlug('')
    }
  }, [pendingSubjectSlug, subjectSlug])

  useEffect(() => {
    if (pendingBankSlug === bankSlug) {
      setPendingBankSlug('')
    }
  }, [bankSlug, pendingBankSlug])

  useEffect(() => {
    if (!selectedSubject) return
    setBanksLoaded(false)
    api.get('/question-banks', { params: { subjectId: selectedSubject.id } })
      .then(({ data }) => {
        setBanks(data)
        setBanksLoaded(true)
      })
      .catch(() => {
        setBanks([])
        setBanksLoaded(true)
        setError('Unable to load question banks.')
      })
  }, [selectedSubject?.id])

  useEffect(() => {
    if (banksLoaded && !selectedBank) {
      navigate(`${basePath}/subjects/${subjectSlug}`, { replace: true })
    }
  }, [basePath, bankSlug, banksLoaded, navigate, selectedBank, subjectSlug])

  useEffect(() => {
    if (!selectedBank) return
    setBankNameDraft(selectedBank.name)
  }, [selectedBank?.id, selectedBank?.name])

  useEffect(() => {
    loadQuestions().catch(() => setError('Unable to load questions.'))
  }, [selectedBank?.id, keyword])

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
    setImportPreviewErrors([])
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
      if (!selectedBank) {
        setError('Please choose a question bank first.')
        return
      }
      const payload = {
        ...form,
        questionBankId: Number(selectedBank.id),
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
      loadQuestions(selectedBank.id)
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
    loadQuestions(selectedBank.id)
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
    setImportPreviewErrors([])
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const content = await file.text()
    setImportText(content)
    setImportError('')
    setImportMessage('')
    setImportPreviewErrors([])
  }

  const handleConfirmImport = async () => {
    if (!selectedBank) return
    setImportBusy(true)
    setImportError('')
    setImportMessage('')
    setImportPreviewErrors([])
    try {
      const previewPayload = {
        questionBankId: Number(selectedBank.id),
        rawText: importText,
      }
      const { data: preview } = await api.post('/question-imports/preview', previewPayload)
      if (preview.errors.length) {
        setImportPreviewErrors(preview.errors)
        setImportError('Some blocks are invalid. Remove them or fix them before importing.')
        return
      }

      const { data } = await api.post('/question-imports', {
        questionBankId: Number(selectedBank.id),
        rawText: importText,
      })
      setImportMessage(`Imported ${data.importedCount} questions.`)
      setImportText('')
      setImportPreviewErrors([])
      loadQuestions(selectedBank.id)
    } catch (requestError) {
      setImportError(requestError.response?.data?.message || `Unable to import questions (${requestError.response?.status || 'network error'}).`)
    } finally {
      setImportBusy(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedQuestionId((prev) => (prev === id ? null : id))
  }

  const handleRemoveInvalidBlocks = () => {
    if (!importPreviewErrors.length) return
    const invalidBlockNumbers = new Set(importPreviewErrors.map((item) => item.blockNumber))
    const cleanedText = splitImportBlocks(importText)
      .filter((_, index) => !invalidBlockNumbers.has(index + 1))
      .join('\n\n')

    setImportText(cleanedText)
    setImportPreviewErrors([])
    setImportError(cleanedText ? 'Invalid blocks removed. Review the remaining content, then import again.' : '')
    setImportMessage(cleanedText ? '' : 'All invalid blocks were removed.')
  }

  const handleBankRename = async (event) => {
    event.preventDefault()
    if (!selectedSubject || !selectedBank) return
    setError('')
    setMessage('')
    try {
      const { data } = await api.put(`/question-banks/${selectedBank.id}`, {
        name: bankNameDraft.trim(),
        subjectId: selectedSubject.id,
      })
      const nextSlug = toQuestionBankSlug(data.name)
      setPendingBankSlug(nextSlug)
      setBanks((prev) => prev.map((bank) => (bank.id === data.id ? data : bank)))
      setIsEditingBankName(false)
      setMessage('Question bank updated.')
      navigate(`${basePath}/subjects/${subjectSlug}/${nextSlug}`, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save question bank.')
    }
  }

  if (!selectedSubject || !selectedBank) {
    return (
      <PageSection title="Question Bank" description="Loading question bank...">
        <div className="panel">
          <p>Loading...</p>
        </div>
      </PageSection>
    )
  }

  return (
    <PageSection title={`${selectedBank.name}`} description={`Questions in ${selectedSubject.name} / ${selectedBank.name}.`}>
      <div className="stack">
        <div className="panel stack">
          <div className="row-between wrap-row">
            <div>
              <p className="eyebrow">Subject / Bank</p>
              <h3>{selectedSubject.name}</h3>
              {isEditingBankName ? (
                <form className="subject-inline-edit" onSubmit={handleBankRename}>
                  <input
                    value={bankNameDraft}
                    onChange={(event) => setBankNameDraft(event.target.value)}
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
                        setIsEditingBankName(false)
                        setBankNameDraft(selectedBank.name)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="subject-title-row">
                  <p className="subject-bank-title">{selectedBank.name}</p>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Edit question bank name"
                    onClick={() => {
                      setIsEditingBankName(true)
                      setBankNameDraft(selectedBank.name)
                    }}
                  >
                    <PencilIcon />
                  </button>
                </div>
              )}
            </div>
            <div className="action-row">
              <Link to={`${basePath}/subjects/${subjectSlug}`} className="ghost-button back-link-button">Back to banks</Link>
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
            importPreviewErrors={importPreviewErrors}
            importMessage={importMessage}
            busy={importBusy}
            onChangeText={(value) => {
              setImportText(value)
              setImportError('')
              setImportMessage('')
              setImportPreviewErrors([])
            }}
            onFileSelect={handleImportFile}
            onClear={() => {
              setImportText('')
              setImportError('')
              setImportMessage('')
              setImportPreviewErrors([])
            }}
            onRemoveInvalidBlocks={handleRemoveInvalidBlocks}
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
                {item.correctOptionLabel ? `${item.correctOptionLabel}. ${item.correctOptionContent}` : 'Not set'}
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

          {!questions.length ? <p className="muted">No questions found for this bank.</p> : null}
        </div>
      </div>
    </PageSection>
  )
}
