import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { Bell, FileText, LogOut, LayoutDashboard, ListTodo, Users, Plus } from 'lucide-react'
import TaskDrawer from './TaskDrawer'
import Logo from './Logo'

export default function Layout({ children }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', profile.id)
      .eq('read', false)
      .then(({ count }) => setUnread(count || 0))

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => setUnread(n => n + 1)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isAdmin = profile?.role === 'owner' || profile?.role === 'manager'

  const initials = profile?.full_name
    ?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

  const tabs = [
    { to: '/tasks', label: 'Tareas' },
    { to: '/dashboard', label: 'Métricas' },
    ...(isAdmin ? [{ to: '/teams', label: 'Equipo' }] : []),
  ]

  return (
    <div className="flex flex-col h-screen bg-[rgb(var(--background))]">
      {/* ── TOP NAV ── */}
      <nav className="bg-[rgb(var(--background))]/80 backdrop-blur-xl border-b border-[rgb(var(--border))] h-14 sticky top-0 z-50 flex items-center justify-between px-6 flex-shrink-0">
        
        {/* Izquierda: Logo y Cliente y Tabs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 md:border-r border-[rgb(var(--border))] md:pr-6">
            <Logo size="sm" className="opacity-90 hover:opacity-100 transition-opacity" />
            {profile?.organizations?.name && (
              <div className="hidden md:block text-[rgb(var(--text-secondary))] text-sm">
                <span className="text-[rgb(var(--text-primary))] font-semibold">{profile.organizations.name}</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {tabs.map((tab) => (
              <NavLink 
                key={tab.to} 
                to={tab.to}
                className={({ isActive }) => 
                  `text-xs font-bold px-3 py-1.5 rounded-[8px] transition-all ${
                    isActive 
                      ? 'bg-[rgb(var(--primary),0.1)] text-[rgb(var(--primary))]' 
                      : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Derecha: Iconos, Avatar y Botón */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1 border-r border-[rgb(var(--border))] pr-4">
            {/* Notificaciones */}
            <NavLink 
              to="/notifications"
              title="Notificaciones"
              className={({ isActive }) => 
                `w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive 
                    ? 'bg-[rgb(var(--card-hover))] text-[rgb(var(--primary))]' 
                    : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--card-hover))] hover:text-[rgb(var(--text-secondary))]'
                }`
              }
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[rgb(var(--urgent))] rounded-full shadow-[0_0_8px_rgba(var(--urgent),0.5)]"></span>
              )}
            </NavLink>

            {/* Transcripts */}
            <NavLink 
              to="/transcripts"
              title="Transcripts AI"
              className={({ isActive }) => 
                `w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive 
                    ? 'bg-[rgb(var(--card-hover))] text-[rgb(var(--primary))]' 
                    : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--card-hover))] hover:text-[rgb(var(--text-secondary))]'
                }`
              }
            >
              <FileText size={18} />
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout} 
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] rounded-xl px-2 py-1 flex items-center gap-2 hover:border-red-500/50 hover:text-red-400 transition-all group"
              title="Cerrar sesión"
            >
              <div className="w-7 h-7 bg-[rgb(var(--card))] rounded-lg flex items-center justify-center text-[10px] font-black text-[rgb(var(--primary))] border border-[rgb(var(--border))] group-hover:border-[rgb(var(--primary))/20]">
                {initials}
              </div>
              <LogOut size={14} className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => navigate('/tasks#new')}
              className="hidden md:flex bg-[rgb(var(--primary))] text-black text-xs font-black rounded-xl h-[36px] px-5 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:brightness-110 transition-all items-center gap-2 active:scale-95"
            >
              <span className="text-lg leading-none">+</span>
              Nueva tarea
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto w-full max-w-6xl mx-auto p-6 pb-24 md:pb-6 scroll-smooth">
        {children}
      </main>

      {/* ── BOTTOM NAV (MOBILE ONLY) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[rgb(var(--background))]/80 backdrop-blur-xl border-t border-[rgb(var(--border))] h-16 z-50 flex items-center justify-around px-4">
        <NavLink to="/tasks" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[rgb(var(--primary))]' : 'text-[rgb(var(--text-muted))]'}`}>
          <div className={`p-1.5 rounded-lg transition-all ${location.pathname === '/tasks' ? 'bg-[rgb(var(--primary),0.1)]' : ''}`}>
            <ListTodo size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Tareas</span>
        </NavLink>
        
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[rgb(var(--primary))]' : 'text-[rgb(var(--text-muted))]'}`}>
          <div className={`p-1.5 rounded-lg transition-all ${location.pathname === '/dashboard' ? 'bg-[rgb(var(--primary),0.1)]' : ''}`}>
            <LayoutDashboard size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Métricas</span>
        </NavLink>

        <NavLink to="/teams" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[rgb(var(--primary))]' : 'text-[rgb(var(--text-muted))]'}`}>
          <div className={`p-1.5 rounded-lg transition-all ${location.pathname === '/teams' ? 'bg-[rgb(var(--primary),0.1)]' : ''}`}>
            <Users size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Equipo</span>
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all relative ${isActive ? 'text-[rgb(var(--primary))]' : 'text-[rgb(var(--text-muted))]'}`}>
          <div className={`p-1.5 rounded-lg transition-all ${location.pathname === '/notifications' ? 'bg-[rgb(var(--primary),0.1)]' : ''}`}>
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[rgb(var(--urgent))] rounded-full shadow-[0_0_8px_rgba(var(--urgent),0.5)]"></span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Avisos</span>
        </NavLink>
      </nav>

    </div>
  )
}
