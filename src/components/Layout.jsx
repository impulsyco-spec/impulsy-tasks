import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Bell,
  LogOut,
  Copy,
  Check,
  Users,
  Menu,
  X,
  Settings,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import Logo from './Logo'

export default function Layout({ children }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  function copyOrgId() {
    navigator.clipboard.writeText(profile?.organization_id || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isAdmin = profile?.role === 'owner' || profile?.role === 'manager'

  const nav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transcripts', icon: FileText, label: 'Transcripts' },
    { to: '/tasks', icon: CheckSquare, label: 'Tareas' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones', badge: unread },
    ...(isAdmin ? [{ to: '/teams', icon: Users, label: 'Equipos' }] : []),
  ]

  const initials = profile?.full_name
    ?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

  return (
    <div className="flex h-screen bg-slate-50">

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0 relative z-20 shadow-sm">
        <div className="px-6 py-8">
          <Logo size="sm" />
          <div className="mt-6 px-3 py-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <p className="text-blue-900 text-[10px] font-bold uppercase tracking-widest opacity-60">Organización</p>
            <p className="text-blue-900 text-xs font-bold truncate mt-0.5">{profile?.organizations?.name}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {nav.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 premium-shadow' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`
              }
            >
              <Icon size={18} className="transition-transform group-hover:scale-110" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className={`text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                  badge > 0 ? 'bg-red-500 text-white animate-pulse' : 'hidden'
                }`}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          {profile?.role === 'owner' && (
            <button onClick={copyOrgId}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100">
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              <span>{copied ? 'ID Copiado' : 'Copiar ID Org'}</span>
            </button>
          )}
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                {profile?.role === 'owner' ? <ShieldCheck size={10} className="text-blue-600" /> : isAdmin ? <Shield size={10} className="text-indigo-600" /> : <Settings size={10} className="text-slate-400" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{profile?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0 z-30">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            {unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
            <button onClick={() => setMobileMenuOpen(true)} className="text-slate-600 p-1">
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 scroll-smooth">
          {children}
        </main>

        {/* ── BOTTOM NAV (mobile) ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-4 py-2 z-40 premium-shadow">
          {nav.slice(0, 4).map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
            </NavLink>
          ))}
          {isAdmin && (
             <NavLink to="/teams"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'
                }`
              }
            >
              <Users size={20} />
              <span className="text-[9px] font-bold uppercase tracking-tight">Equipos</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-80 bg-white flex flex-col h-full ml-auto shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
              <Logo size="sm" />
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-900 p-1 bg-slate-50 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
              <div className="mb-6 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organización</p>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{profile?.organizations?.name}</p>
              </div>

              {nav.map(({ to, icon: Icon, label, badge }) => (
                <NavLink key={to} to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                      isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 space-y-4">
              {profile?.role === 'owner' && (
                <button onClick={() => { copyOrgId(); setMobileMenuOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  <span>{copied ? 'ID Copiado' : 'Copiar ID Org'}</span>
                </button>
              )}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
