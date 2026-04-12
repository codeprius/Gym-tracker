import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_CATEGORIES } from '../data/exercises'
import { format, parseISO } from 'date-fns'
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function LogPage() {
  const { date: dateParam } = useParams()
  const { user } = useAuth()
  const date = dateParam || format(new Date(), 'yyyy-MM-dd')

  const [workout, setWorkout] = useState(null)
  const workoutRef = useRef(null)
  const [exercises, setExercises] = useState([])
  const [userCategories, setUserCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerCategory, setPickerCategory] = useState(null)
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [workoutNotes, setWorkoutNotes] = useState('')

  useEffect(() => { fetchWorkout() }, [date])
  useEffect(() => { workoutRef.current = workout }, [workout])

  async function fetchWorkout() {
    setLoading(true)
    const { data: cats } = await supabase.from('categories').select('*').eq('user_id', user.id)
    setUserCategories([...DEFAULT_CATEGORIES, ...(cats || [])])

    const { data: w } = await supabase
      .from('workouts').select('*').eq('user_id', user.id).eq('date', date).maybeSingle()

    if (w) {
      setWorkout(w); workoutRef.current = w
      setWorkoutNotes(w.notes || '')
      const { data: wes } = await supabase
        .from('workout_exercises').select('*, sets(*)').eq('workout_id', w.id).order('order_index')
      setExercises((wes || []).map(we => ({ ...we, sets: (we.sets || []).sort((a, b) => a.set_number - b.set_number) })))
    } else {
      setWorkout(null); workoutRef.current = null
      setExercises([]); setWorkoutNotes('')
    }
    setLoading(false)
  }

  async function ensureWorkout() {
    if (workoutRef.current) return workoutRef.current
    const { data: existing } = await supabase.from('workouts').select('*').eq('user_id', user.id).eq('date', date).maybeSingle()
    if (existing) { setWorkout(existing); workoutRef.current = existing; return existing }
    const { data, error } = await supabase.from('workouts').insert({ user_id: user.id, date, notes: '' }).select().single()
    if (error) { console.error('ensureWorkout error:', error); return null }
    setWorkout(data); workoutRef.current = data; return data
  }

  async function handleAddExercise(exerciseName) {
    if (saving) return
    setSaving(true)
    setShowPicker(false)
    setPickerCategory(null)

    const w = await ensureWorkout()
    if (!w) { alert('Could not create workout session.'); setSaving(false); return }

    const { data: we, error } = await supabase
      .from('workout_exercises')
      .insert({ workout_id: w.id, exercise_name: exerciseName, category_id: null, order_index: exercises.length })
      .select().single()

    if (error) { console.error('addExercise error:', error); alert('Error: ' + error.message); setSaving(false); return }
    setExercises(prev => [...prev, { ...we, sets: [] }])
    setExpandedExercise(we.id)
    setSaving(false)
  }

  async function addSet(weId) {
    const we = exercises.find(e => e.id === weId)
    const setNumber = (we.sets?.length || 0) + 1
    const lastSet = we.sets?.[we.sets.length - 1]
    const { data: set } = await supabase.from('sets')
      .insert({ workout_exercise_id: weId, set_number: setNumber, reps: lastSet?.reps || null, weight_kg: lastSet?.weight_kg || null })
      .select().single()
    if (set) setExercises(prev => prev.map(e => e.id === weId ? { ...e, sets: [...(e.sets || []), set] } : e))
  }

  async function updateSet(weId, setId, field, value) {
    const numValue = value === '' ? null : parseFloat(value)
    await supabase.from('sets').update({ [field]: numValue }).eq('id', setId)
    setExercises(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, [field]: numValue } : s) } : e))
  }

  async function deleteSet(weId, setId) {
    await supabase.from('sets').delete().eq('id', setId)
    setExercises(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.filter(s => s.id !== setId) } : e))
  }

  async function deleteExercise(weId) {
    await supabase.from('workout_exercises').delete().eq('id', weId)
    setExercises(prev => prev.filter(e => e.id !== weId))
  }

  async function updateExerciseNotes(weId, notes) {
    await supabase.from('workout_exercises').update({ notes }).eq('id', weId)
    setExercises(prev => prev.map(e => e.id === weId ? { ...e, notes } : e))
  }

  async function saveWorkoutNotes() {
    const w = workoutRef.current
    if (!w) return
    await supabase.from('workouts').update({ notes: workoutNotes }).eq('id', w.id)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(74,222,128,0.3)', borderTopColor: '#4ade80' }} />
    </div>
  )

  const displayDate = parseISO(date)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-5xl tracking-wider" style={{ color: '#e2e8f0' }}>
            {format(displayDate, 'EEE').toUpperCase()}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>{format(displayDate, 'MMMM d, yyyy')}</p>
        </div>
        <button onClick={() => setShowPicker(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          {saving ? 'Adding...' : 'Add Exercise'}
        </button>
      </div>

      {/* Workout notes */}
      <div className="card p-4">
        <label className="label">Workout Notes</label>
        <textarea
          value={workoutNotes}
          onChange={e => setWorkoutNotes(e.target.value)}
          onBlur={saveWorkoutNotes}
          placeholder="How did this session go? Any notes..."
          rows={2}
          className="input resize-none"
        />
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏋️</div>
          <p className="font-semibold mb-1" style={{ color: '#6b7280' }}>No exercises logged yet.</p>
          <p className="text-sm" style={{ color: '#4b5563' }}>Click "Add Exercise" to start your session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map(we => {
            const isExpanded = expandedExercise === we.id
            const totalVol = we.sets?.reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0) || 0
            return (
              <div key={we.id} className="card overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer transition-all"
                  style={{ background: isExpanded ? 'rgba(22,163,74,0.05)' : 'transparent' }}
                  onClick={() => setExpandedExercise(isExpanded ? null : we.id)}
                >
                  <div>
                    <div className="font-semibold" style={{ color: '#e2e8f0' }}>{we.exercise_name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#4b5563' }}>
                      {we.sets?.length || 0} sets
                      {totalVol > 0 && <span style={{ color: '#fbbf24' }}> · {totalVol.toLocaleString()}kg vol</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); deleteExercise(we.id) }}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: '#4b5563' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    {isExpanded
                      ? <ChevronUpIcon className="w-4 h-4" style={{ color: '#4ade80' }} />
                      : <ChevronDownIcon className="w-4 h-4" style={{ color: '#4b5563' }} />
                    }
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4" style={{ borderTop: '1px solid rgba(34,197,94,0.1)' }}>
                    <div>
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#4b5563' }}>
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Weight (kg)</div>
                        <div className="col-span-4">Reps</div>
                        <div className="col-span-3"></div>
                      </div>
                      <div className="space-y-2">
                        {we.sets?.map(set => (
                          <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.15)', color: '#4ade80' }}>
                              {set.set_number}
                            </div>
                            <input type="number" step="0.5" min="0" defaultValue={set.weight_kg ?? ''} onBlur={e => updateSet(we.id, set.id, 'weight_kg', e.target.value)} placeholder="0" className="col-span-4 input py-1.5 text-center text-sm" />
                            <input type="number" min="1" defaultValue={set.reps ?? ''} onBlur={e => updateSet(we.id, set.id, 'reps', e.target.value)} placeholder="0" className="col-span-4 input py-1.5 text-center text-sm" />
                            <button onClick={() => deleteSet(we.id, set.id)} className="col-span-3 flex justify-center transition-colors" style={{ color: '#4b5563' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                              onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addSet(we.id)} className="mt-3 flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: '#4ade80' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#86efac'}
                        onMouseLeave={e => e.currentTarget.style.color = '#4ade80'}
                      >
                        <PlusIcon className="w-4 h-4" /> Add Set
                      </button>
                    </div>
                    <div>
                      <label className="label">Notes</label>
                      <input type="text" defaultValue={we.notes || ''} onBlur={e => updateExerciseNotes(we.id, e.target.value)} placeholder="Form cues, how it felt..." className="input text-sm" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ===== GLASS CARD PICKER MODAL ===== */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowPicker(false); setPickerCategory(null) } }}
        >
          <div
            className="w-full max-w-2xl animate-glass-in flex flex-col"
            style={{
              maxHeight: '80vh',
              background: 'rgba(8, 20, 10, 0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '24px',
              boxShadow: '0 0 60px rgba(22,163,74,0.15), 0 0 120px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 shrink-0" style={{ borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
              <div className="flex items-center gap-3">
                {pickerCategory && (
                  <button
                    type="button"
                    onClick={() => setPickerCategory(null)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </button>
                )}
                <h3 className="font-display text-2xl tracking-widest" style={{ color: pickerCategory ? '#fbbf24' : '#4ade80', textShadow: pickerCategory ? '0 0 20px rgba(251,191,36,0.3)' : '0 0 20px rgba(74,222,128,0.3)' }}>
                  {pickerCategory ? pickerCategory.name.toUpperCase() : 'PICK CATEGORY'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowPicker(false); setPickerCategory(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{ color: '#6b7280', background: 'rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-5">
              {!pickerCategory ? (
                /* Category Cards Grid */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {userCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPickerCategory(cat)}
                      className="p-4 text-left rounded-2xl transition-all group"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${cat.color}33`,
                        backdropFilter: 'blur(8px)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${cat.color}15`
                        e.currentTarget.style.border = `1px solid ${cat.color}66`
                        e.currentTarget.style.boxShadow = `0 0 24px ${cat.color}20`
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.border = `1px solid ${cat.color}33`
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {/* Color dot + count */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }} />
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${cat.color}20`, color: cat.color }}>
                          {cat.exercises?.length || 0}
                        </span>
                      </div>
                      <div className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{cat.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#4b5563' }}>exercises</div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Exercise Cards Grid */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pickerCategory.exercises?.map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => handleAddExercise(ex)}
                      className="p-4 text-left rounded-2xl transition-all"
                      style={{
                        background: 'rgba(251,191,36,0.04)',
                        border: '1px solid rgba(251,191,36,0.15)',
                        backdropFilter: 'blur(8px)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(251,191,36,0.12)'
                        e.currentTarget.style.border = '1px solid rgba(251,191,36,0.4)'
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(251,191,36,0.1)'
                        e.currentTarget.style.color = '#fbbf24'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(251,191,36,0.04)'
                        e.currentTarget.style.border = '1px solid rgba(251,191,36,0.15)'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.color = '#e2e8f0'
                      }}
                    >
                      {/* Gold accent line */}
                      <div className="w-8 h-0.5 rounded-full mb-3" style={{ background: 'linear-gradient(90deg, #fbbf24, transparent)' }} />
                      <div className="text-sm font-semibold leading-snug" style={{ color: 'inherit' }}>{ex}</div>
                      <div className="text-xs mt-1" style={{ color: '#4b5563' }}>tap to add</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
