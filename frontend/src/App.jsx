import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Shell from './components/Shell'
import { api, readStoredAuth, writeStoredAuth } from './lib/appCore'
import AuthPage from './pages/AuthPage'
import AdminDraftsPage from './pages/admin/DraftsPage'
import AdminDashboardPage from './pages/admin/DashboardPage'
import AdminExamSessionsPage from './pages/admin/ExamSessionsPage'
import AdminClassroomsPage from './pages/admin/ClassroomsPage'
import AdminResultsPage from './pages/admin/ResultsPage'
import AdminStatisticsPage from './pages/admin/StatisticsPage'
import AdminSubjectQuestionsPage from './pages/admin/SubjectQuestionsPage'
import AdminSubjectBanksPage from './pages/admin/SubjectBanksPage'
import AdminSubjectsPage from './pages/admin/SubjectsPage'
import AdminUsersPage from './pages/admin/UsersPage'
import ProfilePage from './pages/shared/ProfilePage'
import StudentAttemptPage from './pages/student/AttemptPage'
import StudentDashboardPage from './pages/student/DashboardPage'
import TeacherDashboardPage from './pages/teacher/DashboardPage'
import StudentClassroomsPage from './pages/student/ClassroomsPage'
import StudentExamSessionDetailPage from './pages/student/ExamSessionDetailPage'
import StudentExamSessionsPage from './pages/student/ExamSessionsPage'
import StudentMyAttemptsPage from './pages/student/MyAttemptsPage'
import StudentResultPage from './pages/student/ResultPage'

function App() {
  const [auth, setAuth] = useState(readStoredAuth)

  useEffect(() => {
    writeStoredAuth(auth)
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
        <Route path="student/classes" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentClassroomsPage /></RoleRoute>} />
        <Route path="student/exam-sessions" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentExamSessionsPage /></RoleRoute>} />
        <Route path="student/exam-sessions/:id" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentExamSessionDetailPage /></RoleRoute>} />
        <Route path="student/attempts/:id" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentAttemptPage /></RoleRoute>} />
        <Route path="student/results/:id" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentResultPage /></RoleRoute>} />
        <Route path="student/my-attempts" element={<RoleRoute auth={auth} roles={['STUDENT']}><StudentMyAttemptsPage /></RoleRoute>} />
        <Route path="student/profile" element={<RoleRoute auth={auth} roles={['STUDENT']}><ProfilePage auth={auth} setAuth={setAuth} /></RoleRoute>} />

        <Route path="teacher" element={<RoleRoute auth={auth} roles={['TEACHER']}><TeacherDashboardPage /></RoleRoute>} />
        <Route path="teacher/classes" element={<RoleRoute auth={auth} roles={['TEACHER']}><AdminClassroomsPage /></RoleRoute>} />
        <Route path="teacher/drafts" element={<RoleRoute auth={auth} roles={['TEACHER']}><AdminDraftsPage /></RoleRoute>} />
        <Route path="teacher/subjects" element={<RoleRoute auth={auth} roles={['TEACHER']}><AdminSubjectsPage /></RoleRoute>} />
        <Route path="teacher/subjects/:subjectSlug" element={<RoleRoute auth={auth} roles={['TEACHER']}><AdminSubjectBanksPage /></RoleRoute>} />
        <Route path="teacher/subjects/:subjectSlug/:bankSlug" element={<RoleRoute auth={auth} roles={['TEACHER']}><AdminSubjectQuestionsPage /></RoleRoute>} />
        <Route path="teacher/exam-sessions" element={<RoleRoute auth={auth} roles={['TEACHER']}><AdminExamSessionsPage /></RoleRoute>} />
        <Route path="teacher/results" element={<RoleRoute auth={auth} roles={['TEACHER']}><AdminResultsPage /></RoleRoute>} />
        <Route path="teacher/statistics" element={<RoleRoute auth={auth} roles={['TEACHER']}><AdminStatisticsPage /></RoleRoute>} />
        <Route path="teacher/profile" element={<RoleRoute auth={auth} roles={['TEACHER']}><ProfilePage auth={auth} setAuth={setAuth} /></RoleRoute>} />

        <Route path="admin" element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminDashboardPage /></RoleRoute>} />
        <Route path="admin/profile" element={<RoleRoute auth={auth} roles={['ADMIN']}><ProfilePage auth={auth} setAuth={setAuth} /></RoleRoute>} />
        <Route
          path="admin/users"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><AdminUsersPage /></RoleRoute>}
        />

        <Route path="dashboard" element={<RoleHomeRedirect auth={auth} />} />
        <Route path="profile" element={<Navigate to={getProfileRouteForRole(auth?.user?.role)} replace />} />
        <Route path="exam-sessions" element={<Navigate to={getExamSessionsRouteForRole(auth?.user?.role)} replace />} />
        <Route path="exam-sessions/:id" element={<LegacyStudentRouteRedirect prefix="exam-sessions" />} />
        <Route path="attempts/:id" element={<LegacyStudentRouteRedirect prefix="attempts" />} />
        <Route path="results/:id" element={<LegacyStudentRouteRedirect prefix="results" />} />
        <Route path="my-attempts" element={<Navigate to="/student/my-attempts" replace />} />
        <Route path="draft" element={<Navigate to={getDraftsRouteForRole(auth?.user?.role)} replace />} />
        <Route path="questions" element={<Navigate to={getSubjectsRouteForRole(auth?.user?.role)} replace />} />
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
  if (role === 'TEACHER') return '/teacher'
  return '/student'
}

function getProfileRouteForRole(role) {
  if (role === 'ADMIN') return '/admin/profile'
  if (role === 'TEACHER') return '/teacher/profile'
  return '/student/profile'
}

function getExamSessionsRouteForRole(role) {
  if (role === 'TEACHER') return '/teacher/exam-sessions'
  return '/student/exam-sessions'
}

function getDraftsRouteForRole(role) {
  if (role === 'TEACHER') return '/teacher/drafts'
  return '/student'
}

function getSubjectsRouteForRole(role) {
  if (role === 'TEACHER') return '/teacher/subjects'
  return '/student'
}

export default App
