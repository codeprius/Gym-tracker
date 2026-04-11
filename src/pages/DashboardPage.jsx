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
      .from('workouts')
      .select('*, workout_exercises(*, sets(*))')
      .eq('user_id', user.id)
      .gte('date', threeMonthsAgo)
      .order('date', { ascending: false })

    if (workoutData) {
      setWorkouts(workoutData)
      calcStats(workoutData)
      calcPRs(workoutData)
    }
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
        if (dates.includes(expected)) streak++
        else break
      }
    }

    const thisMonthStart = format(startOfMonth(today), 'yyyy-MM-dd')
    setStats({
      streak,
      totalWorkouts: data.length,
      thisMonth: data.filter(w => w.date >= thisMonthStart).length,
    })
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
    const sorted = Object.entries(maxWeights)
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 5)
    setPrs(sorted)
  }

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  })
  const workoutDates = workouts.map(w => w.date)
  const startDayOffset = startOfMonth(today).getDay()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-wider text-zinc-900 dark:text-zinc-100">DASHBOARD</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{format(today, 'EEEE, MMMM d')}</p>
        </div>
        <button onClick={() => navigate(`/log/${format(today, 'yyyy-MM-dd')}`)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Log Today
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Streak', value: stats.streak, unit: 'days', icon: FireIcon, color: 'text-orange-500' },
          { label: 'This Month', value: stats.thisMonth, unit: 'workouts', icon: CalendarIcon, color: 'text-blue-500' },
          { label: 'Total', value: stats.totalWorkouts, unit: 'logged', icon: TrophyIcon, color: 'text-purple-500' },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <div className="font-display text-3xl tracking-wider text-zinc-900 dark:text-zinc-100">{value}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{label}</div>
            <div className="text-xs text-zinc-400">{unit}</div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="card p-5">
        <h2 className="font-display text-xl tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">
          {format(today, 'MMMM yyyy').toUpperCase()}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-400 mb-2">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
          {calendarDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const hasWorkout = workoutDates.includes(dateStr)
            const isToday = isSameDay(day, today)
            return (
              <button
                key={dateStr}
                onClick={() => navigate(`/log/${dateStr}`)}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                  hasWorkout
                    ? 'bg-brand-500 text-white shadow-sm'
                    : isToday
                    ? 'border-2 border-brand-500 text-brand-500'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
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
          <h2 className="font-display text-xl tracking-wider text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-yellow-500" /> PERSONAL RECORDS
          </h2>
          {prs.length === 0 ? (
            <p className="text-zinc-400 text-sm">Log workouts with weights to see your PRs.</p>
          ) : (
            <div className="space-y-3">
              {prs.map(([name, { weight, reps, date }]) => (
                <div key={name} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{name}</div>
                    <div className="text-xs text-zinc-400">{format(parseISO(date), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg text-brand-500">{weight}kg</div>
                    <div className="text-xs text-zinc-400">{reps} reps</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent workouts */}
        <div className="card p-5">
          <h2 className="font-display text-xl tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">RECENT WORKOUTS</h2>
          {workouts.length === 0 ? (
            <p className="text-zinc-400 text-sm">No workouts yet. Start logging!</p>
          ) : (
            <div className="space-y-3">
              {workouts.slice(0, 5).map(w => (
                <button
                  key={w.id}
                  onClick={() => navigate(`/log/${w.date}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {format(parseISO(w.date), 'EEE, MMM d')}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {w.workout_exercises?.length || 0} exercises
                    </div>
                  </div>
                  <div className="text-xs font-medium text-brand-500">View →</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
