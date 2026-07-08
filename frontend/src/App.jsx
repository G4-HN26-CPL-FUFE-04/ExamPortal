import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Shell from './components/Shell'
import { api, authStorageKey, readStoredAuth } from './lib/appCore'
import AuthPage from './pages/AuthPage'
import AdminDashboardPage from './pages/admin/DashboardPage'
import AdminDraftsPage from './pages/admin/DraftsPage'
import AdminExamSessionsPage from './pages/admin/ExamSessionsPage'
import AdminResultsPage from './pages/admin/ResultsPage'
import AdminStatisticsPage from './pages/admin/StatisticsPage'
import AdminSubjectQuestionsPage from './pages/admin/SubjectQuestionsPage'
import AdminSubjectBanksPage from './pages/admin/SubjectBanksPage'
import AdminSubjectsPage from './pages/admin/SubjectsPage'
import AdminUsersPage from './pages/admin/UsersPage'
import ProfilePage from './pages/shared/ProfilePage'
import StudentAttemptPage from './pages/student/AttemptPage'
import StudentDashboardPage from './pages/student/DashboardPage'
import StudentExamSessionDetailPage from './pages/student/ExamSessionDetailPage'
import StudentExamSessionsPage from './pages/student/ExamSessionsPage'
import StudentMyAttemptsPage from './pages/student/MyAttemptsPage'
import StudentResultPage from './pages/student/ResultPage'

function App() {
  const [auth, setAuth] = useState(readStoredAuth)

  useEffect(() => {
    if (auth?.token) {
      localStorage.setItem(authStorageKey, JSON.stringify(auth))
    } else {
      localStorage.removeItem(authStorageKey)
    }
  }, [auth])

  useEffect(() => {
    if (auth?.token) {
      api.defaults.headers.common.Authorization = `Bearer ${auth.token}`
    } else {
      delete api.defaults.headers.common.Authorization
    }
  }, [auth])

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" setAuth={setAuth} />} />
      <Route path="/register" element={<AuthPage mode="register" setAuth={setAuth} />} />
      <Route
        path="/*"
        element={(
          <ProtectedRoute auth={auth}>
            <Shell auth={auth} setAuth={setAuth} />
          </ProtectedRoute>
        )}
      >
        <Route index element={<RoleHomeRedirect auth={auth} />} />
        <Route path="student" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentDashboardPage auth={auth} /></RoleRoute>} />
        <Route path="student/exam-sessions" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentExamSessionsPage /></RoleRoute>} />
        <Route path="student/exam-sessions/:id" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentExamSessionDetailPage /></RoleRoute>} />
        <Route path="student/attempts/:id" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentAttemptPage /></RoleRoute>} />
        <Route path="student/results/:id" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentResultPage /></RoleRoute>} />
        <Route path="student/my-attempts" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentMyAttemptsPage /></RoleRoute>} />
        <Route path="student/profile" element={<RoleRoute auth={auth} roles={['STUDENT']}><ProfilePage auth={auth} setAuth={setAuth} /></RoleRoute>} />

        <Route path="instructor" element={<RoleRoute auth={auth} roles={['INSTRUCTOR']}><AdminDraftsPage /></RoleRoute>} />
        <Route path="instructor/drafts" element={<RoleRoute auth={auth} roles={['INSTRUCTOR']}><AdminDraftsPage /></RoleRoute>} />
        <Route path="instructor/subjects" element={<RoleRoute auth={auth} roles={['INSTRUCTOR']}><AdminSubjectsPage /></RoleRoute>} />
        <Route path="instructor/subjects/:subjectSlug" element={<RoleRoute auth={auth} roles={['INSTRUCTOR']}><AdminSubjectBanksPage /></RoleRoute>} />
        <Route path="instructor/subjects/:subjectSlug/:bankSlug" element={<RoleRoute auth={auth} roles={['INSTRUCTOR']}><AdminSubjectQuestionsPage /></RoleRoute>} />
        <Route path="instructor/exam-sessions" element={<RoleRoute auth={auth} roles={['INSTRUCTOR']}><AdminExamSessionsPage /></RoleRoute>} />
        <Route path="instructor/results" element={<RoleRoute auth={auth} roles={['INSTRUCTOR']}><AdminResultsPage /></RoleRoute>} />
        <Route path="instructor/profile" element={<RoleRoute auth={auth} roles={['INSTRUCTOR']}><ProfilePage auth={auth} setAuth={setAuth} /></RoleRoute>} />

        <Route path="admin" element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminDashboardPage /></RoleRoute>} />
        <Route path="admin/profile" element={<RoleRoute auth={auth} roles={['ADMIN']}><ProfilePage auth={auth} setAuth={setAuth} /></RoleRoute>} />
        <Route
          path="admin/users"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminUsersPage /></RoleRoute>}
        />
        <Route
          path="admin/subjects"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminSubjectsPage /></RoleRoute>}
        />
        <Route
          path="admin/subjects/:subjectSlug"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminSubjectBanksPage /></RoleRoute>}
        />
        <Route
          path="admin/subjects/:subjectSlug/:bankSlug"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminSubjectQuestionsPage /></RoleRoute>}
        />
        <Route
          path="admin/drafts"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminDraftsPage /></RoleRoute>}
        />
        <Route
          path="admin/exam-sessions"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminExamSessionsPage /></RoleRoute>}
        />
        <Route
          path="admin/results"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><AdminResultsPage /></RoleRoute>}
        />
        <Route
          path="admin/statistics"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminStatisticsPage /></RoleRoute>}
        />

        <Route path="dashboard" element={<RoleHomeRedirect auth={auth} />} />
        <Route path="profile" element={<Navigate to={getProfileRouteForRole(auth.user.role)} replace />} />
        <Route path="exam-sessions" element={<Navigate to={getExamSessionsRouteForRole(auth.user.role)} replace />} />
        <Route path="exam-sessions/:id" element={<LegacyStudentRouteRedirect prefix="exam-sessions" />} />
        <Route path="attempts/:id" element={<LegacyStudentRouteRedirect prefix="attempts" />} />
        <Route path="results/:id" element={<LegacyStudentRouteRedirect prefix="results" />} />
        <Route path="my-attempts" element={<Navigate to="/student/my-attempts" replace />} />
        <Route path="draft" element={<Navigate to={getDraftsRouteForRole(auth.user.role)} replace />} />
        <Route path="questions" element={<Navigate to={getSubjectsRouteForRole(auth.user.role)} replace />} />
        <Route path="questions/:subjectSlug" element={<LegacyQuestionsRedirect auth={auth} />} />
      </Route>
    </Routes>
  )
}

