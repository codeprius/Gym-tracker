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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #050a05 0%, #0a140a 50%, #060b08 100%)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-5xl tracking-[0.2em]" style={{ color: '#4ade80', textShadow: '0 0 30px rgba(74,222,128,0.5)' }}>GYM</span>
          <span className="font-display text-5xl tracking-[0.2em]" style={{ color: '#fbbf24', textShadow: '0 0 30px rgba(251,191,36,0.5)' }}>-X</span>
        </div>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgba(74,222,128,0.2)', borderTopColor: '#4ade80' }} />
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
