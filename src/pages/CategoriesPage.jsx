import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_CATEGORIES } from '../data/exercises'
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const COLORS = ['var(--c-primary)','var(--c-accent)','#3b82f6','#ec4899','#f97316','#8b5cf6','#06b6d4','#ef4444','#a3e635','#e879f9']

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
    const { data } = await supabase.from('categories')
      .insert({ user_id: user.id, name: newCat.name.trim(), color: newCat.color, exercises: [] })
      .select().single()
    if (data) { setUserCategories(prev => [...prev, data]); setNewCat({ name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] }) }
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
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--c-primary-glow)', borderTopColor: 'var(--c-primary)' }} />
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-5xl tracking-wider" style={{ color: '#e2e8f0' }}>CATEGORIES</h1>
        <p className="text-sm mt-1" style={{ color: '#4b5563' }}>Manage your exercise categories</p>
      </div>

      {/* Create new */}
      <div className="card p-5">
        <h2 className="font-display text-xl tracking-wider mb-4" style={{ color: 'var(--c-primary)' }}>NEW CATEGORY</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label">Name</label>
            <input type="text" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && createCategory()} placeholder="e.g. Glutes, Olympic Lifts..." className="input" />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-1.5 flex-wrap max-w-[180px]">
              {COLORS.map(c => (
                <button key={c} onClick={() => setNewCat(p => ({ ...p, color: c }))}
                  className="w-6 h-6 rounded-full transition-all"
                  style={{ backgroundColor: c, outline: newCat.color === c ? `2px solid white` : 'none', outlineOffset: '2px', boxShadow: newCat.color === c ? `0 0 8px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>
          <button onClick={createCategory} disabled={!newCat.name.trim() || saving} className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-40">
            <PlusIcon className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* Default categories */}
      <div>
        <h2 className="font-display text-lg tracking-wider mb-3" style={{ color: '#374151' }}>DEFAULT CATEGORIES</h2>
        <div className="grid md:grid-cols-2 gap-2">
          {DEFAULT_CATEGORIES.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-sm font-medium" style={{ color: '#4b5563' }}>{cat.name}</span>
              <span className="ml-auto text-xs" style={{ color: '#374151' }}>{cat.exercises.length} · built-in</span>
            </div>
          ))}
        </div>
      </div>

      {/* User categories */}
      {userCategories.length > 0 && (
        <div>
          <h2 className="font-display text-xl tracking-wider mb-3" style={{ color: 'var(--c-primary)' }}>YOUR CATEGORIES</h2>
          <div className="space-y-3">
            {userCategories.map(cat => (
              <div key={cat.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
                  {editingCat === cat.id ? (
                    <form className="flex gap-2 flex-1" onSubmit={e => { e.preventDefault(); updateCategoryName(cat.id, e.target.catname.value) }}>
                      <input name="catname" defaultValue={cat.name} className="input flex-1 py-1" autoFocus />
                      <button type="submit" className="p-1.5 rounded-lg" style={{ color: 'var(--c-primary)', background: 'rgba(22,163,74,0.1)' }}><CheckIcon className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setEditingCat(null)} className="p-1.5 rounded-lg" style={{ color: '#6b7280', background: 'rgba(255,255,255,0.05)' }}><XMarkIcon className="w-4 h-4" /></button>
                    </form>
                  ) : (
                    <>
                      <span className="font-semibold flex-1 text-sm" style={{ color: '#e2e8f0' }}>{cat.name}</span>
                      <span className="text-xs" style={{ color: '#4b5563' }}>{cat.exercises?.length || 0} exercises</span>
                      <button onClick={() => setEditingCat(cat.id)} className="p-1.5 rounded-lg transition-all" style={{ color: '#4b5563' }} onMouseEnter={e => e.currentTarget.style.color='var(--c-primary)'} onMouseLeave={e => e.currentTarget.style.color='#4b5563'}><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} className="text-xs font-medium px-2 py-1 rounded-lg transition-all" style={{ color: 'var(--c-primary)', background: 'rgba(22,163,74,0.08)' }}>
                        {expandedCat === cat.id ? 'Close' : 'Edit'}
                      </button>
                      <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg transition-all" style={{ color: '#4b5563' }} onMouseEnter={e => { e.currentTarget.style.color='#f87171'; e.currentTarget.style.background='rgba(239,68,68,0.1)' }} onMouseLeave={e => { e.currentTarget.style.color='#4b5563'; e.currentTarget.style.background='transparent' }}><TrashIcon className="w-4 h-4" /></button>
                    </>
                  )}
                </div>

                {expandedCat === cat.id && (
                  <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(34,197,94,0.1)' }}>
                    <div className="flex flex-wrap gap-2">
                      {(cat.exercises || []).map(ex => (
                        <span key={ex} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--c-border)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--c-primary)' }}>
                          {ex}
                          <button onClick={() => removeExerciseFromCategory(cat.id, ex)} style={{ color: '#4b5563' }} onMouseEnter={e => e.currentTarget.style.color='#f87171'} onMouseLeave={e => e.currentTarget.style.color='#4b5563'}>
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {!(cat.exercises?.length) && <span className="text-xs" style={{ color: '#4b5563' }}>No exercises yet.</span>}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newExercise[cat.id] || ''} onChange={e => setNewExercise(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addExerciseToCategory(cat.id)}
                        placeholder="New exercise name..." className="input flex-1 text-sm py-1.5" />
                      <button onClick={() => addExerciseToCategory(cat.id)} disabled={!newExercise[cat.id]?.trim()} className="btn-primary py-1.5 px-3 flex items-center gap-1 text-sm disabled:opacity-40">
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
