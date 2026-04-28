import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'

export default function Notifications() {
  const { profile } = useAuth()
  const { selectedTeamId, teams } = useTeam()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const activeTeam = teams.find(t => t.id === selectedTeamId)

  useEffect(() => {
    if (!profile) return
    fetchNotifications()

    const channel = supabase
      .channel('notif-page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, payload => {
        setNotifications(prev => [{ ...payload.new, tasks: null }, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile])

  useEffect(() => {
    if (!profile) return
    fetchNotifications()
  }, [selectedTeamId])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*, tasks(title, team_id, assigned_to)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    let result = data || []

    // Members: solo ver notificaciones de tareas asignadas a ellos
    if (profile.role === 'member') {
      result = result.filter(n => {
        if (!n.tasks) return true // notificaciones sin tarea (genéricas)
        return n.tasks.assigned_to === profile.id
      })
    }

    // Filtro por equipo (owners y managers)
    if ((profile.role === 'owner' || profile.role === 'manager') && selectedTeamId) {
      result = result.filter(n => {
        if (!n.tasks) return true
        if (!n.tasks.team_id) return true
        return n.tasks.team_id === selectedTeamId
      })
    }

    setNotifications(result)
    setLoading(false)
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function deleteNotif(id) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function deleteAll() {
    const ids = notifications.map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('notifications').delete().in('id', ids)
    setNotifications([])
  }

  const unread = notifications.filter(n => !n.read).length

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
          {activeTeam
            ? <p className="text-sm text-[#00B4D8] font-medium mt-0.5">{activeTeam.name}{unread > 0 ? ` · ${unread} sin leer` : ''}</p>
            : unread > 0 && <p className="text-sm text-gray-500 mt-1">{unread} sin leer</p>
          }
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <CheckCheck size={14} />
              Marcar leídas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={deleteAll}
              className="flex items-center gap-2 text-sm text-red-500 hover:underline"
            >
              <Trash2 size={14} />
              Eliminar todas
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Bell size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors ${!notif.read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {!notif.read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Marcar como leída"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(notif.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
