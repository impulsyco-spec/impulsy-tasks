function getBorderColor(status, isOverdue) {
  if (isOverdue) return '#ff4545'
  const map = { pending_approval: '#f5a623', active: '#12fcd9', completed: '#404040', rejected: '#ff4545' }
  return map[status] || '#404040'
}

function getDuePill(fecha, status, isOverdue) {
  if (!fecha) return { texto: 'Sin fecha', clase: 'bg-transparent text-[rgb(var(--text-muted))]' }
  if (status === 'completed') return { texto: fecha, clase: 'bg-transparent text-[rgb(var(--text-muted))]' }
  if (isOverdue) return { texto: '⚠ Vencida', clase: 'bg-[rgba(255,69,69,0.1)] text-[#ff4545]' }
  
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const vence = new Date(fecha + 'T00:00:00'); vence.setHours(0,0,0,0)
  const diff = (vence - hoy) / 86400000
  if (diff <= 1) return { texto: '⚠ mañana', clase: 'bg-[rgba(245,166,35,0.1)] text-[#f5a623]' }
  if (diff <= 4) return { texto: fecha, clase: 'bg-[rgba(245,166,35,0.1)] text-[#f5a623]' }
  return { texto: fecha, clase: 'bg-[rgb(var(--card-hover))] text-[rgb(var(--text-secondary))]' }
}

function getDotStyle(status, isOverdue) {
  if (isOverdue) return { bg: '#ff4545', shadow: '0 0 6px rgba(255,69,69,0.5)' }
  const map = {
    rejected:    { bg: '#ff4545', shadow: '0 0 6px rgba(255,69,69,0.5)' },
    pending_approval:{ bg: '#f5a623', shadow: '0 0 6px rgba(245,166,35,0.4)' },
    active:{ bg: '#12fcd9', shadow: '0 0 6px rgba(18,252,217,0.4)' },
    completed: { bg: '#404040', shadow: 'none' },
  }
  return map[status] || map.completed
}

const BADGE = {
  rejected:    'bg-[rgba(255,69,69,0.1)] text-[#ff4545]',
  pending_approval:'bg-[rgba(245,166,35,0.1)] text-[#f5a623]',
  active:'bg-[rgba(18,252,217,0.12)] text-[#0dd4b8]',
  completed: 'bg-[rgba(52,211,153,0.1)] text-[#34d399]',
}
const BADGE_LABEL = {
  rejected:'RECHAZADA', pending_approval:'POR APROBAR', active:'EN PROGRESO', completed:'COMPLETADA'
}

export default function TaskCard({ task, members, isAdmin, today, onEdit, onApprove, onReject, onComplete }) {
  const isOverdue = task.status === 'active' && task.due_date && task.due_date < today
  const borderColor = getBorderColor(task.status, isOverdue)
  const due = getDuePill(task.due_date, task.status, isOverdue)
  const dot = getDotStyle(task.status, isOverdue)

  return (
    <div
      className="group relative flex bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-[10px] mb-1.5
                 hover:bg-[rgb(var(--card-hover))] hover:border-[rgb(var(--border-hover))] cursor-pointer transition-all duration-150"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Cuerpo */}
      <div className="flex-1 px-4 py-3 flex flex-col gap-1.5 min-w-0">

        {/* Fila 1: dot + título + fecha */}
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: dot.bg, boxShadow: dot.shadow }} />
          <span className={`flex-1 text-sm font-semibold leading-snug
            ${task.status === 'completed' ? 'line-through text-[rgb(var(--text-muted))]' : 'text-[rgb(var(--text-primary))]'}`}>
            {task.title}
          </span>
          <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-[5px] ${due.clase}`}>
            {due.texto}
          </span>
        </div>

        {/* Fila 2: descripción — solo en hover */}
        {task.description && (
          <div className="pl-[18px] max-h-0 overflow-hidden opacity-0
                          group-hover:max-h-[60px] group-hover:opacity-100 transition-all duration-200">
            <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed line-clamp-2">{task.description}</p>
          </div>
        )}

        {/* Fila 3: badge + asignado + categoría */}
        <div className="pl-[18px] flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider ${isOverdue ? BADGE.rejected : BADGE[task.status]}`}>
            {isOverdue ? 'URGENTE' : BADGE_LABEL[task.status]}
          </span>
          <div className="w-0.5 h-0.5 rounded-full bg-[rgb(var(--border-hover))]" />
          <span className={`text-[11px] font-medium flex items-center gap-1
            ${!task.assigned_to ? 'text-[#f5a623]' : 'text-[rgb(var(--text-muted))]'}`}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {task.assigned_profile ? task.assigned_profile.full_name : '⚠ Sin asignar'}
          </span>
          {task.teams && (
            <>
              <div className="w-0.5 h-0.5 rounded-full bg-[rgb(var(--border-hover))]" />
              <span className="text-[10px] font-semibold bg-[rgb(var(--card-hover))] text-[rgb(var(--text-muted))]
                               border border-[rgb(var(--border))] rounded-[4px] px-1.5 py-0.5">
                {task.teams.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Acciones — solo en hover */}
      <div className="flex flex-col justify-center gap-1 px-2.5
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        
        {isAdmin && task.status === 'pending_approval' && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onApprove && onApprove(); }} title="Aprobar"
              className="w-7 h-7 rounded-[6px] text-[rgb(var(--text-muted))] text-xs flex items-center justify-center
                         hover:bg-[rgba(52,211,153,0.1)] hover:text-[#34d399] transition-all">✓</button>
            <button onClick={(e) => { e.stopPropagation(); onReject && onReject(); }} title="Rechazar"
              className="w-7 h-7 rounded-[6px] text-[rgb(var(--text-muted))] text-xs flex items-center justify-center
                         hover:bg-[rgba(255,69,69,0.1)] hover:text-[#ff4545] transition-all">✕</button>
            <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }} title="Editar"
              className="w-7 h-7 rounded-[6px] text-[rgb(var(--text-muted))] text-xs flex items-center justify-center
                         hover:bg-[rgb(var(--border-hover))] hover:text-[rgb(var(--text-primary))] transition-all">✎</button>
          </>
        )}

        {task.status === 'active' && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onComplete && onComplete(); }} title="Completar"
              className="w-7 h-7 rounded-[6px] text-[rgb(var(--text-muted))] text-xs flex items-center justify-center
                         hover:bg-[rgba(18,252,217,0.12)] hover:text-[#12fcd9] transition-all">✓</button>
            {isAdmin && (
              <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }} title="Editar"
                className="w-7 h-7 rounded-[6px] text-[rgb(var(--text-muted))] text-xs flex items-center justify-center
                           hover:bg-[rgb(var(--border-hover))] hover:text-[rgb(var(--text-primary))] transition-all">✎</button>
            )}
          </>
        )}

        {task.status === 'completed' && isAdmin && (
          <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }} title="Editar"
            className="w-7 h-7 rounded-[6px] text-[rgb(var(--text-muted))] text-xs flex items-center justify-center
                       hover:bg-[rgb(var(--border-hover))] hover:text-[rgb(var(--text-primary))] transition-all">✎</button>
        )}
      </div>
    </div>
  )
}
