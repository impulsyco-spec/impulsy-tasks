import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { Check, X, Edit2, ChevronDown, User, Calendar, Plus } from 'lucide-react'

const STATUS_CONFIG = {
  pending_approval: { label: 'Por aprobar', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  active: { label: 'Activa', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700 border-red-200' },
}

export default function Tasks() {
  const { profile } = useAuth()
  const { selectedTeamId, teams } = useTeam()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterParam = searchParams.get('filter') || 'all'

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', assigned_to: '' })
  const [saving, setSaving] = useState(false)

  const isOwner = profile?.role === 'owner'
  const today = new Date().toISOString().split('T')[0]
  const activeTeam = teams.find(t => t.id === selectedTeamId)

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchAll()
  }, [profile, selectedTeamId])

  async function fetchAll() {
    let taskQuery = supabase
      .from('tasks')
      .select('*, assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name)')
      .eq('organization_id', profile.organization_id)
    if (profile.role === 'owner' && selectedTeamId) {
      taskQuery = taskQuery.eq('team_id', selectedTeamId)
    }
    if (profile.role !== 'owner') {
      taskQuery = taskQuery.eq('assigned_to', profile.id)
    }

    const [{ data: t }, { data: m }] = await Promise.all([
      taskQuery.order('created_at', { ascending: false }),
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
    }).select('*, assigned_profile:profiles!tasks_assigned_to_fkey(id, full_name), creator:profiles!tasks_created_by_fkey(full_name)').single()

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

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tareas</h2>
          {activeTeam && <p className="text-sm text-[#00B4D8] font-medium mt-0.5">{activeTeam.name}</p>}
        </div>
        {isOwner && (
          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            Nueva tarea
          </button>
        )}
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
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={e => setNewTask(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
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
              saving={saving}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, members, isOwner, today, editing, onEdit, onEditChange, onSaveEdit, onCancelEdit, onApprove, onReject, onComplete, saving }) {
  const isOverdue = task.status === 'active' && task.due_date && task.due_date < today
  const cfg = STATUS_CONFIG[task.status]

  return (
    <div className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${isOverdue ? 'border-red-200' : 'border-gray-200'}`}>
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
                {isOverdue && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">
                    Vencida
                  </span>
                )}
              </div>
              {task.description && (
                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
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
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isOwner && task.status === 'pending_approval' && (
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
              {task.status === 'active' && (
                <>
                  {isOwner && (
                    <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={onComplete}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Marcar como completada"
                  >
                    <Check size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
