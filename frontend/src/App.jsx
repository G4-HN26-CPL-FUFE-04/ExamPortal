import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Shell from './components/Shell'
import { api, authStorageKey, readStoredAuth } from './lib/appCore'
import AuthPage from './pages/AuthPage'
import {
  DashboardPage,
  ExamSessionsPage,
  ExamSessionDetailPage,
  AttemptPage,
  ResultPage,
  MyAttemptsPage,
  ProfilePage,
} from './pages/StudentPages'
import {
  AdminHomePage,
  UsersPage,
  SubjectsPage,
  QuestionsHomePage,
  SubjectQuestionBankPage,
  DraftsPage,
  PublishedExamsPage,
  AdminSessionsPage,
  ResultsMonitorPage,
  StatisticsPage,
} from './pages/AdminPages'

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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage auth={auth} />} />
        <Route path="exam-sessions" element={<ExamSessionsPage />} />
        <Route path="exam-sessions/:id" element={<ExamSessionDetailPage />} />
        <Route path="attempts/:id" element={<AttemptPage />} />
        <Route path="results/:id" element={<ResultPage />} />
        <Route path="my-attempts" element={<MyAttemptsPage />} />
        <Route path="profile" element={<ProfilePage auth={auth} setAuth={setAuth} />} />
        <Route
          path="admin"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><AdminHomePage /></RoleRoute>}
        />
        <Route
          path="admin/users"
          element={<RoleRoute auth={auth} roles={['ADMIN']}><UsersPage /></RoleRoute>}
        />
        <Route
          path="admin/subjects"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><SubjectsPage /></RoleRoute>}
        />
        <Route
          path="questions"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><QuestionsHomePage /></RoleRoute>}
        />
        <Route
          path="questions/:subjectSlug"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><SubjectQuestionBankPage /></RoleRoute>}
        />
        <Route
          path="draft"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><DraftsPage /></RoleRoute>}
        />
        <Route
          path="admin/exams"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><PublishedExamsPage /></RoleRoute>}
        />
        <Route
          path="admin/exam-sessions"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><AdminSessionsPage /></RoleRoute>}
        />
        <Route
          path="admin/results"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><ResultsMonitorPage /></RoleRoute>}
        />
        <Route
          path="admin/statistics"
          element={<RoleRoute auth={auth} roles={['ADMIN', 'INSTRUCTOR']}><StatisticsPage /></RoleRoute>}
        />
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
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default App
