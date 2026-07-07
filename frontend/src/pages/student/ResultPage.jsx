import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LoadingPanel, PageSection, StatsCards } from '../../components/CommonUI'
import { api } from '../../lib/appCore'

export default function ResultPage() {
  const { id } = useParams()
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.get(`/attempts/${id}`).then(({ data }) => setResult(data))
  }, [id])

  if (!result) return <LoadingPanel />

  return (
    <PageSection title="Result Review" description="Detailed score summary and answer review for the submitted attempt.">
      <StatsCards
        stats={[
          ['Score', result.score],
          ['Correct', result.correctAnswers],
          ['Wrong', result.wrongAnswers],
          ['Unanswered', result.unansweredAnswers],
          ['Time spent', `${result.completionSeconds || 0}s`],
        ]}
      />
      <div className="stack">
        {result.answerReview.map((answer) => (
          <article key={answer.questionId} className="panel stack">
            <div className="row-between">
              <h3>{answer.content}</h3>
              <span className={answer.correct ? 'pill success' : 'pill danger'}>
                {answer.correct ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p>Selected answer: {answer.selectedLabel || 'Unanswered'}</p>
            <p>Correct answer: {answer.correctLabel}</p>
          </article>
        ))}
      </div>
    </PageSection>
  )
}