function ProtectedRoute({ auth, children }) {
  if (!auth?.token || !auth?.user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RoleRoute({ auth, roles, children }) {
  if (!roles.includes(auth.user.role)) {
    return <Navigate to={getHomeRouteForRole(auth.user.role)} replace />
  }
  return children
}

function RoleHomeRedirect({ auth }) {
  return <Navigate to={getHomeRouteForRole(auth.user.role)} replace />
}

function LegacyStudentRouteRedirect({ prefix }) {
  const auth = readStoredAuth()
  return <Navigate to={`/student/${prefix}/${window.location.pathname.split('/').pop()}`} replace />
}

function LegacyQuestionsRedirect({ auth }) {
  const slug = window.location.pathname.split('/').pop()
  return <Navigate to={`${getSubjectsRouteForRole(auth.user.role)}/${slug}`} replace />
}

function getHomeRouteForRole(role) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'INSTRUCTOR') return '/instructor'
  return '/student'
}

function getProfileRouteForRole(role) {
  if (role === 'ADMIN') return '/admin/profile'
  if (role === 'INSTRUCTOR') return '/instructor/profile'
  return '/student/profile'
}

function getExamSessionsRouteForRole(role) {
  if (role === 'ADMIN') return '/admin/exam-sessions'
  if (role === 'INSTRUCTOR') return '/instructor/exam-sessions'
  return '/student/exam-sessions'
}

function getDraftsRouteForRole(role) {
  if (role === 'ADMIN') return '/admin/drafts'
  if (role === 'INSTRUCTOR') return '/instructor/drafts'
  return '/student'
}

function getSubjectsRouteForRole(role) {
  if (role === 'ADMIN') return '/admin/subjects'
  if (role === 'INSTRUCTOR') return '/instructor/subjects'
  return '/student'
}

export default App
