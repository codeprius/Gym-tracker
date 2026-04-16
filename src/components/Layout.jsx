import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme, THEMES } from '../contexts/ThemeContext'
import {
  HomeIcon, PencilSquareIcon, ChartBarIcon,
  TagIcon, ArrowRightOnRectangleIcon, CheckIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/log', label: 'Log Workout', icon: PencilSquareIcon },
  { to: '/progress', label: 'Progress', icon: ChartBarIcon },
  { to: '/categories', label: 'Categories', icon: TagIcon },
]

function Hamburger({ onClick, style }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded-lg shrink-0 transition-all"
      style={style}
      aria-label="Toggle sidebar"
    >
      <span className="block w-5 h-[1.5px] rounded-full" style={{ background: 'var(--c-primary)', opacity: 0.7 }} />
      <span className="block w-3.5 h-[1.5px] rounded-full" style={{ background: 'var(--c-primary)', opacity: 0.5 }} />
      <span className="block w-4 h-[1.5px] rounded-full" style={{ background: 'var(--c-primary)', opacity: 0.6 }} />
    </button>
  )
}

function ThemePanel({ themeId, setThemeId, onSignOut, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 right-0 mb-2 p-3 rounded-2xl animate-settings-slide"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--c-border)',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.5)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: '#374151', letterSpacing: '0.15em' }}>
        Theme
      </p>
      <div className="flex flex-col gap-1 mb-3">
        {Object.values(THEMES).map(t => (
          <button
            key={t.id}
            onClick={() => { setThemeId(t.id); onClose() }}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all w-full text-left"
            style={themeId === t.id
              ? { background: 'var(--c-primary-dim)', color: 'var(--c-primary)', border: '1px solid var(--c-border-hover)' }
              : { color: '#6b7280', border: '1px solid transparent' }
            }
            onMouseEnter={e => { if (themeId !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { if (themeId !== t.id) e.currentTarget.style.background = 'transparent' }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: t.primary, boxShadow: themeId === t.id ? `0 0 6px ${t.primary}` : 'none' }} />
            <span className="flex-1">{t.label}</span>
            {themeId === t.id && <CheckIcon className="w-3 h-3 shrink-0" style={{ color: 'var(--c-primary)' }} />}
          </button>
        ))}
      </div>

      <div className="h-px mb-2" style={{ background: 'var(--c-border)' }} />

      <button
        onClick={onSignOut}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all w-full text-left"
        style={{ color: '#6b7280', border: '1px solid transparent' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent' }}
      >
        <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
        Sign Out
      </button>
    </div>
  )
}

export default function Layout() {
  const { signOut, user } = useAuth()
  const { themeId, setThemeId } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--c-gradient)' }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="shrink-0 hidden md:flex flex-col sidebar relative transition-all duration-300"
        style={{ width: sidebarOpen ? '232px' : '60px', minHeight: '100vh' }}
      >
        {/* Hamburger — always visible at top */}
        <div className="flex items-center px-3 pt-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <Hamburger onClick={() => setSidebarOpen(o => !o)} />
          {sidebarOpen && (
            <div className="flex items-baseline gap-0.5 ml-2 overflow-hidden">
              <span className="font-display text-2xl tracking-widest whitespace-nowrap"
                style={{ color: 'var(--c-primary)', textShadow: '0 0 16px var(--c-primary-glow)' }}>GYM</span>
              <span className="font-display text-2xl tracking-widest whitespace-nowrap"
                style={{ color: 'var(--c-accent)', textShadow: '0 0 16px var(--c-accent-glow)' }}>-X</span>
            </div>
          )}
        </div>

        {/* Logo image in sidebar when open */}
        {sidebarOpen && (
          <div className="flex justify-center px-4 py-3">
            <img
              src="/icons/logo.png"
              alt="GYM-X Logo"
              className="w-16 h-16 rounded-2xl object-cover"
              style={{ boxShadow: '0 0 20px var(--c-primary-glow)' }}
            />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-2 py-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={!sidebarOpen ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-active' : 'nav-inactive'} ${sidebarOpen ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Settings trigger at bottom */}
        <div className="px-2 pb-4 pt-2 relative" style={{ borderTop: '1px solid var(--c-border)' }} ref={settingsRef}>
          {settingsOpen && (
            <ThemePanel
              themeId={themeId}
              setThemeId={setThemeId}
              onSignOut={handleSignOut}
              onClose={() => setSettingsOpen(false)}
            />
          )}
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className={`flex items-center gap-3 w-full rounded-xl transition-all ${sidebarOpen ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'}`}
            style={{
              color: settingsOpen ? 'var(--c-primary)' : '#374151',
              background: settingsOpen ? 'var(--c-primary-dim)' : 'transparent',
            }}
            title={!sidebarOpen ? 'Settings' : undefined}
          >
            {/* Three lines icon for settings */}
            <div className="flex flex-col gap-[4px] shrink-0 w-5 items-start">
              <span className="block h-[1.5px] rounded-full transition-all" style={{ width: settingsOpen ? '20px' : '20px', background: settingsOpen ? 'var(--c-primary)' : '#4b5563' }} />
              <span className="block h-[1.5px] rounded-full transition-all" style={{ width: settingsOpen ? '20px' : '14px', background: settingsOpen ? 'var(--c-primary)' : '#4b5563' }} />
              <span className="block h-[1.5px] rounded-full transition-all" style={{ width: settingsOpen ? '20px' : '17px', background: settingsOpen ? 'var(--c-primary)' : '#4b5563' }} />
            </div>
            {sidebarOpen && (
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: settingsOpen ? 'var(--c-primary)' : '#374151' }}>
                Settings
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--c-sidebar-bg)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-2">
            <img src="/icons/logo.png" alt="GYM-X" className="w-8 h-8 rounded-xl object-cover" />
            <div className="flex items-baseline gap-0.5">
              <span className="font-display text-xl tracking-widest" style={{ color: 'var(--c-primary)' }}>GYM</span>
              <span className="font-display text-xl tracking-widest" style={{ color: 'var(--c-accent)' }}>-X</span>
            </div>
          </div>
          {/* Mobile theme dots */}
          <div className="flex items-center gap-1.5">
            {Object.values(THEMES).map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  backgroundColor: t.primary,
                  boxShadow: themeId === t.id ? `0 0 8px ${t.primary}` : 'none',
                  opacity: themeId === t.id ? 1 : 0.35,
                  transform: themeId === t.id ? 'scale(1.3)' : 'scale(1)',
                }}
                title={t.label}
              />
            ))}
            <button
              onClick={handleSignOut}
              className="ml-2 p-1.5 rounded-lg"
              style={{ color: '#4b5563' }}
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto animate-fade-in relative z-10">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around px-2 py-2"
          style={{ background: 'var(--c-sidebar-bg)', borderTop: '1px solid var(--c-border)' }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={({ isActive }) => ({ color: isActive ? 'var(--c-primary)' : '#4b5563' })}
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
