import { Search, Filter, Grid2X2, List, Columns3, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function FilterBar({ vista, onVistaChange }) {
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false)

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-3 sm:p-4 rounded-[14px]">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" size={16} />
            <input 
              type="text" 
              placeholder="Buscar tareas..." 
              className="w-full bg-[rgb(var(--card-hover))] border border-[rgb(var(--border))] rounded-xl py-2 pl-10 pr-4 text-xs text-[rgb(var(--text-primary))] focus:border-[rgb(var(--primary))] outline-none transition-all placeholder:text-[rgb(var(--text-muted))]"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => setMostrarAvanzados(!mostrarAvanzados)}
              className={`h-9 px-3 rounded-xl border transition-all flex items-center gap-2 ${
                mostrarAvanzados 
                ? 'bg-[rgb(var(--primary),0.1)] border-[rgb(var(--primary))] text-[rgb(var(--primary))]' 
                : 'bg-[rgb(var(--card-hover))] border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
              }`}
            >
              <Filter size={14} />
              <span className="hidden sm:inline text-xs font-bold">Filtros</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 border-t md:border-t-0 md:border-l border-[rgb(var(--border))] pt-3 md:pt-0 md:pl-4">
          <div className="flex items-center gap-1 bg-[rgb(var(--card-hover))] p-1 rounded-xl border border-[rgb(var(--border))]">
            <button 
              onClick={() => onVistaChange('grid')}
              className={`p-1.5 rounded-lg transition-all ${vista === 'grid' ? 'bg-[rgb(var(--primary))] text-black' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}
            >
              <Grid2X2 size={16} />
            </button>
            <button 
              onClick={() => onVistaChange('list')}
              className={`p-1.5 rounded-lg transition-all ${vista === 'list' ? 'bg-[rgb(var(--primary))] text-black' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => onVistaChange('kanban')}
              className={`p-1.5 rounded-lg transition-all ${vista === 'kanban' ? 'bg-[rgb(var(--primary))] text-black' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}
            >
              <Columns3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Panel filtros avanzados */}
      {mostrarAvanzados && (
        <div className="mt-[-16px] mb-6 p-4 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-b-[14px] border-t-0 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))] mb-3">Responsable</p>
              <div className="space-y-2">
                {['Mío', 'Equipo', 'Sin asignar'].map(n => (
                  <label key={n} className="flex items-center gap-3 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-[rgb(var(--border))] bg-[rgb(var(--card-hover))] checked:bg-[rgb(var(--primary))] accent-[rgb(var(--primary))]" />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))] mb-3">Prioridad</p>
              <div className="space-y-2">
                {['Urgente', 'Alta', 'Media', 'Baja'].map(p => (
                  <label key={p} className="flex items-center gap-3 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-[rgb(var(--border))] bg-[rgb(var(--card-hover))] checked:bg-[rgb(var(--primary))] accent-[rgb(var(--primary))]" />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[rgb(var(--border))] flex justify-end gap-3">
            <button className="text-[10px] font-bold uppercase text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))] px-4 py-2 transition-colors">
              Limpiar
            </button>
            <button className="text-[10px] font-bold uppercase bg-[rgb(var(--primary))] text-black px-6 py-2 rounded-lg hover:brightness-110 transition-all">
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
