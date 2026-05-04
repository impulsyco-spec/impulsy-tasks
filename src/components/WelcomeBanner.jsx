export default function WelcomeBanner({ nombre, completadas, total, urgentes, porAprobar }) {
  const faltantes = total - completadas
  const porcentaje = Math.round((completadas / total) * 100) || 0
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="relative overflow-hidden bg-[#0c0c0c] border border-[#1c1c1c] rounded-[14px] p-6 mb-6">
      
      {/* Glow decorativo */}
      <div className="absolute -top-10 -left-10 w-48 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(18,252,217,0.06) 0%, transparent 70%)' }} />

      {/* Fila superior */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs text-[#707070] font-medium mb-1">
            Hola, {nombre} 👋 — {hoy}
          </p>
          <p className="text-lg font-bold text-[#f0f0f0] leading-snug">
            Esta semana solo te faltan{' '}
            <span className="text-[#12fcd9]">{faltantes} {faltantes === 1 ? 'tarea' : 'tareas'}</span>{' '}
            para que sigamos avanzando.
          </p>
        </div>

        <div className="flex gap-5 flex-shrink-0 relative z-10">
          <div className="text-right">
            <p className="text-2xl font-extrabold text-[#ff4545] leading-none">{urgentes}</p>
            <p className="text-[10px] text-[#404040] uppercase tracking-wider mt-1">Urgentes</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-[#f5a623] leading-none">{porAprobar}</p>
            <p className="text-[10px] text-[#404040] uppercase tracking-wider mt-1">Por aprobar</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-[#12fcd9] leading-none">{completadas}/{total}</p>
            <p className="text-[10px] text-[#404040] uppercase tracking-wider mt-1">Esta semana</p>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex-1 h-1.5 bg-[#252525] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#12fcd9] transition-all duration-500"
            style={{ width: `${porcentaje}%`, boxShadow: '0 0 10px rgba(18,252,217,0.25)' }}
          />
        </div>
        <span className="text-xs font-semibold text-[#0dd4b8] whitespace-nowrap">
          {completadas} de {total} completadas
        </span>
      </div>
    </div>
  )
}
