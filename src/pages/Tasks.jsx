import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Check, Plus, AlertCircle, Clock, Filter } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import TaskCard from '../components/TaskCard'
import TaskDrawer from '../components/TaskDrawer'

const STATUS_CONFIG = {
  pending_approval: { label: 'Por aprobar', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  active: { label: 'Activa', color: 'bg-[rgb(var(--primary),0.1)] text-[rgb(var(--primary))] border-[rgb(var(--primary),0.2)]' },
  completed: { label: 'Completada', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  rejected: { label: 'Rechazada', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export default function Tasks() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterParam = searchParams.get('filter') || 'all'

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [saving, setSaving] = useState(false)

  const isAdmin = profile?.role === 'owner' || profile?.role === 'manager'
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchAll()
  }, [profile])

  async function fetchAll() {
    const [{ data: t }, { data: m }, { data: tm }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, teams(id, name, logo_url), assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('organization_id', profile.organization_id),
      supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('organization_id', profile.organization_id)
        .order('name'),
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
    await supabase.from('tasks').update({
      title: task.title,
      description: task.description,
      due_date: task.due_date || null,
      assigned_to: task.assigned_to || null,
    }).eq('id', task.id)

    // Notificar si se asigna
    if (task.assigned_to) {
      await supabase.from('notifications').insert({
        user_id: task.assigned_to,
        task_id: task.id,
        message: `Se te asignó la tarea "${task.title}".`,
      })
    }

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t))
    setEditingTask(null)
    setSaving(false)
  }

  // Adapter para TaskDrawer
  function handleDrawerSave(formData) {
    if (editingTask) {
      saveEdit({ ...editingTask, ...formData, due_date: formData.fechaVencimiento, assigned_to: formData.asignado })
    } else {
      const createDirect = async () => {
        setSaving(true)
        const { data } = await supabase.from('tasks').insert({
          organization_id: profile.organization_id,
          created_by: profile.id,
          title: formData.titulo,
          description: formData.descripcion,
          due_date: formData.fechaVencimiento || null,
          assigned_to: formData.asignado || null,
          status: 'pending_approval',
        }).select('*, teams(name, logo_url), assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name)').single()

        if (data) setTasks(prev => [data, ...prev])
        setShowNewTask(false)
        setSaving(false)
      }
      createDirect()
    }
  }

  function getLogoDisplay(team) {
    if (!team) return { type: 'text', src: '??' }
    // Prioridad: logo local por nombre de equipo
    const name = (team.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    if (name.includes('upgoing')) return { type: 'img', src: '/logos/logo-upgoing.png' }
    if (name.includes('cluenza')) return { type: 'img', src: '/logos/logo-cluenza.png' }
    if (name.includes('impulsy')) return { type: 'img', src: '/logos/logo-impulsy.jpg' }
    if (name.includes('kp')) return { type: 'img', src: '/logos/logo-kp.png' }
    if (name.includes('velik')) return { type: 'img', src: '/logos/logo-velik.png' }
    if (name.includes('detailing')) return { type: 'img', src: '/logos/jpdetailing.png' }
    if (name.includes('oral')) return { type: 'img', src: '/logos/oralgroup.jpg' }
    // Fallback: URL de Supabase o iniciales
    if (team.logo_url) return { type: 'img', src: team.logo_url }
    return { type: 'text', src: (team.name || '??').slice(0, 2).toUpperCase() }
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-4 text-[rgb(var(--text-secondary))] font-medium">
      <div className="w-5 h-5 border-2 border-[rgb(var(--border))] border-t-[rgb(var(--primary))] rounded-full animate-spin" />
      <span>Sincronizando tareas...</span>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#f0f0f0] tracking-tight">Tareas</h1>
          <p className="text-sm text-[#707070]">Gestiona el flujo de trabajo de tu equipo</p>
        </div>
        <button 
          onClick={() => { setEditingTask(null); setShowNewTask(true); }}
          className="hidden md:flex bg-[rgb(var(--primary))] text-black text-xs font-black rounded-xl h-[40px] px-6 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:brightness-110 transition-all items-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Nueva tarea
        </button>
      </div>

      {/* Team Selector */}
      {teams.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setSelectedTeam('all')}
            className={`flex items-center gap-3 h-10 px-4 rounded-xl border text-xs font-bold flex-shrink-0 transition-all ${
              selectedTeam === 'all'
                ? 'bg-[rgb(var(--primary),0.1)] border-[rgb(var(--primary),0.3)] text-[rgb(var(--primary))]'
                : 'border-[rgb(var(--border))] bg-black/40 text-[rgb(var(--text-muted))] hover:border-[rgb(var(--border-hover))] hover:text-[rgb(var(--text-secondary))]'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center text-[10px] font-black">
              ✦
            </div>
            Todos los equipos
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
              selectedTeam === 'all' ? 'bg-[rgb(var(--primary),0.2)] text-[rgb(var(--primary))]' : 'bg-[#1c1c1c] text-[rgb(var(--text-muted))]'
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
                    ? 'bg-[rgb(var(--primary),0.1)] border-[rgb(var(--primary),0.3)] text-[rgb(var(--primary))]'
                    : 'border-[rgb(var(--border))] bg-black/40 text-[rgb(var(--text-muted))] hover:border-[rgb(var(--border-hover))] hover:text-[rgb(var(--text-secondary))]'
                }`}
              >
                {logo.type === 'img' ? (
                  <img src={logo.src} alt={team.name} className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center text-[9px] font-black text-[rgb(var(--text-muted))]">
                    {logo.src}
                  </div>
                )}
                {team.name}
                {count > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                    isActive ? 'bg-[rgb(var(--primary),0.2)] text-[rgb(var(--primary))]' : 'bg-[#1c1c1c] text-[rgb(var(--text-muted))]'
                  }`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* FilterBar */}
      <FilterBar 
        filtroActivo={filterParam} 
        onCambiarFiltro={(id) => setSearchParams({ filter: id })} 
        conteos={{
          pending_approval: filtered().filter(t => t.status === 'pending_approval').length,
          active: filtered().filter(t => t.status === 'active').length,
          overdue: filtered().filter(t => t.status === 'active' && t.due_date && t.due_date < today).length,
        }}
      />

      {/* TaskDrawer */}
      <TaskDrawer 
        abierto={showNewTask || editingTask !== null}
        onCerrar={() => { setShowNewTask(false); setEditingTask(null); }}
        onGuardar={handleDrawerSave}
        tareaInicial={editingTask ? {
          titulo: editingTask.title,
          descripcion: editingTask.description,
          fechaVencimiento: editingTask.due_date || '',
          asignado: editingTask.assigned_to || '',
          categoria: '',
          prioridad: 'normal'
        } : null}
      />

      {/* Tasks list */}
      <div className="grid gap-3">
        {filtered().length === 0 ? (
          <div className="bg-[#0c0c0c] border border-[rgb(var(--border))] rounded-2xl p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgb(var(--primary),0.2)] to-transparent" />
            <div className="w-20 h-20 bg-[rgb(var(--primary),0.05)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[rgb(var(--primary),0.1)]">
              <Check size={32} className="text-[rgb(var(--primary))]" />
            </div>
            <h3 className="text-white font-black text-xl tracking-tight">Todo despejado</h3>
            <p className="text-[rgb(var(--text-secondary))] mt-2 font-medium">No se encontraron tareas bajo estos filtros.</p>
            <button
              onClick={() => { setSearchParams({ filter: 'all' }); setSelectedTeam('all'); }}
              className="mt-6 text-[rgb(var(--primary))] text-xs font-black uppercase tracking-widest hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          filtered().map(task => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              isAdmin={isAdmin}
              today={today}
              onEdit={() => setEditingTask({ ...task })}
              onApprove={() => updateStatus(task.id, 'active')}
              onReject={() => updateStatus(task.id, 'rejected')}
              onComplete={() => updateStatus(task.id, 'completed')}
            />
          ))
        )}
      </div>
    </div>
  )
}
