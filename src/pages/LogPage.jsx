import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_CATEGORIES } from '../data/exercises'
import { format, parseISO } from 'date-fns'
import {
  PlusIcon, TrashIcon, ChevronDownIcon,
  ChevronUpIcon, CheckIcon, XMarkIcon
} from '@heroicons/react/24/outline'

export default function LogPage() {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const date = dateParam || format(new Date(), 'yyyy-MM-dd')

  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [userCategories, setUserCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [pickerCategory, setPickerCategory] = useState(null)
  const [expandedExercise, setExpandedExercise] = useState(null)
  const [workoutNotes, setWorkoutNotes] = useState('')

  useEffect(() => { fetchWorkout() }, [date])

  async function fetchWorkout() {
    setLoading(true)
    const { data: cats } = await supabase.from('categories').select('*').eq('user_id', user.id)
    const allCategories = [...DEFAULT_CATEGORIES, ...(cats || [])]
    setUserCategories(allCategories)

    const { data: w } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle()

    if (w) {
      setWorkout(w)
      setWorkoutNotes(w.notes || '')
      const { data: wes } = await supabase
        .from('workout_exercises')
        .select('*, sets(*)')
        .eq('workout_id', w.id)
        .order('order_index')
      setExercises((wes || []).map(we => ({
        ...we,
        sets: (we.sets || []).sort((a, b) => a.set_number - b.set_number),
      })))
    } else {
      setWorkout(null)
      setExercises([])
      setWorkoutNotes('')
    }
    setLoading(false)
  }

  async function ensureWorkout() {
    if (workout) return workout
    const { data, error } = await supabase
      .from('workouts')
      .upsert({ user_id: user.id, date, notes: workoutNotes }, { onConflict: 'user_id,date' })
      .select()
      .single()
    if (!error) { setWorkout(data); return data }
    return null
  }

  async function addExercise(exerciseName, categoryId) {
    setSaving(true)
    const w = await ensureWorkout()
    if (!w) { setSaving(false); return }
    const { data: we } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: w.id,
        exercise_name: exerciseName,
        category_id: categoryId || null,
        order_index: exercises.length,
      })
      .select()
      .single()
    if (we) {
      setExercises(prev => [...prev, { ...we, sets: [] }])
      setExpandedExercise(we.id)
    }
    setShowExercisePicker(false)
    setSaving(false)
  }

  async function addSet(weId) {
    const we = exercises.find(e => e.id === weId)
    const setNumber = (we.sets?.length || 0) + 1
    const lastSet = we.sets?.[we.sets.length - 1]
    const { data: set } = await supabase
      .from('sets')
      .insert({
        workout_exercise_id: weId,
        set_number: setNumber,
        reps: lastSet?.reps || null,
        weight_kg: lastSet?.weight_kg || null,
      })
      .select()
      .single()
    if (set) {
      setExercises(prev => prev.map(e =>
        e.id === weId ? { ...e, sets: [...(e.sets || []), set] } : e
      ))
    }
  }

  async function updateSet(weId, setId, field, value) {
    const numValue = value === '' ? null : parseFloat(value)
    await supabase.from('sets').update({ [field]: numValue }).eq('id', setId)
    setExercises(prev => prev.map(e =>
      e.id === weId
        ? { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, [field]: numValue } : s) }
        : e
    ))
  }

  async function deleteSet(weId, setId) {
    await supabase.from('sets').delete().eq('id', setId)
    setExercises(prev => prev.map(e =>
      e.id === weId ? { ...e, sets: e.sets.filter(s => s.id !== setId) } : e
    ))
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
    if (!workout) return
    await supabase.from('workouts').update({ notes: workoutNotes }).eq('id', workout.id)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const displayDate = parseISO(date)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-wider text-zinc-900 dark:text-zinc-100">
            {format(displayDate, 'EEE').toUpperCase()}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{format(displayDate, 'MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={() => setShowExercisePicker(true)}
          className="btn-primary flex items-center gap-2"
          disabled={saving}
        >
          <PlusIcon className="w-4 h-4" />
          Add Exercise
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
          <div className="text-4xl mb-3">🏋️</div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">No exercises logged yet.</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Click "Add Exercise" to start.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map(we => {
            const isExpanded = expandedExercise === we.id
            const totalVol = we.sets?.reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0) || 0
            return (
              <div key={we.id} className="card overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                  onClick={() => setExpandedExercise(isExpanded ? null : we.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{we.exercise_name}</div>
                      <div className="text-xs text-zinc-400">
                        {we.sets?.length || 0} sets
                        {totalVol > 0 && ` · ${totalVol.toLocaleString()}kg total vol`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); deleteExercise(we.id) }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-zinc-400" /> : <ChevronDownIcon className="w-4 h-4 text-zinc-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-4">
                    {/* Sets table */}
                    <div>
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                        <div className="col-span-1">Set</div>
                        <div className="col-span-4">Weight (kg)</div>
                        <div className="col-span-4">Reps</div>
                        <div className="col-span-3"></div>
                      </div>
                      <div className="space-y-2">
                        {we.sets?.map((set, i) => (
                          <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center">
                              {set.set_number}
                            </div>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              defaultValue={set.weight_kg ?? ''}
                              onBlur={e => updateSet(we.id, set.id, 'weight_kg', e.target.value)}
                              placeholder="0"
                              className="col-span-4 input py-1.5 text-center text-sm"
                            />
                            <input
                              type="number"
                              min="1"
                              defaultValue={set.reps ?? ''}
                              onBlur={e => updateSet(we.id, set.id, 'reps', e.target.value)}
                              placeholder="0"
                              className="col-span-4 input py-1.5 text-center text-sm"
                            />
                            <button
                              onClick={() => deleteSet(we.id, set.id)}
                              className="col-span-3 flex justify-center text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addSet(we.id)}
                        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" /> Add Set
                      </button>
                    </div>

                    {/* Exercise notes */}
                    <div>
                      <label className="label">Notes</label>
                      <input
                        type="text"
                        defaultValue={we.notes || ''}
                        onBlur={e => updateExerciseNotes(we.id, e.target.value)}
                        placeholder="Form cues, how it felt..."
                        className="input text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-display text-xl tracking-wider text-zinc-900 dark:text-zinc-100">
                {pickerCategory ? pickerCategory.name.toUpperCase() : 'PICK CATEGORY'}
              </h3>
              <button
                onClick={() => { setShowExercisePicker(false); setPickerCategory(null) }}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {!pickerCategory ? (
                <div className="grid grid-cols-2 gap-2">
                  {userCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setPickerCategory(cat)}
                      className="p-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-brand-500 transition-all text-left"
                      style={{ borderColor: cat.color + '44' }}
                    >
                      <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: cat.color }} />
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{cat.name}</div>
                      <div className="text-xs text-zinc-400">{cat.exercises?.length || 0} exercises</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <button onClick={() => setPickerCategory(null)} className="text-xs text-zinc-400 hover:text-brand-500 mb-2 flex items-center gap-1">
                    ← Back
                  </button>
                  {pickerCategory.exercises?.map(ex => (
                    <button
                      key={ex}
                      onClick={() => addExercise(ex, pickerCategory.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-brand-500 hover:text-white text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-all"
                    >
                      {ex}
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
