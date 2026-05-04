import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CheckSquare, Clock, AlertCircle, Sparkles, ArrowRight, Circle, Users } from 'lucide-react'

const STATUS_LABELS = {
  pending_approval: { label: 'Por aprobar', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  active: { label: 'Activa', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  completed: { label: 'Completada', color: 'bg-green-50 text-green-700 border-green-100' },
  rejected: { label: 'Rechazada', color: 'bg-red-50 text-red-700 border-red-100' },
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
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

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
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      Cargando...
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-4 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{greeting}, {firstName} 👋</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-gray-500 text-sm font-medium">{profile?.organizations?.name}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={<Clock size={20} />}
          label="Por aprobar"
          value={stats.pending}
          color="yellow"
          onClick={() => navigate('/tasks?filter=pending_approval')}
        />
        <StatCard
          icon={<CheckSquare size={20} />}
          label="Activas"
          value={stats.active}
          color="blue"
          onClick={() => navigate('/tasks?filter=active')}
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Vencidas"
          value={stats.overdue}
          color="red"
          onClick={() => navigate('/tasks?filter=overdue')}
        />
        <StatCard
          icon={<Circle size={20} />}
          label="Completadas"
          value={stats.completed}
          color="green"
          onClick={() => navigate('/tasks?filter=completed')}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mis tareas */}
        <div className="lg:col-span-2 premium-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/50 bg-gray-50/30">
            <h3 className="font-bold text-gray-900">Mis tareas pendientes</h3>
            <button
              onClick={() => navigate('/tasks?filter=mine')}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider transition-colors"
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100 shadow-sm">
                <CheckSquare size={24} className="text-green-500" />
              </div>
              <p className="text-sm font-bold text-gray-800">¡Todo al día!</p>
              <p className="text-xs text-gray-400 mt-1">Has completado todas tus responsabilidades</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myTasks.map(task => {
                const isOverdue = task.status === 'active' && task.due_date && task.due_date < new Date().toISOString().split('T')[0]
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 cursor-pointer transition-all group"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${isOverdue ? 'bg-red-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{task.title}</p>
                      {task.due_date && (
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                          {isOverdue ? 'Vencida · ' : 'Vence '}{new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider flex-shrink-0 ${STATUS_LABELS[task.status]?.color}`}>
                      {STATUS_LABELS[task.status]?.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest px-1">Acciones rápidas</h3>
          
          {isAdmin && (
            <button
              onClick={() => navigate('/transcripts')}
              className="w-full flex items-center gap-4 p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-left hover:shadow-lg hover:shadow-blue-500/20 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl" />
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-white uppercase tracking-wider">Subir transcript</p>
                <p className="text-[10px] text-blue-100 font-medium mt-0.5 opacity-80">IA Tarea Extraction</p>
              </div>
              <ArrowRight size={16} className="text-blue-200 ml-auto group-hover:translate-x-1 transition-transform relative z-10" />
            </button>
          )}

          <button
            onClick={() => navigate('/tasks?filter=pending_approval')}
            className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 text-left hover:border-yellow-200 hover:bg-yellow-50/30 transition-all shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0 border border-yellow-100">
              <Clock size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Aprobar tareas</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                {stats.pending} pendiente{stats.pending !== 1 ? 's' : ''}
              </p>
            </div>
            <ArrowRight size={16} className="text-gray-300 ml-auto group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate('/teams')}
              className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                <Users size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Equipos</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Gestionar miembros</p>
              </div>
              <ArrowRight size={16} className="text-gray-300 ml-auto group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const colorMap = {
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-500', border: 'hover:border-yellow-200 hover:shadow-yellow-500/5' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'hover:border-blue-200 hover:shadow-blue-500/5' },
  red: { bg: 'bg-red-50', icon: 'text-red-500', border: 'hover:border-red-200 hover:shadow-red-500/5' },
  green: { bg: 'bg-green-50', icon: 'text-green-500', border: 'hover:border-green-200 hover:shadow-green-500/5' },
}

function StatCard({ icon, label, value, color, onClick }) {
  const c = colorMap[color]
  return (
    <button
      onClick={onClick}
      className={`premium-card p-6 text-left border-gray-100/50 ${c.border} group relative overflow-hidden`}
    >
      <div className={`w-10 h-10 rounded-2xl ${c.bg} flex items-center justify-center ${c.icon} mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-4xl font-black text-gray-900 tracking-tighter">{value}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{label}</p>
      <div className={`absolute bottom-0 right-0 w-12 h-12 ${c.bg} opacity-10 rounded-tl-full translate-x-4 translate-y-4`} />
    </button>
  )
}
