import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { Check, X, Edit2, ChevronDown, User, Calendar, Plus, Trash2, Flag, Tag, FileText, Users, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getLogoUrl } from '../lib/utils'

const STATUS_CONFIG = {
  pending_approval: { label: 'Por aprobar ⏳', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  active: { label: 'Activa 🔥', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Completada ✅', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rechazada ❌', color: 'bg-red-100 text-red-700 border-red-200' },
}

const PRIORITY_CONFIG = {
  alta: { label: 'Alta 🔴', color: 'bg-red-50 text-red-700 border-red-100 shadow-sm shadow-red-100/50' },
  media: { label: 'Media 🟡', color: 'bg-yellow-50 text-yellow-700 border-yellow-100 shadow-sm shadow-yellow-100/50' },
  baja: { label: 'Baja 🟢', color: 'bg-slate-50 text-slate-600 border-slate-100' },
}

const CATEGORIES = [
  '📱 Contenido', 
  '📣 Anuncios', 
  '💻 Programacion', 
  '🎨 Diseno', 
  '🧠 Estrategia', 
  '🌐 Redes Sociales', 
  '📧 Email Marketing', 
  '🔍 SEO', 
  '⚙️ Otro'
]

export default function Tasks() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { selectedTeamId, teams } = useTeam()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterParam = searchParams.get('filter') || 'all'

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', assigned_to: '', priority: 'media', category: '' })
  const [organization, setOrganization] = useState(null)
  const [saving, setSaving] = useState(false)

  const isOwner = profile?.role === 'owner'
  const isManager = profile?.role === 'manager'
  const today = new Date().toISOString().split('T')[0]
  const activeTeam = Array.isArray(teams) ? teams.find(t => t.id === selectedTeamId) : undefined

  useEffect(() => {
    if (!profile?.organization_id) {
      // Profile not ready yet — keep loading until it is
      return
    }
    fetchAll()
  }, [profile?.organization_id, selectedTeamId])

  async function fetchAll() {
    try {
      let taskQuery = supabase
        .from('tasks')
        .select('*, assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name), team:teams(id, name, logo_url)')
        .eq('organization_id', profile.organization_id)
      if (profile.role === 'owner') {
        if (selectedTeamId) taskQuery = taskQuery.eq('team_id', selectedTeamId)
      } else if (profile.role === 'manager') {
        // Managers see all tasks for their selected team
        if (selectedTeamId) {
          taskQuery = taskQuery.eq('team_id', selectedTeamId)
        } else {
          // If no team selected (unlikely for manager), show nothing to be safe
          taskQuery = taskQuery.eq('id', '00000000-0000-0000-0000-000000000000')
        }
      } else {
        // Normal members only see their assigned active/completed tasks
        taskQuery = taskQuery.eq('assigned_to', profile.id).in('status', ['active', 'completed'])
      }

      const [taskResult, memberResult] = await Promise.all([
        taskQuery.order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('organization_id', profile.organization_id),
      ])

      // Fetch transcript meeting dates separately (resilient — column may not exist yet)
      const tasks = taskResult.data || []
      const transcriptIds = [...new Set(tasks.filter(t => t.transcript_id).map(t => t.transcript_id))]
      let transcriptMap = {}
      if (transcriptIds.length > 0) {
        try {
          const { data: transcripts } = await supabase
            .from('transcripts')
            .select('id, meeting_date')
            .in('id', transcriptIds)
          if (transcripts) {
            transcripts.forEach(tr => { transcriptMap[tr.id] = tr })
          }
        } catch (_) {
          // meeting_date column may not exist yet in schema — degrade gracefully
        }
      }

      const enrichedTasks = tasks.map(t => ({
        ...t,
        transcripts: t.transcript_id ? (transcriptMap[t.transcript_id] || null) : null,
      }))

      // Fetch organization
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, logo_url')
        .eq('id', profile.organization_id)
        .single()
      
      setOrganization(orgData)
      setTasks(enrichedTasks)
      setMembers(memberResult.data || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setTasks([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }


  async function deleteTask(taskId) {
    await supabase.from('notifications').delete().eq('task_id', taskId)
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  function filtered() {
    if (filterParam === 'all') return tasks
    if (filterParam === 'overdue') return tasks.filter(t => t.status === 'active' && t.due_date && t.due_date < today)
    if (filterParam === 'mine') return tasks.filter(t => t.assigned_to === profile.id)
    return tasks.filter(t => t.status === filterParam)
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

    // Notificar al owner cuando se completa
    if (status === 'completed') {
      if (task?.assigned_to && task.assigned_to !== profile.id) {
        const { data: owner } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', profile.organization_id)
          .eq('role', 'owner')
          .single()
        if (owner) {
          await supabase.from('notifications').insert({
            user_id: owner.id,
            task_id: taskId,
            message: `La tarea "${task.title}" fue completada por ${profile.full_name}.`,
          })
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
      resources: task.resources || [],
      priority: task.priority,
      category: task.category,
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

  async function createTask(e) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('tasks').insert({
      organization_id: profile.organization_id,
      created_by: profile.id,
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to || null,
      priority: newTask.priority,
      category: newTask.category || null,
      resources: newTask.resources || [],
      status: 'pending_approval',
    }).select('*, assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name)').single()

    if (data) setTasks(prev => [data, ...prev])
    setNewTask({ title: '', description: '', due_date: '', assigned_to: '', priority: 'media', category: '' })
    setShowNewTask(false)
    setSaving(false)
  }

  const filters = [
    { id: 'all', label: 'Todas 🌐' },
    ...(isOwner ? [{ id: 'pending_approval', label: 'Por aprobar ⏳' }] : []),
    { id: 'active', label: 'Activas 🔥' },
    ...(isOwner ? [{ id: 'mine', label: 'Mis tareas ⚡' }] : []),
    { id: 'completed', label: 'Completadas ✅' },
  ]

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[300px] gap-3 text-gray-400">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm">Cargando tareas...</p>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
            {activeTeam?.logo_url || organization?.logo_url ? (
              <img src={getLogoUrl(activeTeam?.logo_url || organization?.logo_url)} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Users size={20} className="text-gray-300" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
              Gestión de Tareas 🚀
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
              {organization && <span className="text-xs text-gray-400 font-medium truncate">{organization.name}</span>}
              {activeTeam && (
                <>
                  <span className="text-xs text-gray-300">/</span>
                  <span className="text-xs text-[#00B4D8] font-bold truncate">{activeTeam.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {(isOwner || isManager) && (
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 lg:px-4 rounded-lg text-xs lg:text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nueva tarea</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        )}
      </div>

      {/* Stage Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-yellow-400 group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <span className="text-[10px] tracking-widest font-black text-gray-400">PENDIENTES ⏳</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{tasks.filter(t => t.status === 'pending_approval').length}</div>
          <p className="text-[10px] text-gray-500 font-medium">Por aprobar ⏳</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-blue-500 group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus size={16} className="animate-pulse" />
            </div>
            <span className="text-[10px] tracking-widest font-black text-gray-400">ACTIVAS 🔥</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{tasks.filter(t => t.status === 'active').length}</div>
          <p className="text-[10px] text-gray-500 font-medium">Tareas activas 🔥</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-red-500 group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 size={16} />
            </div>
            <span className="text-[10px] tracking-widest font-black text-gray-400">VENCIDAS ⚠️</span>
          </div>
          <div className="text-2xl font-black text-red-600">{tasks.filter(t => t.status === 'active' && t.due_date && t.due_date < today).length}</div>
          <p className="text-[10px] text-gray-500 font-medium">Vencidas ⚠️</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-green-500 group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Check size={16} />
            </div>
            <span className="text-[10px] tracking-widest font-black text-gray-400">COMPLETADAS ✅</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{tasks.filter(t => t.status === 'completed').length}</div>
          <p className="text-[10px] text-gray-500 font-medium">Finalizadas 🏆</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setSearchParams({ filter: f.id })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filterParam === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* New task form */}
      {showNewTask && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Nueva tarea manual</h3>
          <form onSubmit={createTask} className="space-y-3">
            <input
              type="text"
              placeholder="Título de la tarea"
              value={newTask.title}
              onChange={e => setNewTask(f => ({ ...f, title: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={newTask.description}
              onChange={e => setNewTask(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={e => setNewTask(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Asignar a</label>
                <select
                  value={newTask.assigned_to}
                  onChange={e => setNewTask(f => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin asignar</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Prioridad</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask(f => ({ ...f, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                <select
                  value={newTask.category}
                  onChange={e => setNewTask(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin categoria</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowNewTask(false)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Creando...' : 'Crear tarea'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks list */}
      <div className="space-y-2">
        {filtered().length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            <p className="text-sm">No hay tareas en este filtro</p>
          </div>
        ) : (
          filtered().map(task => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              isOwner={isOwner}
              today={today}
              editing={editingTask?.id === task.id ? editingTask : null}
              onEdit={() => setEditingTask({ ...task })}
              onEditChange={updates => setEditingTask(prev => ({ ...prev, ...updates }))}
              onSaveEdit={() => saveEdit(editingTask)}
              onCancelEdit={() => setEditingTask(null)}
              onApprove={() => updateStatus(task.id, 'active')}
              onReject={() => updateStatus(task.id, 'rejected')}
              onComplete={() => updateStatus(task.id, 'completed')}
              onDelete={() => deleteTask(task.id)}
              saving={saving}
              navigate={navigate}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, members, isOwner, today, editing, onEdit, onEditChange, onSaveEdit, onCancelEdit, onApprove, onReject, onComplete, onDelete, saving, navigate }) {
  const isOverdue = task.status === 'active' && task.due_date && task.due_date < today
  const cfg = STATUS_CONFIG[task.status]

  return (
    <div className={`bg-white rounded-xl border p-4 lg:p-5 transition-shadow hover:shadow-sm ${isOverdue ? 'border-red-200' : 'border-gray-200'}`}>
      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editing.title}
            onChange={e => onEditChange({ title: e.target.value })}
            className="w-full text-sm font-medium border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1"
          />
          <textarea
            value={editing.description || ''}
            onChange={e => onEditChange({ description: e.target.value })}
            rows={2}
            className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Descripción..."
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Vencimiento</label>
              <input
                type="date"
                value={editing.due_date || ''}
                onChange={e => onEditChange({ due_date: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Asignar a</label>
              <select
                value={editing.assigned_to || ''}
                onChange={e => onEditChange({ assigned_to: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
              >
                <option value="">Sin asignar</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Prioridad</label>
              <select
                value={editing.priority || 'media'}
                onChange={e => onEditChange({ priority: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Categoria</label>
              <select
                value={editing.category || ''}
                onChange={e => onEditChange({ category: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
              >
                <option value="">Sin categoria</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Recursos / Links</label>
              <button 
                type="button"
                onClick={() => {
                  const url = prompt('Introduce la URL del recurso:')
                  if (url) {
                    const name = prompt('Nombre del recurso:', 'Link')
                    onEditChange({ resources: [...(editing.resources || []), { name, url }] })
                  }
                }}
                className="text-[10px] text-blue-600 font-bold hover:underline"
              >
                + Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(editing.resources || []).map((res, ridx) => (
                <div key={ridx} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 shadow-sm">
                  <span className="text-[10px] text-gray-600 font-medium truncate max-w-[120px]">{res.name}</span>
                  <button 
                    onClick={() => onEditChange({ resources: editing.resources.filter((_, i) => i !== ridx) })}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onCancelEdit} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={onSaveEdit} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${cfg.color}`}>
                  {cfg.label}
                </span>
                {task.priority && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${PRIORITY_CONFIG[task.priority]?.color}`}>
                    Prio: {PRIORITY_CONFIG[task.priority]?.label}
                  </span>
                )}
                {isOverdue && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold uppercase tracking-wider">
                    Vencida ⚠️
                  </span>
                )}

              </div>
              {task.description && (
                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                {task.assigned_profile && (
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {task.assigned_profile.full_name}
                  </span>
                )}
                {task.due_date && (
                  <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                    <Calendar size={11} />
                    {new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-CO')}
                  </span>
                )}
                {task.category && (
                  <span className="flex items-center gap-1">
                    <Tag size={11} />
                    {task.category}
                  </span>
                )}
                {task.transcript_id && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate('/transcripts')}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <FileText size={11} />
                      Ver origen
                    </button>
                    {task.transcripts?.meeting_date && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar size={11} />
                        Reunión: {new Date(task.transcripts.meeting_date + 'T00:00:00').toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>
                )}
                {task.team && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded-md shadow-sm ml-auto">
                    {task.team.logo_url ? (
                      <img src={getLogoUrl(task.team.logo_url)} alt="Logo" className="w-4 h-4 object-contain" />
                    ) : (
                      <Users size={10} className="text-gray-300" />
                    )}
                    <span className="text-[10px] text-slate-700 font-bold uppercase tracking-tight">{task.team.name}</span>
                  </div>
                )}
              </div>
              
              {/* Resources display */}
              {(task.resources && task.resources.length > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Recursos</span>
                  <div className="flex flex-wrap gap-2">
                    {task.resources.map((res, ridx) => (
                      <a 
                        key={ridx} 
                        href={res.url.startsWith('http') ? res.url : `https://${res.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded px-2 py-1 text-[10px] font-bold hover:bg-blue-100 transition-colors shadow-sm"
                      >
                        <FileText size={10} />
                        {res.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {(isOwner || isManager) && task.status === 'pending_approval' && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={onApprove}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Aprobar"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={onReject}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Rechazar"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
              {task.status === 'active' && (isOwner || isManager) && (
                <>
                  <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={onComplete}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Marcar como completada"
                  >
                    <Check size={14} />
                  </button>
                </>
              )}
              {(isOwner || isManager) && (
                <button
                  onClick={onDelete}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar tarea"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
