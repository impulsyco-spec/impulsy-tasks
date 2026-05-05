import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Sparkles, Clock, Users } from 'lucide-react'
import WelcomeBanner from '../components/WelcomeBanner'
import MetricsPanel from '../components/MetricsPanel'

const STATUS_LABELS = {
  pending_approval: { label: 'POR APROBAR', badge: 'bg-[rgba(245,166,35,0.1)] text-[#f5a623]' },
  active: { label: 'EN PROGRESO', badge: 'bg-[rgba(18,252,217,0.12)] text-[#0dd4b8]' },
  completed: { label: 'COMPLETADA', badge: 'bg-[rgba(52,211,153,0.1)] text-[#34d399]' },
  rejected: { label: 'RECHAZADA', badge: 'bg-[rgba(255,69,69,0.1)] text-[#ff4545]' },
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 0, active: 0, overdue: 0, completed: 0 })
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = profile?.role === 'owner' || profile?.role === 'manager'

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchData()
  }, [profile])

  async function fetchData() {
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', profile.organization_id)

    // RBAC Filter
    if (profile.role !== 'owner') {
      const myTeamIds = (profile.team_members || []).map(tm => tm.team_id)
      
      if (myTeamIds.length === 0) {
        setStats({ pending: 0, active: 0, overdue: 0, completed: 0 })
        setMyTasks([])
        setLoading(false)
        return
      }
      query = query.in('team_id', myTeamIds)
    }

    const { data: tasks } = await query.order('created_at', { ascending: false })

    if (tasks) {
      setStats({
        pending: tasks.filter(t => t.status === 'pending_approval').length,
        active: tasks.filter(t => t.status === 'active').length,
        overdue: tasks.filter(t => t.status === 'active' && t.due_date && t.due_date < today).length,
        completed: tasks.filter(t => t.status === 'completed').length,
      })
      setMyTasks(tasks.filter(t => t.assigned_to === profile.id && t.status !== 'completed').slice(0, 5))
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-[rgb(var(--text-secondary))]">
      <div className="w-4 h-4 border-2 border-[#1c1c1c] border-t-[#12fcd9] rounded-full animate-spin" />
      Cargando...
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <WelcomeBanner 
        nombre={firstName} 
        completadas={stats.completed} 
        total={stats.completed + stats.active + stats.pending} 
        urgentes={stats.overdue} 
        porAprobar={stats.pending} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricsPanel tareas={myTasks} stats={stats} />
        
        {/* Aquí podrían ir otros widgets como Actividad Reciente o Filtros Rápidos */}
        <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-[14px] p-6">
          <h3 className="text-sm font-bold text-[#f0f0f0] mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[rgb(var(--primary))] rounded-full"></div>
            Equipos Activos
          </h3>
          <div className="space-y-3">
            {profile?.organizations?.teams?.map(team => (
              <div key={team.id} className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#1c1c1c]">
                <span className="text-xs font-medium text-[#f0f0f0]">{team.name}</span>
                <span className="text-[10px] text-[#707070]">{team.members?.[0]?.count || 0} miembros</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mis tareas */}
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-[#1c1c1c] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#1c1c1c]">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#404040]">Mis tareas pendientes</h3>
            <button
              onClick={() => navigate('/tasks?filter=mine')}
              className="flex items-center gap-1.5 text-xs text-[#12fcd9] hover:text-[#0dd4b8] font-bold uppercase tracking-wider transition-colors"
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(52,211,153,0.1)] flex items-center justify-center mx-auto mb-4 border border-[rgba(52,211,153,0.2)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <p className="text-sm font-bold text-[#f0f0f0]">¡Todo al día!</p>
              <p className="text-xs text-[#707070] mt-1">Has completado todas tus responsabilidades</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1c1c1c]">
              {myTasks.map(task => {
                const isOverdue = task.status === 'active' && task.due_date && task.due_date < new Date().toISOString().split('T')[0]
                const statusStyle = isOverdue ? 'bg-[rgba(255,69,69,0.1)] text-[#ff4545]' : STATUS_LABELS[task.status]?.badge
                
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-[#141414] cursor-pointer transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" 
                         style={{ background: isOverdue ? '#ff4545' : '#12fcd9', boxShadow: `0 0 6px ${isOverdue ? 'rgba(255,69,69,0.5)' : 'rgba(18,252,217,0.4)'}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#f0f0f0] group-hover:text-[#12fcd9] transition-colors truncate">{task.title}</p>
                      {task.due_date && (
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isOverdue ? 'text-[#ff4545]' : 'text-[#707070]'}`}>
                          {isOverdue ? '⚠ Vencida · ' : 'Vence '}{new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-[4px] font-bold uppercase tracking-wider flex-shrink-0 ${statusStyle}`}>
                      {isOverdue ? 'URGENTE' : STATUS_LABELS[task.status]?.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-4">
          <h3 className="font-bold text-[rgb(var(--text-muted))] text-xs uppercase tracking-widest px-1">Acciones rápidas</h3>
          
          {isAdmin && (
            <button
              onClick={() => navigate('/transcripts')}
              className="w-full flex items-center gap-4 p-5 bg-[#0c0c0c] border border-[#1c1c1c] rounded-[12px] text-left hover:border-[rgba(18,252,217,0.5)] hover:bg-[#141414] transition-all group"
            >
              <div className="w-10 h-10 rounded-[8px] bg-[rgba(18,252,217,0.1)] flex items-center justify-center flex-shrink-0 border border-[rgba(18,252,217,0.2)]">
                <Sparkles size={18} className="text-[#12fcd9]" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">Subir transcript</p>
                <p className="text-[10px] text-[#707070] font-medium mt-0.5 uppercase tracking-widest">IA Task Extraction</p>
              </div>
              <ArrowRight size={16} className="text-[#404040] ml-auto group-hover:text-[#12fcd9] group-hover:translate-x-1 transition-all" />
            </button>
          )}

          <button
            onClick={() => navigate('/tasks?filter=pending_approval')}
            className="w-full flex items-center gap-4 p-5 bg-[#0c0c0c] border border-[#1c1c1c] rounded-[12px] text-left hover:border-[#f5a623] hover:bg-[#141414] transition-all group"
          >
            <div className="w-10 h-10 rounded-[8px] bg-[rgba(245,166,35,0.1)] flex items-center justify-center flex-shrink-0 border border-[rgba(245,166,35,0.2)]">
              <Clock size={18} className="text-[#f5a623]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">Aprobar tareas</p>
              <p className="text-[10px] text-[#707070] font-bold uppercase tracking-widest mt-0.5">
                {stats.pending} pendiente{stats.pending !== 1 ? 's' : ''}
              </p>
            </div>
            <ArrowRight size={16} className="text-[#404040] ml-auto group-hover:text-[#f5a623] group-hover:translate-x-1 transition-all" />
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate('/teams')}
              className="w-full flex items-center gap-4 p-5 bg-[#0c0c0c] border border-[#1c1c1c] rounded-[12px] text-left hover:border-[#12fcd9] hover:bg-[#141414] transition-all group"
            >
              <div className="w-10 h-10 rounded-[8px] bg-[rgba(18,252,217,0.1)] flex items-center justify-center flex-shrink-0 border border-[rgba(18,252,217,0.2)]">
                <Users size={18} className="text-[#12fcd9]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#f0f0f0] uppercase tracking-wider">Equipos</p>
                <p className="text-[10px] text-[#707070] font-bold uppercase tracking-widest mt-0.5">Gestionar miembros</p>
              </div>
              <ArrowRight size={16} className="text-[#404040] ml-auto group-hover:text-[#12fcd9] group-hover:translate-x-1 transition-all" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
