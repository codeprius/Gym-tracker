import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_CATEGORIES } from '../data/exercises'
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const COLORS = ['#f97316','#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4','#ef4444','#84cc16','#a855f7']

export default function CategoriesPage() {
  const { user } = useAuth()
  const [userCategories, setUserCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCat, setNewCat] = useState({ name: '', color: COLORS[0] })
  const [newExercise, setNewExercise] = useState({})
  const [editingCat, setEditingCat] = useState(null)
  const [expandedCat, setExpandedCat] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').eq('user_id', user.id).order('created_at')
    setUserCategories(data || [])
    setLoading(false)
  }

  async function createCategory() {
    if (!newCat.name.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: newCat.name.trim(), color: newCat.color, exercises: [] })
      .select()
      .single()
    if (data) {
      setUserCategories(prev => [...prev, data])
      setNewCat({ name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] })
    }
    setSaving(false)
  }

  async function deleteCategory(id) {
    await supabase.from('categories').delete().eq('id', id)
    setUserCategories(prev => prev.filter(c => c.id !== id))
  }

  async function addExerciseToCategory(catId) {
    const name = newExercise[catId]?.trim()
    if (!name) return
    const cat = userCategories.find(c => c.id === catId)
    const exercises = [...(cat.exercises || []), name]
    const { data } = await supabase.from('categories').update({ exercises }).eq('id', catId).select().single()
    if (data) setUserCategories(prev => prev.map(c => c.id === catId ? data : c))
    setNewExercise(prev => ({ ...prev, [catId]: '' }))
  }

  async function removeExerciseFromCategory(catId, exName) {
    const cat = userCategories.find(c => c.id === catId)
    const exercises = (cat.exercises || []).filter(e => e !== exName)
    const { data } = await supabase.from('categories').update({ exercises }).eq('id', catId).select().single()
    if (data) setUserCategories(prev => prev.map(c => c.id === catId ? data : c))
  }

  async function updateCategoryName(catId, name) {
    const { data } = await supabase.from('categories').update({ name }).eq('id', catId).select().single()
    if (data) setUserCategories(prev => prev.map(c => c.id === catId ? data : c))
    setEditingCat(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-4xl tracking-wider text-zinc-900 dark:text-zinc-100">CATEGORIES</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage your exercise categories</p>
      </div>

      {/* Create new category */}
      <div className="card p-5">
        <h2 className="font-display text-xl tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">NEW CATEGORY</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Name</label>
            <input
              type="text"
              value={newCat.name}
              onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && createCategory()}
              placeholder="e.g. Glutes, Olympic Lifts..."
              className="input"
            />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-1.5 flex-wrap max-w-[160px]">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewCat(p => ({ ...p, color: c }))}
                  className={`w-6 h-6 rounded-full transition-all ${newCat.color === c ? 'ring-2 ring-offset-2 ring-zinc-500 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={createCategory}
            disabled={!newCat.name.trim() || saving}
            className="btn-primary flex items-center gap-2 shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Default categories (read-only preview) */}
      <div>
        <h2 className="font-display text-xl tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">DEFAULT CATEGORIES</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {DEFAULT_CATEGORIES.map(cat => (
            <div key={cat.id} className="card p-4 opacity-75">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="font-semibold text-zinc-600 dark:text-zinc-300 text-sm">{cat.name}</span>
                <span className="ml-auto text-xs text-zinc-400">{cat.exercises.length} exercises · built-in</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User categories */}
      {userCategories.length > 0 && (
        <div>
          <h2 className="font-display text-xl tracking-wider text-zinc-900 dark:text-zinc-100 mb-3">YOUR CATEGORIES</h2>
          <div className="space-y-3">
            {userCategories.map(cat => (
              <div key={cat.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />

                  {editingCat === cat.id ? (
                    <form
                      className="flex gap-2 flex-1"
                      onSubmit={e => { e.preventDefault(); updateCategoryName(cat.id, e.target.name.value) }}
                    >
                      <input name="name" defaultValue={cat.name} className="input flex-1 py-1" autoFocus />
                      <button type="submit" className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg">
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditingCat(null)} className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex-1">{cat.name}</span>
                      <span className="text-xs text-zinc-400">{cat.exercises?.length || 0} exercises</span>
                      <button onClick={() => setEditingCat(cat.id)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium">
                        {expandedCat === cat.id ? 'Close' : 'Edit Exercises'}
                      </button>
                      <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {expandedCat === cat.id && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(cat.exercises || []).map(ex => (
                        <span key={ex} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-full">
                          {ex}
                          <button onClick={() => removeExerciseFromCategory(cat.id, ex)} className="text-zinc-400 hover:text-red-500 ml-0.5">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {(cat.exercises || []).length === 0 && (
                        <span className="text-xs text-zinc-400">No exercises yet.</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newExercise[cat.id] || ''}
                        onChange={e => setNewExercise(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addExerciseToCategory(cat.id)}
                        placeholder="New exercise name..."
                        className="input flex-1 text-sm py-1.5"
                      />
                      <button
                        onClick={() => addExerciseToCategory(cat.id)}
                        disabled={!newExercise[cat.id]?.trim()}
                        className="btn-primary py-1.5 px-3 flex items-center gap-1 text-sm"
                      >
                        <PlusIcon className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
