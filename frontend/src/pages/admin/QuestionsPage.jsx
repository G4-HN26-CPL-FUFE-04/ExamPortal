import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageSection } from '../../components/CommonUI'
import { api, toSubjectSlug } from '../../lib/appCore'

function getManagerBasePath() {
  return window.location.pathname.startsWith('/instructor') ? '/instructor' : '/admin'
}

export default function QuestionsPage() {
  const [subjects, setSubjects] = useState([])
  const basePath = getManagerBasePath()

  useEffect(() => {
    api.get('/subjects').then(({ data }) => setSubjects(data))
  }, [])

  return (
    <PageSection title="Question Bank" description="Choose a subject first. Each subject has its own question bank URL.">
      <div className="card-grid">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            to={`${basePath}/questions/${toSubjectSlug(subject.name)}`}
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
