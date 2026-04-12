import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subMonths } from 'date-fns'
import { FireIcon, TrophyIcon, CalendarIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [prs, setPrs] = useState([])
  const [stats, setStats] = useState({ streak: 0, totalWorkouts: 0, thisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const today = new Date()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const threeMonthsAgo = format(subMonths(today, 3), 'yyyy-MM-dd')
    const { data: workoutData } = await supabase
      .from('workouts').select('*, workout_exercises(*, sets(*))')
      .eq('user_id', user.id).gte('date', threeMonthsAgo).order('date', { ascending: false })
    if (workoutData) { setWorkouts(workoutData); calcStats(workoutData); calcPRs(workoutData) }
    setLoading(false)
  }

  function calcStats(data) {
    const dates = data.map(w => w.date).sort((a, b) => b.localeCompare(a))
    let streak = 0
    const todayStr = format(today, 'yyyy-MM-dd')
    const yesterdayStr = format(new Date(today - 86400000), 'yyyy-MM-dd')
    if (dates[0] === todayStr || dates[0] === yesterdayStr) {
      for (let i = 0; i < dates.length; i++) {
        const expected = format(new Date(today - i * 86400000), 'yyyy-MM-dd')
        if (dates.includes(expected)) streak++; else break
      }
    }
    const thisMonthStart = format(startOfMonth(today), 'yyyy-MM-dd')
    setStats({ streak, totalWorkouts: data.length, thisMonth: data.filter(w => w.date >= thisMonthStart).length })
  }

  function calcPRs(data) {
    const maxWeights = {}
    for (const workout of data) {
      for (const we of workout.workout_exercises || []) {
        for (const set of we.sets || []) {
          if (set.weight_kg && set.reps) {
            const key = we.exercise_name
            if (!maxWeights[key] || set.weight_kg > maxWeights[key].weight) {
              maxWeights[key] = { weight: set.weight_kg, reps: set.reps, date: workout.date }
            }
          }
        }
      }
    }
    setPrs(Object.entries(maxWeights).sort((a, b) => b[1].weight - a[1].weight).slice(0, 5))
  }

  const calendarDays = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) })
  const workoutDates = workouts.map(w => w.date)
  const startDayOffset = startOfMonth(today).getDay()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(74,222,128,0.3)', borderTopColor: '#4ade80' }} />
    </div>
  )

  const statItems = [
    { label: 'Streak', value: stats.streak, unit: 'days', icon: FireIcon, color: '#f97316', glow: 'rgba(249,115,22,0.3)' },
    { label: 'This Month', value: stats.thisMonth, unit: 'workouts', icon: CalendarIcon, color: '#4ade80', glow: 'rgba(74,222,128,0.3)' },
    { label: 'Total', value: stats.totalWorkouts, unit: 'logged', icon: TrophyIcon, color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-5xl tracking-wider" style={{ color: '#e2e8f0' }}>DASHBOARD</h1>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>{format(today, 'EEEE, MMMM d')}</p>
        </div>
        <button onClick={() => navigate(`/log/${format(today, 'yyyy-MM-dd')}`)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Log Today
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {statItems.map(({ label, value, unit, icon: Icon, color, glow }) => (
          <div key={label} className="stat-card">
            <Icon className="w-5 h-5 mb-2" style={{ color }} />
            <div className="font-display text-4xl tracking-wider" style={{ color, textShadow: `0 0 20px ${glow}` }}>{value}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: '#6b7280' }}>{label}</div>
            <div className="text-xs" style={{ color: '#374151' }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="card p-5">
        <h2 className="font-display text-xl tracking-wider mb-4" style={{ color: '#4ade80' }}>
          {format(today, 'MMMM yyyy').toUpperCase()}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold mb-2" style={{ color: '#4b5563' }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOffset }).map((_, i) => <div key={`e-${i}`} />)}
          {calendarDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const hasWorkout = workoutDates.includes(dateStr)
            const isToday = isSameDay(day, today)
            return (
              <button
                key={dateStr}
                onClick={() => navigate(`/log/${dateStr}`)}
                className="aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={
                  hasWorkout
                    ? { background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', boxShadow: '0 0 12px rgba(22,163,74,0.4)' }
                    : isToday
                    ? { border: '2px solid #4ade80', color: '#4ade80' }
                    : { color: '#4b5563' }
                }
                onMouseEnter={e => { if (!hasWorkout && !isToday) e.currentTarget.style.background = 'rgba(34,197,94,0.1)' }}
                onMouseLeave={e => { if (!hasWorkout && !isToday) e.currentTarget.style.background = 'transparent' }}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* PRs */}
        <div className="card p-5">
          <h2 className="font-display text-xl tracking-wider mb-4 flex items-center gap-2" style={{ color: '#fbbf24' }}>
            <TrophyIcon className="w-5 h-5" /> PERSONAL RECORDS
          </h2>
          {prs.length === 0 ? (
            <p className="text-sm" style={{ color: '#4b5563' }}>Log workouts with weights to see your PRs.</p>
          ) : (
            <div className="space-y-3">
              {prs.map(([name, { weight, reps, date }]) => (
                <div key={name} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(34,197,94,0.08)' }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{name}</div>
                    <div className="text-xs" style={{ color: '#4b5563' }}>{format(parseISO(date), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl" style={{ color: '#fbbf24', textShadow: '0 0 12px rgba(251,191,36,0.3)' }}>{weight}kg</div>
                    <div className="text-xs" style={{ color: '#4b5563' }}>{reps} reps</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent workouts */}
        <div className="card p-5">
          <h2 className="font-display text-xl tracking-wider mb-4" style={{ color: '#4ade80' }}>RECENT WORKOUTS</h2>
          {workouts.length === 0 ? (
            <p className="text-sm" style={{ color: '#4b5563' }}>No workouts yet. Start logging!</p>
          ) : (
            <div className="space-y-1">
              {workouts.slice(0, 5).map(w => (
                <button key={w.id} onClick={() => navigate(`/log/${w.date}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-left"
                  style={{ color: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{format(parseISO(w.date), 'EEE, MMM d')}</div>
                    <div className="text-xs" style={{ color: '#4b5563' }}>{w.workout_exercises?.length || 0} exercises</div>
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#4ade80' }}>View →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
