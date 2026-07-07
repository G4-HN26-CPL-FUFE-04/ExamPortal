import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingPanel, PageSection } from '../../components/CommonUI'
import { api, formatTimer } from '../../lib/appCore'

const studentBasePath = '/student'

export default function AttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [selected, setSelected] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef(null)

  const handleSubmit = async (autoSubmitted = false) => {
    const payload = {
      autoSubmitted,
      answers: Object.entries(selected).map(([questionId, selectedOptionId]) => ({
        questionId: Number(questionId),
        selectedOptionId,
      })),
    }
    const { data } = await api.post(`/attempts/${id}/submit`, payload)
    navigate(`${studentBasePath}/results/${data.id}`)
  }

  useEffect(() => {
    api.get(`/attempts/${id}`).then(({ data }) => {
      setAttempt(data)
      setSecondsLeft(Math.max((data.durationMinutes || 1) * 60, 60))
    })
  }, [id])

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

  const handleSelect = (questionId, optionId) => {
    setSelected((prev) => ({ ...prev, [questionId]: optionId }))
  }

  if (!attempt) return <LoadingPanel />

  const question = attempt.questions[currentIndex]

  return (
    <PageSection title={attempt.examTitle} description="Attempt page with countdown, navigation, and quick question palette.">
      <div className="attempt-layout">
        <section className="panel stack">
          <div className="row-between">
            <strong>Question {currentIndex + 1} / {attempt.questions.length}</strong>
            <span className="timer">{formatTimer(secondsLeft)}</span>
          </div>
          <h3>{question.content}</h3>
          <div className="stack">
            {question.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={selected[question.questionId] === option.id ? 'option-button active' : 'option-button'}
                onClick={() => handleSelect(question.questionId, option.id)}
              >
                <strong>{option.label}.</strong> {option.content}
              </button>
            ))}
          </div>
          <div className="row-between">
            <button type="button" className="ghost-button" onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}>
              Previous
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, attempt.questions.length - 1))}
            >
              Next
            </button>
          </div>
        </section>

        <aside className="panel stack">
          <h3>Question Palette</h3>
          <div className="palette">
            {attempt.questions.map((item, index) => (
              <button
                key={item.questionId}
                type="button"
                className={currentIndex === index ? 'palette-item active' : 'palette-item'}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button type="button" className="primary-button" onClick={() => handleSubmit(false)}>
            Submit Exam
          </button>
        </aside>
      </div>
    </PageSection>
  )
}
