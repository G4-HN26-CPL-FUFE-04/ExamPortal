import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageSection } from '../../components/CommonUI'
import { api, formatDate } from '../../lib/appCore'

function membershipClass(status) {
  return status === 'APPROVED' ? 'pill success' : 'pill'
}

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroomId, setSelectedClassroomId] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [assignments, setAssignments] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedClassroom = useMemo(
    () => classrooms.find((item) => item.id === selectedClassroomId) || null,
    [classrooms, selectedClassroomId],
  )

  const loadClassrooms = async (preferredId = selectedClassroomId) => {
    const { data } = await api.get('/classrooms')
    setClassrooms(data)
    if (!data.length) {
      setSelectedClassroomId(null)
      return
    }

    const matched = preferredId ? data.find((item) => item.id === preferredId) : null
    setSelectedClassroomId((matched || data[0]).id)
  }

  const loadAssignments = async (classroomId, membershipStatus) => {
    if (!classroomId || membershipStatus !== 'APPROVED') {
      setAssignments([])
      return
    }
    const { data } = await api.get(`/classrooms/${classroomId}/exam-assignments`)
    setAssignments(data)
  }

  useEffect(() => {
    loadClassrooms().catch(() => setError('Unable to load classrooms.'))
  }, [])

  useEffect(() => {
    if (!selectedClassroom) return
    loadAssignments(selectedClassroom.id, selectedClassroom.membershipStatus).catch(() => {
      setError('Unable to load classroom assignments.')
    })
  }, [selectedClassroom])

  const handleJoin = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { data } = await api.post('/classrooms/join', { joinCode: joinCode.trim() })
      setJoinCode('')
      await loadClassrooms(data.id)
      setMessage('Join request sent. Wait for instructor approval.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to join classroom.')
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async (classroomId) => {
    if (!window.confirm('Leave this classroom?')) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.delete(`/classrooms/${classroomId}/membership`)
      await loadClassrooms()
      setAssignments([])
      setMessage('Classroom removed.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to leave classroom.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageSection title="Classes">
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="two-column">
        <div className="stack">
          <form className="panel stack" onSubmit={handleJoin}>
            <div className="row-between">
              <h3>Join classroom</h3>
              <button type="submit" className="primary-button" disabled={busy || !joinCode.trim()}>
                Join
              </button>
            </div>
            <label>
              Join code
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} required />
            </label>
          </form>

          <div className="stack classroom-list">
            {classrooms.map((classroom) => (
              <button
                key={classroom.id}
                type="button"
                className={selectedClassroomId === classroom.id ? 'panel classroom-card active' : 'panel classroom-card'}
                onClick={() => setSelectedClassroomId(classroom.id)}
              >
                <div className="row-between">
                  <strong>{classroom.name}</strong>
                  <span className={membershipClass(classroom.membershipStatus)}>{classroom.membershipStatus}</span>
                </div>
                <div className="row-between">
                  <span className="muted">{classroom.approvedStudentCount} students</span>
                  <span className="muted">{classroom.pendingStudentCount} pending</span>
                </div>
              </button>
            ))}
            {!classrooms.length ? <div className="panel"><p className="muted">You have not joined any classroom yet.</p></div> : null}
          </div>
        </div>

        <div className="stack">
          {selectedClassroom ? (
            <>
              <div className="panel stack">
                <div className="row-between wrap-row">
                  <div>
                    <h3>{selectedClassroom.name}</h3>
                    <p className="muted">Created {formatDate(selectedClassroom.createdAt)}</p>
                  </div>
                  <div className="action-row">
                    <span className={membershipClass(selectedClassroom.membershipStatus)}>{selectedClassroom.membershipStatus}</span>
                    <button type="button" className="ghost-button" onClick={() => handleLeave(selectedClassroom.id)} disabled={busy}>
                      Leave
                    </button>
                  </div>
                </div>
              </div>

              <div className="panel stack">
                <h3>Assigned sessions</h3>
                {selectedClassroom.membershipStatus === 'APPROVED' ? (
                  assignments.length ? assignments.map((assignment) => (
                    <div key={assignment.id} className="classroom-row">
                      <div>
                        <strong>{assignment.examSessionTitle}</strong>
                        <p className="muted">{assignment.examTitle}</p>
                        <p className="muted">{formatDate(assignment.openTime)} - {formatDate(assignment.closeTime)}</p>
                      </div>
                      <Link to={`/student/exam-sessions/${assignment.examSessionId}`} className="primary-link">Open</Link>
                    </div>
                  )) : <p className="muted">No exam sessions assigned yet.</p>
                ) : (
                  <p className="muted">Assignments will appear after instructor approval.</p>
                )}
              </div>
            </>
          ) : (
            <div className="panel">
              <p className="muted">Select a classroom to view its status.</p>
            </div>
          )}
        </div>
      </div>
    </PageSection>
  )
}
