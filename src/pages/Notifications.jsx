import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Bell, Check, CheckCheck, Clock } from 'lucide-react'

export default function Notifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

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
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*, tasks(title)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setNotifications(data || [])
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

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) return (
    <div className="p-8 flex items-center gap-4 text-[rgb(var(--text-secondary))] font-medium">
      <div className="w-5 h-5 border-2 border-[rgb(var(--border))] border-t-[rgb(var(--primary))] rounded-full animate-spin" />
      <span>Cargando notificaciones...</span>
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[rgb(var(--text-primary))] tracking-tight">Notificaciones</h2>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-[rgb(var(--primary))] rounded-full animate-pulse" />
              <p className="text-[rgb(var(--text-secondary))] text-sm font-bold uppercase tracking-widest">{unreadCount} sin leer</p>
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--primary),0.1)] border border-[rgb(var(--primary),0.2)] text-[rgb(var(--primary))] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[rgb(var(--primary),0.15)] transition-all active:scale-95"
          >
            <CheckCheck size={14} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="bg-[rgb(var(--card))] rounded-2xl border border-[rgb(var(--border))] overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-20 text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-[rgb(var(--card-hover))] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[rgb(var(--border))]">
              <Bell size={24} className="text-[rgb(var(--text-muted))] opacity-40" />
            </div>
            <h3 className="text-[rgb(var(--text-secondary))] font-black uppercase tracking-widest text-xs">No tienes notificaciones</h3>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(var(--border))]">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-8 py-5 transition-all duration-300 ${!notif.read ? 'bg-[rgb(var(--primary),0.03)] border-l-2 border-l-[rgb(var(--primary))]' : 'hover:bg-[rgb(var(--card-hover))]/50 border-l-2 border-l-transparent'}`}
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-[rgb(var(--primary))]' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${!notif.read ? 'text-[rgb(var(--text-primary))] font-bold' : 'text-[rgb(var(--text-secondary))] font-medium'}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Clock size={10} className="text-[rgb(var(--text-muted))]" />
                    <p className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">
                      {new Date(notif.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                {!notif.read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="flex-shrink-0 p-2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary),0.1)] rounded-xl transition-all"
                    title="Marcar como leída"
                  >
                    <Check size={16} />
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
