import { useState, useEffect } from 'react'
import { Plus, Filter, Search, MoreHorizontal, CheckCircle2, Clock, AlertCircle, ChevronRight, LayoutGrid, List as ListIcon, Calendar as CalendarIcon, User, Tag, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskDrawer from '../components/TaskDrawer'

export default function Tasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [filterParam, setFilterParam] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewTask, setShowNewTask] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imageErrors, setImageErrors] = useState({})

  const isAdmin = profile?.role === 'owner' || profile?.role === 'manager'
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchAll()
  }, [profile])

  async function fetchAll() {
    let tasksQuery = supabase
      .from('tasks')
      .select('*, teams(id, name, logo_url), assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name)')
      .eq('organization_id', profile.organization_id)

    let teamsQuery = supabase
      .from('teams')
      .select('id, name, logo_url, team_members(profile_id)')
      .eq('organization_id', profile.organization_id)

    // RESTRICCIONES DE ROL (RBAC)
    if (profile.role !== 'owner') {
      const myTeamIds = (profile.team_members || []).map(tm => tm.team_id)
      
      if (myTeamIds.length > 0) {
        tasksQuery = tasksQuery.in('team_id', myTeamIds)
        teamsQuery = teamsQuery.in('id', myTeamIds)
      } else {
        // Bloqueo de seguridad: si no tiene equipos asignados, no ve nada
        tasksQuery = tasksQuery.eq('id', '00000000-0000-0000-0000-000000000000')
        teamsQuery = teamsQuery.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    }

    const [{ data: t }, { data: m }, { data: tm }] = await Promise.all([
      tasksQuery.order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('organization_id', profile.organization_id),
      teamsQuery.order('name'),
    ])
    setTasks(t || [])
    setMembers(m || [])
    setTeams(tm || [])
    setLoading(false)
  }

  function filtered() {
    let list = tasks
    // Filtro por equipo
    if (selectedTeam !== 'all') {
      list = list.filter(t => t.team_id === selectedTeam)
    }
    // Filtro por estado
    if (filterParam === 'overdue') return list.filter(t => t.status === 'active' && t.due_date && t.due_date < today)
    if (filterParam === 'mine') return list.filter(t => t.assigned_to === profile.id)
    if (filterParam !== 'all') return list.filter(t => t.status === filterParam)
    return list
  }

  async function updateStatus(taskId, status) {
    await supabase.from('tasks').update({ status }).eq('id', taskId)

    const task = tasks.find(t => t.id === taskId)

    // Notificar al asignado si se aprueba
    if (status === 'active') {
      if (task?.assigned_to) {
        await supabase.from('notifications').insert({
          user_id: task.assigned_to,
          task_id: taskId,
          message: `La tarea "${task.title}" fue aprobada y está activa.`,
        })
      }
    }

    // Notificar al owner/manager cuando se completa
    if (status === 'completed') {
      if (task?.assigned_to && task.assigned_to !== profile.id) {
        const { data: managers } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', profile.organization_id)
          .in('role', ['owner', 'manager'])
        
        if (managers) {
          const notifications = managers.map(m => ({
            user_id: m.id,
            task_id: taskId,
            message: `La tarea "${task.title}" fue completada por ${profile.full_name}.`,
          }))
          await supabase.from('notifications').insert(notifications)
        }
      }
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  async function saveEdit(task) {
    setSaving(true)
    let finalTaskId = task.id
    
    if (task.id) {
      await supabase.from('tasks').update({
        title: task.title,
        description: task.description,
        due_date: task.due_date || null,
        assigned_to: task.assigned_to || null,
        team_id: task.team_id || null,
      }).eq('id', task.id)
    } else {
      const { data, error } = await supabase.from('tasks').insert({
        organization_id: profile.organization_id,
        created_by: profile.id,
        title: task.title,
        description: task.description,
        due_date: task.due_date || null,
        assigned_to: task.assigned_to || null,
        team_id: task.team_id || null,
        status: 'pending'
      }).select().single()
      if (!error && data) {
        finalTaskId = data.id
      }
    }

    // Notificar si se asigna
    if (task.assigned_to && finalTaskId) {
      await supabase.from('notifications').insert({
        user_id: task.assigned_to,
        task_id: finalTaskId,
        message: `Se te asignó la tarea "${task.title}".`,
      })
    }

    await fetchAll()
    setShowNewTask(false)
    setEditingTask(null)
    setSaving(false)
  }

  async function deleteTask(taskId) {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  function getLogoDisplay(team) {
    if (team.logo_url && !imageErrors[team.id]) return { type: 'img', src: team.logo_url }
    return { type: 'text', text: team.name.substring(0, 2).toUpperCase() }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[rgb(var(--background))]">
      <div className="w-8 h-8 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[rgb(var(--text-primary))] tracking-tight">Tareas</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))]">Gestiona el flujo de trabajo de tu equipo</p>
        </div>
        <button 
          onClick={() => { setEditingTask(null); setShowNewTask(true); }}
          className="hidden md:flex bg-[rgb(var(--primary))] text-black text-xs font-black rounded-xl h-[40px] px-6 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:brightness-110 transition-all items-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Nueva tarea
        </button>
      </div>

      {/* Team Selector - Solo visible para OWNER */}
      {(profile?.role === 'owner' || teams.length > 1) && teams.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setSelectedTeam('all')}
            className={`flex items-center gap-3 h-10 px-4 rounded-xl border text-xs font-bold flex-shrink-0 transition-all ${
              selectedTeam === 'all'
                ? 'bg-[rgb(var(--primary),0.1)] border-[rgb(var(--primary))] text-black'
                : 'border-[rgb(var(--border))] bg-[rgb(var(--background))]/40 text-[rgb(var(--text-muted))] hover:border-[rgb(var(--border-hover))] hover:text-[rgb(var(--text-secondary))]'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center text-[10px] font-black">
              ✦
            </div>
            Todos los equipos
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
              selectedTeam === 'all' ? 'bg-[rgb(var(--primary))] text-black' : 'bg-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
            }`}>{tasks.length}</span>
          </button>

          <div className="w-px h-6 bg-[rgb(var(--border))] flex-shrink-0 mx-1" />

          {teams.map(team => {
            const logo = getLogoDisplay(team)
            const count = tasks.filter(t => t.team_id === team.id).length
            const isActive = selectedTeam === team.id
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`flex items-center gap-3 h-10 px-4 rounded-xl border text-xs font-bold flex-shrink-0 transition-all ${
                  isActive
                    ? 'bg-[rgb(var(--primary),0.1)] border-[rgb(var(--primary))] text-black'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--background))]/40 text-[rgb(var(--text-muted))] hover:border-[rgb(var(--border-hover))] hover:text-[rgb(var(--text-secondary))]'
                }`}
              >
                {logo.type === 'img' ? (
                  <img 
                    src={logo.src} 
                    alt={team.name} 
                    className="w-6 h-6 rounded-lg object-cover"
                    onError={() => setImageErrors(prev => ({ ...prev, [team.id]: true }))}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center text-[10px] font-black">
                    {logo.text}
                  </div>
                )}
                {team.name}
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                  isActive ? 'bg-[rgb(var(--primary))] text-black' : 'bg-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
                }`}>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Para Subowner/Member solo mostrar etiqueta informativa si solo tiene un equipo */}
      {profile?.role !== 'owner' && teams.length === 1 && (
        <div className="flex items-center gap-2 mb-6">
          <div className="px-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] text-[10px] font-bold uppercase tracking-widest">
            Equipo: <span className="text-[rgb(var(--primary))]">{teams[0]?.name}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered().map(task => (
          <div 
            key={task.id} 
            onClick={() => setEditingTask(task)}
            className={`cursor-pointer bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-6 hover:border-[rgb(var(--primary),0.3)] hover:shadow-md transition-all group ${task.status === 'completed' ? 'opacity-60 grayscale hover:opacity-100' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                task.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                task.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-[rgb(var(--primary),0.1)] text-[rgb(var(--primary))]'
              }`}>
                {task.status}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingTask(task)} className="p-2 hover:bg-black/5 rounded-lg text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-[rgb(var(--text-primary))] mb-2">{task.title}</h3>
            
            {selectedTeam === 'all' && task.teams && (
              <div className="mb-2">
                <span className="px-2 py-0.5 rounded border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--text-secondary))] text-[10px] font-bold">
                  {task.teams.name}
                </span>
              </div>
            )}

            <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-2 mb-4">{task.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-[rgb(var(--border))]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[rgb(var(--border))] flex items-center justify-center text-[10px] font-bold text-[rgb(var(--text-secondary))]">
                  {task.assigned_profile?.full_name?.substring(0, 2).toUpperCase() || '??'}
                </div>
                <span className="text-xs text-[rgb(var(--text-secondary))]">{task.assigned_profile?.full_name || 'Sin asignar'}</span>
              </div>
              {task.due_date && (
                <div className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]">
                  <Clock size={14} />
                  <span className="text-[10px] font-medium">{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(showNewTask || editingTask) && (
        <TaskDrawer
          task={editingTask}
          isOpen={showNewTask || !!editingTask}
          onClose={() => { setShowNewTask(false); setEditingTask(null); }}
          onSave={saveEdit}
          members={members}
          teams={teams}
          saving={saving}
          profile={profile}
        />
      )}

      {/* FLOAT ACTION BUTTON (MOBILE ONLY) */}
      <button 
        onClick={() => { setEditingTask(null); setShowNewTask(true); }}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-[rgb(var(--primary))] text-black rounded-full shadow-[0_4px_20px_rgba(var(--primary),0.4)] flex items-center justify-center z-50 active:scale-90 transition-transform"
      >
        <Plus size={28} />
      </button>
    </div>
  )
}
