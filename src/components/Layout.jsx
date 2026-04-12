import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  HomeIcon, PencilSquareIcon, ChartBarIcon,
  TagIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/log', label: 'Log Workout', icon: PencilSquareIcon },
  { to: '/progress', label: 'Progress', icon: ChartBarIcon },
  { to: '/categories', label: 'Categories', icon: TagIcon },
]

export default function Layout() {
  const { signOut, user } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #050a05 0%, #0a140a 50%, #060b08 100%)' }}>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col sidebar p-5">
        {/* Logo */}
        <div className="mb-8 px-1">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl tracking-widest" style={{ color: '#4ade80', textShadow: '0 0 20px rgba(74,222,128,0.4)' }}>GYM</span>
            <span className="font-display text-3xl tracking-widest" style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.4)' }}>-X</span>
          </div>
          <p className="text-xs mt-1 truncate" style={{ color: '#4b5563' }}>{user?.email}</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-active' : 'nav-inactive'}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-1 pt-4" style={{ borderTop: '1px solid rgba(34,197,94,0.1)' }}>
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium nav-inactive transition-all"
          >
            {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent' }}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: 'rgba(5,10,6,0.95)', borderBottom: '1px solid rgba(34,197,94,0.12)' }}>
          <div className="flex items-baseline gap-0.5">
            <span className="font-display text-2xl tracking-widest" style={{ color: '#4ade80' }}>GYM</span>
            <span className="font-display text-2xl tracking-widest" style={{ color: '#fbbf24' }}>-X</span>
          </div>
          <button onClick={toggle} className="p-2 rounded-lg" style={{ color: '#4ade80' }}>
            {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto animate-fade-in relative z-10">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around px-2 py-2" style={{ background: 'rgba(5,10,6,0.95)', borderTop: '1px solid rgba(34,197,94,0.12)' }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${isActive ? 'text-green-400' : 'text-zinc-500'}`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
