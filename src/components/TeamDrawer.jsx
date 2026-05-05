import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function TeamDrawer({ isOpen, onClose, onSave, team = null }) {
  const { profile } = useAuth()
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (team) {
      setForm({ name: team.name, description: team.description || '' })
    } else {
      setForm({ name: '', description: '' })
    }
  }, [team, isOpen])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    
    try {
      if (team) {
        await supabase
          .from('teams')
          .update({ name: form.name.trim(), description: form.description.trim() })
          .eq('id', team.id)
      } else {
        await supabase
          .from('teams')
          .insert({
            organization_id: profile.organization_id,
            name: form.name.trim(),
            description: form.description.trim()
          })
      }
      onSave()
    } catch (error) {
      console.error("Error guardando equipo:", error)
      alert("Hubo un error al guardar el equipo.")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[400px] max-w-full z-50
                      bg-[#0c0c0c] border-l border-[#1c1c1c] flex flex-col
                      animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c]">
          <h2 className="text-sm font-bold text-[#f0f0f0]">
            {team ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-[6px] text-[#404040] text-sm flex items-center justify-center
                       hover:bg-[#141414] hover:text-[#c8c8c8] transition-all">✕</button>
        </div>

        {/* Campos */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Nombre */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
              Nombre del equipo
            </label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Ej. Marketing, Desarrollo..."
              className="w-full bg-transparent border-none outline-none text-base font-semibold
                         text-[#f0f0f0] placeholder:text-[#404040]" />
            <div className="h-px bg-[#1c1c1c] mt-2" />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
              Descripción
            </label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Descripción del equipo..."
              rows={4}
              className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                         text-xs text-[#c8c8c8] placeholder:text-[#404040]
                         px-3 py-2.5 resize-none outline-none
                         focus:border-[rgba(var(--primary),0.3)] transition-colors" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1c1c1c] flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={saving}
            className="text-xs text-[#404040] hover:text-[#707070] px-4 py-2 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="text-xs font-extrabold bg-[rgb(var(--primary))] text-black px-5 py-2 rounded-[7px]
                       hover:shadow-[0_0_16px_rgba(var(--primary),0.25)] hover:opacity-90
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            {saving ? 'Guardando...' : (team ? 'Guardar cambios' : 'Crear equipo')}
          </button>
        </div>
      </div>
    </>
  )
}
