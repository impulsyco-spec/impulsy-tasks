import { useState } from 'react'

const FILTROS = [
  { id: 'all', label: 'Todas' },
  { id: 'overdue', label: 'Vencidas', color: '#ff4545', glow: false },
  { id: 'pending_approval', label: 'Por aprobar', color: '#f5a623', glow: false },
  { id: 'active', label: 'Activas', color: '#12fcd9', glow: true },
  { id: 'mine', label: 'Mis tareas', color: '#0dd4b8', glow: false },
  { id: 'completed', label: 'Completadas', color: '#404040', glow: false },
]

export default function FilterBar({ filtroActivo, onCambiarFiltro, conteos = {} }) {
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false)

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => onCambiarFiltro(f.id)}
            className={`h-8 px-3.5 rounded-[7px] border text-xs font-medium
                        flex items-center gap-1.5 transition-all duration-120
                        ${filtroActivo === f.id
                          ? 'bg-[rgba(18,252,217,0.12)] border-[rgba(18,252,217,0.3)] text-[#0dd4b8]'
                          : 'border-[#1c1c1c] bg-transparent text-[#707070] hover:border-[#252525] hover:text-[#c8c8c8]'
                        }`}>
            {f.color && (
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: f.color, boxShadow: f.glow ? `0 0 4px ${f.color}` : 'none' }} />
            )}
            {f.label}
            {conteos[f.id] !== undefined && (
              <span className={`rounded-[4px] px-1 text-[10px] font-bold
                ${filtroActivo === f.id
                  ? 'bg-[rgba(18,252,217,0.2)] text-[#0dd4b8]'
                  : 'bg-[#252525] text-[#707070]'}`}>
                {conteos[f.id]}
              </span>
            )}
          </button>
        ))}

        <button onClick={() => setMostrarAvanzados(v => !v)}
          className="ml-auto h-8 px-3 rounded-[7px] border border-[#1c1c1c]
                     bg-transparent text-[#404040] text-xs font-medium
                     flex items-center gap-1.5 hover:border-[#252525] hover:text-[#707070] transition-all">
          ⊞ Filtros
        </button>
      </div>

      {/* Panel filtros avanzados */}
      {mostrarAvanzados && (
        <div className="mt-2 p-4 bg-[#0c0c0c] border border-[#252525] rounded-[10px]
                        grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#404040] mb-2">Integrante</p>
            {['Luz Ramírez','Carlos M.','Sin asignar'].map(n => (
              <label key={n} className="flex items-center gap-2 text-xs text-[#707070]
                                        hover:text-[#c8c8c8] cursor-pointer mb-1.5">
                <input type="checkbox" className="accent-[#12fcd9]" /> {n}
              </label>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#404040] mb-2">Categoría</p>
            {['Estrategia','Operaciones','Programación'].map(c => (
              <label key={c} className="flex items-center gap-2 text-xs text-[#707070]
                                        hover:text-[#c8c8c8] cursor-pointer mb-1.5">
                <input type="checkbox" className="accent-[#12fcd9]" /> {c}
              </label>
            ))}
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-[#1c1c1c]">
            <button className="text-xs text-[#404040] hover:text-[#707070] px-3 py-1.5 transition-colors">
              Limpiar
            </button>
            <button className="text-xs font-bold bg-[#12fcd9] text-black
                               px-4 py-1.5 rounded-[6px] hover:opacity-90 transition-opacity">
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
