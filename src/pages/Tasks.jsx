import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Check, X, Edit2, User, Calendar, Plus, Users } from 'lucide-react'

const STATUS_CONFIG = {
  pending_approval: { label: 'Por aprobar', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  active: { label: 'Activa', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completada', color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rechazada', color: 'bg-red-50 text-red-700 border-red-200' },
}

export default function Tasks() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterParam = searchParams.get('filter') || 'all'

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', assigned_to: '' })
  const [saving, setSaving] = useState(false)

  const isAdmin = profile?.role === 'owner' || profile?.role === 'manager'
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchAll()
  }, [profile])

  async function fetchAll() {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, teams(name, logo_url), assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('organization_id', profile.organization_id),
    ])
    setTasks(t || [])
    setMembers(m || [])
    setLoading(false)
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
      status: 'pending_approval',
    }).select('*, teams(name, logo_url), assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name)').single()

    if (data) setTasks(prev => [data, ...prev])
    setNewTask({ title: '', description: '', due_date: '', assigned_to: '' })
    setShowNewTask(false)
    setSaving(false)
  }

  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'pending_approval', label: 'Por aprobar' },
    { id: 'active', label: 'Activas' },
    { id: 'mine', label: 'Mis tareas' },
    { id: 'completed', label: 'Completadas' },
  ]

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      Cargando...
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tareas</h2>
          <p className="text-gray-500 mt-1 text-sm">Gestiona el flujo de trabajo de tu equipo</p>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus size={18} />
          Nueva tarea
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setSearchParams({ filter: f.id })}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
              filterParam === f.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* New task form */}
      {showNewTask && (
        <div className="premium-card p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" />
            Nueva tarea manual
          </h3>
          <form onSubmit={createTask} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Título de la tarea</label>
              <input
                type="text"
                placeholder="Ej: 🎨 Diseñar nuevas portadas"
                value={newTask.title}
                onChange={e => setNewTask(f => ({ ...f, title: e.target.value }))}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</label>
              <textarea
                placeholder="Detalles adicionales..."
                value={newTask.description}
                onChange={e => setNewTask(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vencimiento</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={e => setNewTask(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Asignar a</label>
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={newTask.assigned_to}
                    onChange={e => setNewTask(f => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all appearance-none"
                  >
                    <option value="">Sin asignar</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowNewTask(false)} 
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm active:scale-95"
              >
                {saving ? 'Creando...' : 'Crear tarea'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks list */}
      <div className="grid gap-4">
        {filtered().length === 0 ? (
          <div className="premium-card p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Check size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No se encontraron tareas</p>
            <p className="text-xs text-gray-300 mt-1">Prueba con otro filtro o crea una nueva tarea</p>
          </div>
        ) : (
          filtered().map(task => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              isAdmin={isAdmin}
              today={today}
              editing={editingTask?.id === task.id ? editingTask : null}
              onEdit={() => setEditingTask({ ...task })}
              onEditChange={updates => setEditingTask(prev => ({ ...prev, ...updates }))}
              onSaveEdit={() => saveEdit(editingTask)}
              onCancelEdit={() => setEditingTask(null)}
              onApprove={() => updateStatus(task.id, 'active')}
              onReject={() => updateStatus(task.id, 'rejected')}
              onComplete={() => updateStatus(task.id, 'completed')}
              saving={saving}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, members, isAdmin, today, editing, onEdit, onEditChange, onSaveEdit, onCancelEdit, onApprove, onReject, onComplete, saving }) {
  const isOverdue = task.status === 'active' && task.due_date && task.due_date < today
  const cfg = STATUS_CONFIG[task.status] || { label: task.status, color: 'bg-gray-50 text-gray-500' }

  return (
    <div className={`premium-card p-5 group transition-all hover:-translate-y-0.5 ${isOverdue ? 'ring-1 ring-red-100' : ''}`}>
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Título</label>
            <input
              type="text"
              value={editing.title}
              onChange={e => onEditChange({ title: e.target.value })}
              className="w-full text-sm font-bold bg-transparent border-0 border-b-2 border-blue-100 focus:border-blue-500 focus:outline-none pb-2 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción</label>
            <textarea
              value={editing.description || ''}
              onChange={e => onEditChange({ description: e.target.value })}
              rows={2}
              className="w-full text-sm text-gray-600 bg-gray-50 border-0 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none"
              placeholder="Descripción..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vencimiento</label>
              <input
                type="date"
                value={editing.due_date || ''}
                onChange={e => onEditChange({ due_date: e.target.value })}
                className="w-full text-xs font-semibold bg-gray-50 border-0 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Asignado</label>
              <select
                value={editing.assigned_to || ''}
                onChange={e => onEditChange({ assigned_to: e.target.value })}
                className="w-full text-xs font-semibold bg-gray-50 border-0 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
              >
                <option value="">Sin asignar</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onCancelEdit} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
            <button onClick={onSaveEdit} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-50">
              Guardar Cambios
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          {/* Team Logo or Icon */}
          <div className="flex-shrink-0">
            {task.teams?.logo_url ? (
              <img 
                src={task.teams.logo_url} 
                alt={task.teams.name} 
                className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 flex items-center justify-center text-gray-400">
                {task.team_id ? <Users size={20} /> : <Check size={20} />}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{task.title}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${cfg.color}`}>
                {cfg.label}
              </span>
              {isOverdue && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold uppercase tracking-wider animate-pulse">
                  Vencida
                </span>
              )}
            </div>
            
            {task.description && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
            )}

            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {task.assigned_profile && (
                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                  <User size={10} className="text-gray-400" />
                  {task.assigned_profile.full_name}
                </span>
              )}
              {task.due_date && (
                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-gray-50'}`}>
                  <Calendar size={10} />
                  {new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-CO')}
                </span>
              )}
              {task.teams && (
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                  <Users size={10} />
                  {task.teams.name}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAdmin && task.status === 'pending_approval' && (
              <>
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar">
                  <Edit2 size={16} />
                </button>
                <button onClick={onApprove} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Aprobar">
                  <Check size={16} />
                </button>
                <button onClick={onReject} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Rechazar">
                  <X size={16} />
                </button>
              </>
            )}
            {task.status === 'active' && (
              <>
                {isAdmin && (
                  <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar">
                    <Edit2 size={16} />
                  </button>
                )}
                <button onClick={onComplete} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Marcar como completada">
                  <Check size={16} />
                </button>
              </>
            )}
            {task.status === 'completed' && isAdmin && (
               <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar">
                <Edit2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

