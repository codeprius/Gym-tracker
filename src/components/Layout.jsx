import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme, THEMES } from '../contexts/ThemeContext'
import {
  HomeIcon, PencilSquareIcon, ChartBarIcon,
  TagIcon, SunIcon, MoonIcon, ArrowRightOnRectangleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/log', label: 'Log Workout', icon: PencilSquareIcon },
  { to: '/progress', label: 'Progress', icon: ChartBarIcon },
  { to: '/categories', label: 'Categories', icon: TagIcon },
]

// Hamburger icon — 3 subtle lines
function HamburgerIcon({ open }) {
  return (
    <div className="flex flex-col justify-center items-center w-5 h-5 gap-[5px]">
      <span className="block w-5 h-px transition-all duration-300"
        style={{ background: open ? 'var(--c-primary)' : '#4b5563', transform: open ? 'rotate(45deg) translateY(6px)' : 'none' }} />
      <span className="block h-px transition-all duration-300"
        style={{ background: open ? 'var(--c-primary)' : '#4b5563', width: open ? '0px' : '14px', opacity: open ? 0 : 1 }} />
      <span className="block w-5 h-px transition-all duration-300"
        style={{ background: open ? 'var(--c-primary)' : '#4b5563', transform: open ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
    </div>
  )
}

// Collapsible settings panel at the bottom of sidebar
function SettingsPanel({ dark, toggle, themeId, setThemeId, themes, onSignOut }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={panelRef} className="relative">
      {/* Collapsible panel — slides up from bottom */}
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl p-3 animate-settings-slide"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--c-border)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Theme switcher */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: '#374151' }}>Theme</p>
          <div className="flex flex-col gap-1 mb-3">
            {Object.values(themes).map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all w-full text-left"
                style={themeId === t.id
                  ? { background: 'var(--c-primary-dim)', color: 'var(--c-primary)', border: '1px solid var(--c-border-hover)' }
                  : { color: '#6b7280', border: '1px solid transparent' }
                }
                onMouseEnter={e => { if (themeId !== t.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9ca3af' } }}
                onMouseLeave={e => { if (themeId !== t.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' } }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.primary, boxShadow: themeId === t.id ? `0 0 6px ${t.primary}` : 'none' }} />
                <span className="flex-1">{t.label}</span>
                {themeId === t.id && <CheckIcon className="w-3 h-3 shrink-0" style={{ color: 'var(--c-primary)' }} />}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px mb-3" style={{ background: 'var(--c-border)' }} />

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all w-full text-left mb-1"
            style={{ color: '#6b7280', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9ca3af' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
          >
            {dark
              ? <SunIcon className="w-3.5 h-3.5 shrink-0" />
              : <MoonIcon className="w-3.5 h-3.5 shrink-0" />
            }
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all w-full text-left"
            style={{ color: '#6b7280', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
          >
            <ArrowRightOnRectangleIcon className="w-3.5 h-3.5 shrink-0" />
            Sign Out
          </button>
        </div>
      )}

      {/* Trigger button — hamburger at bottom of sidebar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all"
        style={{
          color: open ? 'var(--c-primary)' : '#374151',
          background: open ? 'var(--c-primary-dim)' : 'transparent',
          border: `1px solid ${open ? 'var(--c-border)' : 'transparent'}`,
        }}
        title="Settings"
      >
        <HamburgerIcon open={open} />
        <span className="text-xs font-medium" style={{ color: open ? 'var(--c-primary)' : '#374151' }}>
          {open ? 'Close' : 'Settings'}
        </span>
      </button>
    </div>
  )
}

export default function Layout() {
  const { signOut, user } = useAuth()
  const { dark, toggle, themeId, setThemeId, themes } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--c-gradient)' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="w-60 shrink-0 hidden md:flex flex-col sidebar py-5 px-4">
        {/* Logo */}
        <div className="mb-8 px-1">
          <div className="flex items-baseline gap-0.5">
            <span className="font-display text-3xl tracking-widest" style={{ color: 'var(--c-primary)', textShadow: '0 0 20px var(--c-primary-glow)' }}>GYM</span>
            <span className="font-display text-3xl tracking-widest" style={{ color: 'var(--c-accent)', textShadow: '0 0 20px var(--c-accent-glow)' }}>-X</span>
          </div>
          <p className="text-xs mt-1 truncate" style={{ color: '#374151' }}>{user?.email}</p>
        </div>

        {/* Nav links */}
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

        {/* Settings panel at bottom */}
        <div className="pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
          <SettingsPanel
            dark={dark}
            toggle={toggle}
            themeId={themeId}
            setThemeId={setThemeId}
            themes={themes}
            onSignOut={handleSignOut}
          />
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: 'var(--c-sidebar-bg)', borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-baseline gap-0.5">
            <span className="font-display text-2xl tracking-widest" style={{ color: 'var(--c-primary)' }}>GYM</span>
            <span className="font-display text-2xl tracking-widest" style={{ color: 'var(--c-accent)' }}>-X</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg" style={{ color: 'var(--c-primary)' }}>
              {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-lg" style={{ color: mobileOpen ? 'var(--c-primary)' : '#4b5563' }}>
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </header>

        {/* Mobile theme drawer */}
        {mobileOpen && (
          <div className="md:hidden px-4 py-3 animate-settings-slide" style={{ background: 'var(--c-sidebar-bg)', borderBottom: '1px solid var(--c-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#374151' }}>Theme</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {Object.values(themes).map(t => (
                <button key={t.id} onClick={() => { setThemeId(t.id); setMobileOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={themeId === t.id
                    ? { background: 'var(--c-primary-dim)', color: 'var(--c-primary)', border: '1px solid var(--c-border-hover)' }
                    : { color: '#6b7280', border: '1px solid var(--c-border)' }
                  }
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.primary }} />
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={handleSignOut} className="text-xs font-medium transition-colors" style={{ color: '#6b7280' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
            >
              Sign Out
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto animate-fade-in relative z-10">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around px-2 py-2" style={{ background: 'var(--c-sidebar-bg)', borderTop: '1px solid var(--c-border)' }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all`}
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
