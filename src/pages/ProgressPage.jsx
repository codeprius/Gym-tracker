import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, parseISO, subMonths } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'

export default function ProgressPage() {
  const { user } = useAuth()
  const [allWorkouts, setAllWorkouts] = useState([])
  const [exerciseNames, setExerciseNames] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [weightData, setWeightData] = useState([])
  const [volumeData, setVolumeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('weight')

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (selectedExercise) buildCharts() }, [selectedExercise, allWorkouts])

  async function fetchAll() {
    setLoading(true)
    const threeMonthsAgo = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('workouts')
      .select('date, workout_exercises(exercise_name, sets(reps, weight_kg))')
      .eq('user_id', user.id)
      .gte('date', threeMonthsAgo)
      .order('date')
    if (data) {
      setAllWorkouts(data)
      const names = [...new Set(data.flatMap(w => w.workout_exercises?.map(we => we.exercise_name) || []))]
      setExerciseNames(names.sort())
      if (names.length > 0) setSelectedExercise(names[0])
    }
    setLoading(false)
  }

  function buildCharts() {
    const wData = [], vData = []
    for (const workout of allWorkouts) {
      const we = workout.workout_exercises?.find(e => e.exercise_name === selectedExercise)
      if (!we) continue
      const maxWeight = Math.max(...(we.sets?.map(s => s.weight_kg || 0) || [0]))
      const volume = we.sets?.reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0) || 0
      const label = format(parseISO(workout.date), 'MMM d')
      if (maxWeight > 0) wData.push({ date: label, weight: maxWeight })
      if (volume > 0) vData.push({ date: label, volume: Math.round(volume) })
    }
    setWeightData(wData)
    setVolumeData(vData)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-xl">
          <p className="text-zinc-400 text-xs mb-1">{label}</p>
          <p className="text-brand-400 font-bold">{payload[0].value}{tab === 'weight' ? 'kg' : 'kg vol'}</p>
        </div>
      )
    }
    return null
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-4xl tracking-wider text-zinc-900 dark:text-zinc-100">PROGRESS</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Last 3 months</p>
      </div>

      {exerciseNames.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">No data yet.</p>
          <p className="text-zinc-400 text-sm mt-1">Log some workouts to see your progress charts.</p>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div className="card p-4">
            <label className="label">Exercise</label>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="input"
            >
              {exerciseNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
            {[
              { id: 'weight', label: 'Max Weight' },
              { id: 'volume', label: 'Total Volume' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.id
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="card p-5">
            <h2 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
              {selectedExercise} — {tab === 'weight' ? 'Max Weight (kg)' : 'Total Volume (kg)'}
            </h2>
            {(tab === 'weight' ? weightData : volumeData).length < 2 ? (
              <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">
                Not enough data yet. Log this exercise more to see trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                {tab === 'weight' ? (
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={{ fill: '#f97316', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: '#f97316' }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}
