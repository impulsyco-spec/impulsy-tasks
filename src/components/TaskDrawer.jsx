import { useState, useEffect } from 'react'

const CATEGORIAS = ['Estrategia', 'Operaciones', 'Programación', 'Marketing', 'Diseño']
const PRIORIDADES = [
  { id: 'alta', label: 'Alta', color: '#ff4545', dim: 'rgba(255,69,69,0.1)' },
  { id: 'media', label: 'Media', color: '#f5a623', dim: 'rgba(245,166,35,0.1)' },
  { id: 'normal', label: 'Normal', color: '#404040', dim: 'rgba(64,64,64,0.2)' },
]

export default function TaskDrawer({ abierto, onCerrar, onGuardar, tareaInicial = null, reuniones = [] }) {
  const [form, setForm] = useState({
    titulo: '', descripcion: '', asignado: '',
    fechaVencimiento: '', categoria: '', prioridad: 'normal', reunionId: ''
  })

  useEffect(() => {
    if (tareaInicial) setForm(tareaInicial)
    else setForm({ titulo:'',descripcion:'',asignado:'',fechaVencimiento:'',categoria:'',prioridad:'normal',reunionId:'' })
  }, [tareaInicial, abierto])

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  if (!abierto) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[400px] max-w-full z-50
                      bg-[#0c0c0c] border-l border-[#1c1c1c] flex flex-col
                      animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c]">
          <h2 className="text-sm font-bold text-[#f0f0f0]">
            {tareaInicial ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={onCerrar}
            className="w-7 h-7 rounded-[6px] text-[#404040] text-sm flex items-center justify-center
                       hover:bg-[#141414] hover:text-[#c8c8c8] transition-all">✕</button>
        </div>

        {/* Campos */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Título */}
          <div>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)}
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
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Contexto o instrucciones..."
              rows={3}
              className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                         text-xs text-[#c8c8c8] placeholder:text-[#404040]
                         px-3 py-2.5 resize-none outline-none
                         focus:border-[rgba(18,252,217,0.3)] transition-colors" />
          </div>

          {/* Asignado + Fecha — 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
                Asignado a
              </label>
              <input value={form.asignado} onChange={e => set('asignado', e.target.value)}
                placeholder="Nombre..."
                className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                           text-xs text-[#c8c8c8] placeholder:text-[#404040]
                           px-3 py-2.5 outline-none focus:border-[rgba(18,252,217,0.3)] transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
                Fecha límite
              </label>
              <input type="date" value={form.fechaVencimiento} onChange={e => set('fechaVencimiento', e.target.value)}
                className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                           text-xs text-[#707070] px-3 py-2.5 outline-none
                           focus:border-[rgba(18,252,217,0.3)] transition-colors" />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
              Categoría
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIAS.map(c => (
                <button key={c} onClick={() => set('categoria', c)}
                  className={`text-xs font-semibold px-3 py-1 rounded-[5px] border transition-all
                    ${form.categoria === c
                      ? 'bg-[rgba(18,252,217,0.12)] border-[rgba(18,252,217,0.3)] text-[#0dd4b8]'
                      : 'border-[#1c1c1c] bg-transparent text-[#404040] hover:border-[#252525] hover:text-[#707070]'
                    }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
              Prioridad
            </label>
            <div className="flex gap-2">
              {PRIORIDADES.map(p => (
                <button key={p.id} onClick={() => set('prioridad', p.id)}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-[6px] border transition-all`}
                  style={form.prioridad === p.id
                    ? { background: p.dim, borderColor: p.color, color: p.color }
                    : { background: 'transparent', borderColor: '#1c1c1c', color: '#404040' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reunión de origen */}
          {reuniones.length > 0 && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#404040] block mb-2">
                Reunión de origen
              </label>
              <select value={form.reunionId} onChange={e => set('reunionId', e.target.value)}
                className="w-full bg-[#141414] border border-[#1c1c1c] rounded-[8px]
                           text-xs text-[#707070] px-3 py-2.5 outline-none
                           focus:border-[rgba(18,252,217,0.3)] transition-colors">
                <option value="">Sin reunión asignada</option>
                {reuniones.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre} — {r.fecha}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1c1c1c] flex items-center justify-end gap-2">
          <button onClick={onCerrar}
            className="text-xs text-[#404040] hover:text-[#707070] px-4 py-2 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onGuardar(form)}
            disabled={!form.titulo.trim()}
            className="text-xs font-extrabold bg-[#12fcd9] text-black px-5 py-2 rounded-[7px]
                       hover:shadow-[0_0_16px_rgba(18,252,217,0.25)] hover:opacity-90
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            {tareaInicial ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </div>
    </>
  )
}
