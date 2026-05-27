export default function MetricsPanel({ total, vencidas, porAprobar }) {
  return (
    <div className="space-y-6">
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-3 sm:p-4 rounded-2xl flex flex-col items-center col-span-2 sm:col-span-1">
          <span className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold tracking-widest mb-1">Total Tareas</span>
          <span className="text-xl sm:text-2xl font-black text-[rgb(var(--text-primary))]">{total || 0}</span>
        </div>
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-3 sm:p-4 rounded-2xl flex flex-col items-center">
          <span className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold tracking-widest mb-1">Vencidas</span>
          <span className="text-xl sm:text-2xl font-black text-[#ff4545]">{vencidas || 0}</span>
        </div>
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-3 sm:p-4 rounded-2xl flex flex-col items-center">
          <span className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-bold tracking-widest mb-1">Revisión</span>
          <span className="text-xl sm:text-2xl font-black text-[#f5a623]">{porAprobar || 0}</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Estado */}
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-4 sm:p-6 rounded-[22px]">
          <h3 className="text-xs font-bold text-[rgb(var(--text-secondary))] mb-6 uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[rgb(var(--primary))] rounded-full"></div>
            Estado del Proyecto
          </h3>
          <div className="h-48 flex items-center justify-center relative">
            <div className="w-32 h-32 rounded-full border-[10px] border-[#141414] border-t-[rgb(var(--primary))] border-r-[rgb(var(--primary),0.3)] animate-spin-slow"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-[rgb(var(--text-primary))]">68%</span>
              <span className="text-[8px] text-[rgb(var(--text-muted))] font-bold tracking-widest">COMPLETADO</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[rgb(var(--primary))]"></div>
              <span className="text-[10px] text-[rgb(var(--text-secondary))]">Completadas (24)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[rgb(var(--card-hover))]"></div>
              <span className="text-[10px] text-[rgb(var(--text-secondary))]">Pendientes (12)</span>
            </div>
          </div>
        </div>

        {/* Productividad Semanal */}
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-4 sm:p-6 rounded-[22px]">
          <h3 className="text-xs font-bold text-[rgb(var(--text-secondary))] mb-6 uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#f5a623] rounded-full"></div>
            Actividad Semanal
          </h3>
          <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 px-2">
            {[35, 65, 40, 85, 55, 25, 15].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div 
                  className="w-full bg-[rgb(var(--card-hover))] rounded-t-md relative group transition-all hover:bg-[rgb(var(--primary),0.2)]"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[rgb(var(--border))] text-[rgb(var(--primary))] text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {h} tks
                  </div>
                </div>
                <span className="text-[9px] text-[rgb(var(--text-muted))] font-bold uppercase">
                  {['Lun','Mar','Mie','Jue','Vie','Sab','Dom'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
