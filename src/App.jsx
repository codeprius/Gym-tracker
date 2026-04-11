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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <span className="font-display text-4xl text-brand-500 tracking-widest">GYM-X</span>
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
