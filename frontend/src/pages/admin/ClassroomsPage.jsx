import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageSection } from '../../components/CommonUI'
import { api, formatDate } from '../../lib/appCore'

function statusClass(status) {
  return status === 'APPROVED' ? 'pill success' : 'pill'
}

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedClassroomId, setSelectedClassroomId] = useState(null)
  const [members, setMembers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [createName, setCreateName] = useState('')
  const [editName, setEditName] = useState('')
  const [assignSessionId, setAssignSessionId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedClassroom = useMemo(
    () => classrooms.find((item) => item.id === selectedClassroomId) || null,
    [classrooms, selectedClassroomId],
  )

  const availableSessions = useMemo(() => {
    const assignedIds = new Set(assignments.map((item) => item.examSessionId))
    return sessions.filter((session) => !assignedIds.has(session.id))
  }, [assignments, sessions])

  const loadClassrooms = async (preferredId = selectedClassroomId) => {
    const { data } = await api.get('/classrooms')
    setClassrooms(data)
    if (!data.length) {
      setSelectedClassroomId(null)
      setEditName('')
      return
    }

    const matched = preferredId ? data.find((item) => item.id === preferredId) : null
    const next = matched || data[0]
    setSelectedClassroomId(next.id)
    setEditName(next.name)
  }

  const loadSessions = async () => {
    const { data } = await api.get('/exam-sessions')
    setSessions(data)
  }

  const loadSelectedClassroomData = async (classroomId) => {
    if (!classroomId) {
      setMembers([])
      setAssignments([])
      return
    }

    const [membersRes, assignmentsRes] = await Promise.all([
      api.get(`/classrooms/${classroomId}/members`),
      api.get(`/classrooms/${classroomId}/exam-assignments`),
    ])
    setMembers(membersRes.data)
    setAssignments(assignmentsRes.data)
  }

  useEffect(() => {
    Promise.all([loadClassrooms(), loadSessions()]).catch(() => {
      setError('Unable to load classroom data.')
    })
  }, [])

  useEffect(() => {
    if (!selectedClassroomId) return
    loadSelectedClassroomData(selectedClassroomId).catch(() => {
      setError('Unable to load classroom details.')
    })
  }, [selectedClassroomId])

  useEffect(() => {
    if (selectedClassroom) {
      setEditName(selectedClassroom.name)
    }
  }, [selectedClassroom])

  const handleCreate = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { data } = await api.post('/classrooms', { name: createName.trim() })
      setCreateName('')
      await loadClassrooms(data.id)
      setMessage('Classroom created.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create classroom.')
    } finally {
      setBusy(false)
    }
  }

  const handleRename = async (event) => {
    event.preventDefault()
    if (!selectedClassroom) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.put(`/classrooms/${selectedClassroom.id}`, { name: editName.trim() })
      await loadClassrooms(selectedClassroom.id)
      setMessage('Classroom updated.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update classroom.')
    } finally {
      setBusy(false)
    }
  }

  const handleRegenerateJoinCode = async () => {
    if (!selectedClassroom) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.post(`/classrooms/${selectedClassroom.id}/join-code`)
      await loadClassrooms(selectedClassroom.id)
      setMessage('Join code regenerated.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to regenerate join code.')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteClassroom = async () => {
    if (!selectedClassroom || !window.confirm(`Delete classroom "${selectedClassroom.name}"?`)) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.delete(`/classrooms/${selectedClassroom.id}`)
      await loadClassrooms()
      setMembers([])
      setAssignments([])
      setMessage('Classroom deleted.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete classroom.')
    } finally {
      setBusy(false)
    }
  }

  const handleApproveMember = async (memberId) => {
    if (!selectedClassroom) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.patch(`/classrooms/${selectedClassroom.id}/members/${memberId}/approve`)
      await Promise.all([loadClassrooms(selectedClassroom.id), loadSelectedClassroomData(selectedClassroom.id)])
      setMessage('Student approved.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to approve student.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!selectedClassroom || !window.confirm('Remove this student from the classroom?')) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.delete(`/classrooms/${selectedClassroom.id}/members/${memberId}`)
      await Promise.all([loadClassrooms(selectedClassroom.id), loadSelectedClassroomData(selectedClassroom.id)])
      setMessage('Student removed.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove student.')
    } finally {
      setBusy(false)
    }
  }

  const handleAssignSession = async (event) => {
    event.preventDefault()
    if (!selectedClassroom || !assignSessionId) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.post(`/classrooms/${selectedClassroom.id}/exam-assignments`, { examSessionId: Number(assignSessionId) })
      setAssignSessionId('')
      await loadSelectedClassroomData(selectedClassroom.id)
      setMessage('Exam session assigned.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to assign exam session.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId) => {
    if (!selectedClassroom) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.delete(`/classrooms/${selectedClassroom.id}/exam-assignments/${assignmentId}`)
      await loadSelectedClassroomData(selectedClassroom.id)
      setMessage('Assignment removed.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove assignment.')
    } finally {
      setBusy(false)
    }
  }

  const pendingMembers = members.filter((member) => member.status === 'PENDING')
  const approvedMembers = members.filter((member) => member.status === 'APPROVED')

  return (
    <PageSection title="Classrooms" hidePath={false}>
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="two-column">
        <div className="stack">
          <form className="panel stack" onSubmit={handleCreate}>
            <div className="row-between">
              <h3>Create classroom</h3>
              <button type="submit" className="primary-button" disabled={busy || !createName.trim()}>
                {busy ? 'Saving...' : 'Create'}
              </button>
            </div>
            <label>
              Classroom name
              <input value={createName} onChange={(event) => setCreateName(event.target.value)} required />
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
                  <span className="pill">{classroom.approvedStudentCount} students</span>
                </div>
                <div className="row-between">
                  <span className="classroom-code">{classroom.joinCode}</span>
                  <span className="muted">{classroom.pendingStudentCount} pending</span>
                </div>
              </button>
            ))}
            {!classrooms.length ? <div className="panel"><p className="muted">No classrooms yet.</p></div> : null}
          </div>
        </div>

        <div className="stack">
          {selectedClassroom ? (
            <>
              <form className="panel stack" onSubmit={handleRename}>
                <div className="row-between wrap-row">
                  <h3>Classroom detail</h3>
                  <div className="action-row">
                    <button type="button" className="ghost-button" onClick={handleRegenerateJoinCode} disabled={busy}>
                      New join code
                    </button>
                    <button type="button" className="ghost-button danger-button" onClick={handleDeleteClassroom} disabled={busy}>
                      Delete
                    </button>
                    <button type="submit" className="primary-button" disabled={busy || !editName.trim()}>
                      Save
                    </button>
                  </div>
                </div>
                <label>
                  Classroom name
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} required />
                </label>
                <div className="row-between wrap-row">
                  <span className="classroom-code">{selectedClassroom.joinCode}</span>
                  <span className="muted">Created {formatDate(selectedClassroom.createdAt)}</span>
                </div>
              </form>

              <form className="panel stack" onSubmit={handleAssignSession}>
                <div className="row-between wrap-row">
                  <h3>Assign exam session</h3>
                  <button type="submit" className="primary-button" disabled={busy || !assignSessionId}>
                    Assign
                  </button>
                </div>
                <label>
                  Session
                  <select value={assignSessionId} onChange={(event) => setAssignSessionId(event.target.value)}>
                    <option value="">Choose session</option>
                    {availableSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.title}
                      </option>
                    ))}
                  </select>
                </label>
              </form>

              <div className="panel stack">
                <h3>Assigned sessions</h3>
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="classroom-row">
                    <div>
                      <strong>{assignment.examSessionTitle}</strong>
                      <p className="muted">{assignment.examTitle}</p>
                      <p className="muted">{formatDate(assignment.openTime)} - {formatDate(assignment.closeTime)}</p>
                    </div>
                    <div className="action-row">
                      <Link to="/exam-sessions" className="ghost-button">Open sessions</Link>
                      <button type="button" className="ghost-button" onClick={() => handleRemoveAssignment(assignment.id)} disabled={busy}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {!assignments.length ? <p className="muted">No sessions assigned yet.</p> : null}
              </div>

              <div className="panel stack">
                <h3>Pending students</h3>
                {pendingMembers.map((member) => (
                  <div key={member.id} className="classroom-row">
                    <div>
                      <strong>{member.fullName}</strong>
                      <p className="muted">{member.email}</p>
                      <p className="muted">Joined {formatDate(member.joinedAt)}</p>
                    </div>
                    <div className="action-row">
                      <button type="button" className="primary-button" onClick={() => handleApproveMember(member.id)} disabled={busy}>
                        Approve
                      </button>
                      <button type="button" className="ghost-button" onClick={() => handleRemoveMember(member.id)} disabled={busy}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {!pendingMembers.length ? <p className="muted">No pending requests.</p> : null}
              </div>

              <div className="panel stack">
                <h3>Students</h3>
                {approvedMembers.map((member) => (
                  <div key={member.id} className="classroom-row">
                    <div>
                      <strong>{member.fullName}</strong>
                      <p className="muted">{member.email}</p>
                    </div>
                    <div className="action-row">
                      <span className={statusClass(member.status)}>{member.status}</span>
                      <button type="button" className="ghost-button" onClick={() => handleRemoveMember(member.id)} disabled={busy}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {!approvedMembers.length ? <p className="muted">No approved students yet.</p> : null}
              </div>
            </>
          ) : (
            <div className="panel">
              <p className="muted">Select a classroom to manage members and assignments.</p>
            </div>
          )}
        </div>
      </div>
    </PageSection>
  )
}
