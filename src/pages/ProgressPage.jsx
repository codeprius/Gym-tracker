import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, parseISO, subMonths } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

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
      .from('workouts').select('date, workout_exercises(exercise_name, sets(reps, weight_kg))')
      .eq('user_id', user.id).gte('date', threeMonthsAgo).order('date')
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
    setWeightData(wData); setVolumeData(vData)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(8,20,10,0.95)', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 20px rgba(22,163,74,0.2)' }}>
        <p className="text-xs mb-1" style={{ color: '#4b5563' }}>{label}</p>
        <p className="font-bold" style={{ color: tab === 'weight' ? '#4ade80' : '#fbbf24' }}>
          {payload[0].value}{tab === 'weight' ? 'kg' : 'kg vol'}
        </p>
      </div>
    )
    return null
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(74,222,128,0.3)', borderTopColor: '#4ade80' }} />
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-5xl tracking-wider" style={{ color: '#e2e8f0' }}>PROGRESS</h1>
        <p className="text-sm mt-1" style={{ color: '#4b5563' }}>Last 3 months</p>
      </div>

      {exerciseNames.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📈</div>
          <p className="font-semibold" style={{ color: '#6b7280' }}>No data yet.</p>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>Log workouts to see your progress.</p>
        </div>
      ) : (
        <>
          <div className="card p-4">
            <label className="label">Exercise</label>
            <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} className="input">
              {exerciseNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
            {[{ id: 'weight', label: 'Max Weight' }, { id: 'volume', label: 'Total Volume' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={tab === t.id
                  ? { background: tab === 'weight' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', boxShadow: `0 0 16px ${tab === 'weight' ? 'rgba(22,163,74,0.3)' : 'rgba(217,119,6,0.3)'}` }
                  : { color: '#6b7280' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#6b7280' }}>
              {selectedExercise} — {tab === 'weight' ? 'Max Weight (kg)' : 'Total Volume (kg)'}
            </h2>
            {(tab === 'weight' ? weightData : volumeData).length < 2 ? (
              <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#4b5563' }}>
                Log this exercise more to see trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                {tab === 'weight' ? (
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="weight" stroke="#4ade80" strokeWidth={2.5}
                      dot={{ fill: '#4ade80', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: '#4ade80', boxShadow: '0 0 12px rgba(74,222,128,0.6)' }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
