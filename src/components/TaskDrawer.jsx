import { useState, useEffect } from 'react'

const CATEGORIAS = ['Estrategia', 'Operaciones', 'Programación', 'Marketing', 'Diseño']
const PRIORIDADES = [
  { id: 'alta', label: 'Alta', color: '#ff4545', dim: 'rgba(255,69,69,0.1)' },
  { id: 'media', label: 'Media', color: '#f5a623', dim: 'rgba(245,166,35,0.1)' },
  { id: 'normal', label: 'Normal', color: '#404040', dim: 'rgba(64,64,64,0.2)' },
]

export default function TaskDrawer({ isOpen, onClose, onSave, task = null, members = [], teams = [], saving = false }) {
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '',
    due_date: '', team_id: ''
  })

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        team_id: task.team_id || ''
      })
    } else {
      setForm({ title:'',description:'',assigned_to:'',due_date:'',team_id:'' })
    }
  }, [task, isOpen])

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

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
            {task ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-[6px] text-[#404040] text-sm flex items-center justify-center
                       hover:bg-[#141414] hover:text-[#c8c8c8] transition-all">✕</button>
        </div>

        {/* Campos */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Título */}
          <div>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="¿Qué hay que hacer?"
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
              placeholder="Contexto o instrucciones..."
              rows={3}
              className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                         text-xs text-[#c8c8c8] placeholder:text-[#404040]
                         px-3 py-2.5 resize-none outline-none
                         focus:border-[rgba(18,252,217,0.3)] transition-colors" />
          </div>

          {/* Asignado + Fecha + Equipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
                Asignado a
              </label>
              <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
                className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                           text-xs text-[#c8c8c8] px-3 py-2.5 outline-none
                           focus:border-[rgba(18,252,217,0.3)] transition-colors appearance-none">
                <option value="">Sin asignar</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
                Fecha límite
              </label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                           text-xs text-[#707070] px-3 py-2.5 outline-none
                           focus:border-[rgba(18,252,217,0.3)] transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
              Equipo
            </label>
            <select value={form.team_id} onChange={e => set('team_id', e.target.value)}
              className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                         text-xs text-[#c8c8c8] px-3 py-2.5 outline-none
                         focus:border-[rgba(18,252,217,0.3)] transition-colors appearance-none">
              <option value="">Sin equipo</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1c1c1c] flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="text-xs text-[#404040] hover:text-[#707070] px-4 py-2 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onSave(form)}
            disabled={!form.title.trim() || saving}
            className="text-xs font-extrabold bg-[#12fcd9] text-black px-5 py-2 rounded-[7px]
                       hover:shadow-[0_0_16px_rgba(18,252,217,0.25)] hover:opacity-90
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            {saving ? 'Guardando...' : (task ? 'Guardar cambios' : 'Crear tarea')}
          </button>
        </div>
      </div>
    </>
  )
}
