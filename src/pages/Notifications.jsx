import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { Bell, Check, CheckCheck } from 'lucide-react'

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
      .select('*, tasks(title, team_id)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    const all = data || []
    const filtered = selectedTeamId
      ? all.filter(n => {
          if (!n.tasks) return true
          if (!n.tasks.team_id) return true
          return n.tasks.team_id === selectedTeamId
        })
      : all

    setNotifications(filtered)
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

  const unread = notifications.filter(n => !n.read).length

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
          {activeTeam
            ? <p className="text-sm text-[#00B4D8] font-medium mt-0.5">{activeTeam.name}{unread > 0 ? ` · ${unread} sin leer` : ''}</p>
            : unread > 0 && <p className="text-sm text-gray-500 mt-1">{unread} sin leer</p>
          }
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <CheckCheck size={14} />
            Marcar todas como leídas
          </button>
        )}
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
                {!notif.read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Marcar como leída"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
