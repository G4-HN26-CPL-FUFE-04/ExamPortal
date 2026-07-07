import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingPanel, PageSection } from '../../components/CommonUI'
import { api, formatTimer } from '../../lib/appCore'

const studentBasePath = '/student'

function getRemainingSeconds(attempt) {
  if (!attempt?.startedAt) return Math.max((attempt?.durationMinutes || 1) * 60, 60)
  const startedAt = new Date(attempt.startedAt).getTime()
  const durationMs = (attempt.durationMinutes || 1) * 60 * 1000
  const deadline = startedAt + durationMs
  return Math.max(Math.floor((deadline - Date.now()) / 1000), 0)
}

export default function AttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [selected, setSelected] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef(null)
  const submittedRef = useRef(false)
  const selectedRef = useRef({})

  const handleSubmit = async (autoSubmitted = false) => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        autoSubmitted,
        answers: Object.entries(selectedRef.current).map(([questionId, selectedOptionId]) => ({
          questionId: Number(questionId),
          selectedOptionId,
        })),
      }
      const { data } = await api.post(`/attempts/${id}/submit`, payload)
      navigate(`${studentBasePath}/results/${data.id}`, { replace: true })
    } catch (requestError) {
      submittedRef.current = false
      setSubmitting(false)
      setError(requestError.response?.data?.message || 'Unable to submit this attempt.')
    }
  }

  useEffect(() => {
    api.get(`/attempts/${id}`).then(({ data }) => {
      if (data.status !== 'IN_PROGRESS') {
        navigate(`${studentBasePath}/results/${data.id}`, { replace: true })
        return
      }
      setAttempt(data)
      selectedRef.current = {}
      setSecondsLeft(getRemainingSeconds(data))
    }).catch(() => {
      setError('Unable to load attempt data.')
    })
  }, [id, navigate])

  useEffect(() => {
    if (!attempt?.questions?.length) return undefined

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timerRef.current)
  }, [attempt])

  useEffect(() => () => window.clearInterval(timerRef.current), [])

  const handleSelect = (questionId, optionId) => {
    setSelected((prev) => {
      const next = { ...prev, [questionId]: optionId }
      selectedRef.current = next
      return next
    })
  }

  if (!attempt) {
    return error ? (
      <PageSection title="Attempt">
        <div className="panel"><p className="error-text">{error}</p></div>
      </PageSection>
    ) : <LoadingPanel />
  }

  const questions = attempt.questions || []
  const question = questions[currentIndex]
  const answeredCount = Object.keys(selected).length

  if (!question) {
    return (
      <PageSection title={attempt.examTitle} description="This attempt does not have any active questions.">
        <div className="panel stack">
          <p className="error-text">No questions are available for this attempt.</p>
        </div>
      </PageSection>
    )
  }

  return (
    <PageSection title={attempt.examTitle} description="Complete the exam within the time limit, then submit for scoring.">
      <div className="attempt-layout">
        <section className="panel stack">
          <div className="row-between wrap-row">
            <strong>Question {currentIndex + 1} / {questions.length}</strong>
            <span className="timer">{formatTimer(secondsLeft)}</span>
          </div>
          <div className="attempt-meta-row">
            <span className="pill">{answeredCount} answered</span>
            <span className="pill">{questions.length - answeredCount} remaining</span>
          </div>
          <h3>{question.content}</h3>
          <div className="stack">
            {question.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={selected[question.questionId] === option.id ? 'option-button active' : 'option-button'}
                onClick={() => handleSelect(question.questionId, option.id)}
                disabled={submitting}
              >
                <strong>{option.label}.</strong> {option.content}
              </button>
            ))}
          </div>
          <div className="row-between wrap-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={submitting}
            >
              Previous
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
              disabled={submitting}
            >
              Next
            </button>
          </div>
        </section>

        <aside className="panel stack">
          <h3>Question Palette</h3>
          <div className="palette">
            {questions.map((item, index) => (
              <button
                key={item.questionId}
                type="button"
                className={[
                  'palette-item',
                  currentIndex === index ? 'active' : '',
                  selected[item.questionId] ? 'palette-item-complete' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setCurrentIndex(index)}
                disabled={submitting}
              >
                {index + 1}
              </button>
            ))}
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="button" className="primary-button" onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </aside>
      </div>
    </PageSection>
  )
}
