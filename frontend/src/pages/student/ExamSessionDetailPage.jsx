import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { InfoGrid, LoadingPanel, PageSection } from '../../components/CommonUI'
import { api, formatDate } from '../../lib/appCore'

const studentBasePath = '/student'

export default function ExamSessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [currentAttempt, setCurrentAttempt] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/exam-sessions/${id}`).then(({ data }) => setSession(data))
  }, [id])

  useEffect(() => {
    api.get('/my-attempts')
      .then(({ data }) => {
        const activeAttempt = data.find((attempt) => attempt.sessionId === Number(id) && attempt.status === 'IN_PROGRESS')
        setCurrentAttempt(activeAttempt || null)
      })
      .catch(() => {
        setCurrentAttempt(null)
      })
  }, [id])

  const handleStart = async () => {
    setError('')
    if (currentAttempt) {
      navigate(`${studentBasePath}/attempts/${currentAttempt.id}`)
      return
    }
    try {
      const { data } = await api.post(`/exam-sessions/${id}/start`)
      navigate(`${studentBasePath}/attempts/${data.id}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to start this exam.')
    }
  }

  if (!session) return <LoadingPanel />

  return (
    <PageSection title={session.title} description="Session detail page for online participation.">
      <div className="panel stack">
        <InfoGrid
          items={[
            ['Exam', session.examTitle],
            ['Open time', formatDate(session.openTime)],
            ['Close time', formatDate(session.closeTime)],
            ['Duration', `${session.durationMinutes} minutes`],
            ['Question count', session.questionCount],
            ['Attempt rule', `${session.maxAttempts} attempts max`],
            ['Review after submit', session.showAnswersAfterSubmit ? 'Students can review correct answers' : 'Students only see their score'],
          ]}
        />
        {currentAttempt ? (
          <p className="muted">You already have an in-progress attempt for this session. Continue it here.</p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button type="button" className="primary-button" onClick={handleStart} disabled={session.status !== 'ACTIVE'}>
          {currentAttempt ? 'Continue Exam' : 'Start Exam'}
        </button>
      </div>
    </PageSection>
  )
}
