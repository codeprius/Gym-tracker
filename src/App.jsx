import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LogPage from './pages/LogPage'
import ProgressPage from './pages/ProgressPage'
import CategoriesPage from './pages/CategoriesPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-gradient)' }}>
      <div className="flex flex-col items-center gap-4">
        <img src="/icons/logo.png" alt="GYM-X" className="w-20 h-20 rounded-3xl object-cover animate-pulse" />
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgba(74,222,128,0.3)', borderTopColor: 'var(--c-primary)' }} />
      </div>
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="log/:date" element={<LogPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="categories" element={<CategoriesPage />} />
      </Route>
    </Routes>
  )
}
