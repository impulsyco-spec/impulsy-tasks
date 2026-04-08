import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { CheckSquare, Clock, AlertCircle, Sparkles, ArrowRight, Circle } from 'lucide-react'

const STATUS_LABELS = {
  pending_approval: { label: 'Por aprobar', color: 'bg-yellow-100 text-yellow-700' },
  active: { label: 'Activa', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { selectedTeamId, teams } = useTeam()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 0, active: 0, overdue: 0, completed: 0 })
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchData()
  }, [profile, selectedTeamId])

  async function fetchData() {
    const today = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', profile.organization_id)
    if (selectedTeamId) query = query.eq('team_id', selectedTeamId)
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
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      Cargando...
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const activeTeam = teams.find(t => t.id === selectedTeamId)

  return (
    <div className="p-4 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{greeting}, {firstName} 👋</h2>
        <p className="text-gray-500 mt-1 text-sm">
          {profile?.organizations?.name}
          {activeTeam ? <span className="text-[#00B4D8] font-medium"> · {activeTeam.name}</span> : ''}
          {' · '}{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <StatCard
          icon={<Clock size={18} />}
          label="Por aprobar"
          value={stats.pending}
          color="yellow"
          onClick={() => navigate('/tasks?filter=pending_approval')}
        />
        <StatCard
          icon={<CheckSquare size={18} />}
          label="Activas"
          value={stats.active}
          color="blue"
          onClick={() => navigate('/tasks?filter=active')}
        />
        <StatCard
          icon={<AlertCircle size={18} />}
          label="Vencidas"
          value={stats.overdue}
          color="red"
          onClick={() => navigate('/tasks?filter=overdue')}
        />
        <StatCard
          icon={<Circle size={18} />}
          label="Completadas"
          value={stats.completed}
          color="green"
          onClick={() => navigate('/tasks?filter=completed')}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Mis tareas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Mis tareas</h3>
            <button
              onClick={() => navigate('/tasks?filter=mine')}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <CheckSquare size={20} className="text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">Todo al día</p>
              <p className="text-xs text-gray-400 mt-1">No tienes tareas pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myTasks.map(task => {
                const isOverdue = task.status === 'active' && task.due_date && task.due_date < new Date().toISOString().split('T')[0]
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks')}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      {task.due_date && (
                        <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                          {isOverdue ? 'Vencida · ' : 'Vence '}{new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_LABELS[task.status]?.color}`}>
                      {STATUS_LABELS[task.status]?.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-3">
          {profile?.role === 'owner' && (
            <>
              <h3 className="font-semibold text-gray-900 text-sm px-1">Acciones rápidas</h3>
              <button
                onClick={() => navigate('/transcripts')}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-left hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Subir transcript</p>
                  <p className="text-xs text-blue-200 mt-0.5">Extraer tareas con IA</p>
                </div>
                <ArrowRight size={14} className="text-blue-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/tasks?filter=pending_approval')}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 text-left hover:border-yellow-300 hover:bg-yellow-50 transition-all shadow-sm group"
              >
                <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={17} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Aprobar tareas</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stats.pending} pendiente{stats.pending !== 1 ? 's' : ''}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 ml-auto group-hover:text-yellow-500 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/teams')}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 text-left hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CheckSquare size={17} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Gestionar equipos</p>
                  <p className="text-xs text-gray-500 mt-0.5">Asignar miembros</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 ml-auto group-hover:text-blue-500 transition-colors" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const colorMap = {
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-500', border: 'hover:border-yellow-200' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'hover:border-blue-200' },
  red: { bg: 'bg-red-50', icon: 'text-red-500', border: 'hover:border-red-200' },
  green: { bg: 'bg-green-50', icon: 'text-green-500', border: 'hover:border-green-200' },
}

function StatCard({ icon, label, value, color, onClick }) {
  const c = colorMap[color]
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 text-left border border-gray-200 ${c.border} hover:shadow-sm transition-all w-full group`}
    >
      <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center ${c.icon} mb-3`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </button>
  )
}
