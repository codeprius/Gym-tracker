import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

// Theme definitions
export const THEMES = {
  'green-gold': {
    id: 'green-gold',
    label: 'Green & Gold',
    primary: '#4ade80',
    accent: '#fbbf24',
    bg: '#050a05',
    dot: 'bg-green-400',
  },
  'orange-dark': {
    id: 'orange-dark',
    label: 'Iron & Ember',
    primary: '#f97316',
    accent: '#f97316',
    bg: '#09090b',
    dot: 'bg-orange-500',
  },
  'dark': {
    id: 'dark',
    label: 'Midnight',
    primary: '#a78bfa',
    accent: '#a78bfa',
    bg: '#030712',
    dot: 'bg-violet-400',
  },
}

const THEME_VARS = {
  'green-gold': {
    '--c-primary': '#4ade80',
    '--c-primary-dim': 'rgba(74,222,128,0.15)',
    '--c-primary-glow': 'rgba(74,222,128,0.3)',
    '--c-accent': '#fbbf24',
    '--c-accent-dim': 'rgba(251,191,36,0.15)',
    '--c-accent-glow': 'rgba(251,191,36,0.3)',
    '--c-bg': '#050a05',
    '--c-bg-mid': '#0a140a',
    '--c-bg-end': '#060b08',
    '--c-sidebar-bg': 'rgba(5,10,6,0.95)',
    '--c-border': 'rgba(34,197,94,0.12)',
    '--c-border-hover': 'rgba(34,197,94,0.3)',
    '--c-card-bg': 'rgba(10,22,12,0.85)',
    '--c-glass-bg': 'rgba(8,20,10,0.75)',
    '--c-nav-active-bg': 'rgba(22,163,74,0.2)',
    '--c-nav-active-border': 'rgba(34,197,94,0.4)',
    '--c-btn-from': '#16a34a',
    '--c-btn-to': '#15803d',
    '--c-btn-shadow': 'rgba(22,163,74,0.3)',
    '--c-input-bg': 'rgba(16,40,20,0.6)',
    '--c-input-border': 'rgba(34,197,94,0.2)',
    '--c-input-border-focus': 'rgba(34,197,94,0.6)',
    '--c-label': '#86efac',
    '--c-gradient': 'linear-gradient(135deg, #050a05 0%, #0a140a 50%, #060b08 100%)',
  },
  'orange-dark': {
    '--c-primary': '#f97316',
    '--c-primary-dim': 'rgba(249,115,22,0.15)',
    '--c-primary-glow': 'rgba(249,115,22,0.3)',
    '--c-accent': '#fb923c',
    '--c-accent-dim': 'rgba(251,146,60,0.15)',
    '--c-accent-glow': 'rgba(251,146,60,0.3)',
    '--c-bg': '#09090b',
    '--c-bg-mid': '#111113',
    '--c-bg-end': '#0c0c0e',
    '--c-sidebar-bg': 'rgba(9,9,11,0.98)',
    '--c-border': 'rgba(249,115,22,0.12)',
    '--c-border-hover': 'rgba(249,115,22,0.35)',
    '--c-card-bg': 'rgba(15,15,18,0.9)',
    '--c-glass-bg': 'rgba(12,10,8,0.8)',
    '--c-nav-active-bg': 'rgba(234,88,12,0.2)',
    '--c-nav-active-border': 'rgba(249,115,22,0.45)',
    '--c-btn-from': '#ea580c',
    '--c-btn-to': '#c2410c',
    '--c-btn-shadow': 'rgba(234,88,12,0.35)',
    '--c-input-bg': 'rgba(20,15,10,0.7)',
    '--c-input-border': 'rgba(249,115,22,0.2)',
    '--c-input-border-focus': 'rgba(249,115,22,0.6)',
    '--c-label': '#fdba74',
    '--c-gradient': 'linear-gradient(135deg, #09090b 0%, #111113 50%, #0c0c0e 100%)',
  },
  'dark': {
    '--c-primary': '#a78bfa',
    '--c-primary-dim': 'rgba(167,139,250,0.15)',
    '--c-primary-glow': 'rgba(167,139,250,0.3)',
    '--c-accent': '#c4b5fd',
    '--c-accent-dim': 'rgba(196,181,253,0.12)',
    '--c-accent-glow': 'rgba(196,181,253,0.25)',
    '--c-bg': '#030712',
    '--c-bg-mid': '#070b18',
    '--c-bg-end': '#050914',
    '--c-sidebar-bg': 'rgba(3,7,18,0.98)',
    '--c-border': 'rgba(167,139,250,0.1)',
    '--c-border-hover': 'rgba(167,139,250,0.3)',
    '--c-card-bg': 'rgba(7,11,24,0.9)',
    '--c-glass-bg': 'rgba(5,8,20,0.8)',
    '--c-nav-active-bg': 'rgba(109,40,217,0.2)',
    '--c-nav-active-border': 'rgba(167,139,250,0.4)',
    '--c-btn-from': '#7c3aed',
    '--c-btn-to': '#6d28d9',
    '--c-btn-shadow': 'rgba(124,58,237,0.35)',
    '--c-input-bg': 'rgba(10,8,25,0.7)',
    '--c-input-border': 'rgba(167,139,250,0.2)',
    '--c-input-border-focus': 'rgba(167,139,250,0.6)',
    '--c-label': '#c4b5fd',
    '--c-gradient': 'linear-gradient(135deg, #030712 0%, #070b18 50%, #050914 100%)',
  },
}

function applyThemeVars(themeId) {
  const vars = THEME_VARS[themeId] || THEME_VARS['green-gold']
  const root = document.documentElement
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val))
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true)
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem('gymx-theme-id') || 'green-gold' } catch { return 'green-gold' }
  })

  useEffect(() => {
    document.documentElement.classList.add('dark')
    applyThemeVars(themeId)
    localStorage.setItem('gymx-theme-id', themeId)
  }, [themeId])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('gymx-dark', dark ? '1' : '0')
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d), themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
