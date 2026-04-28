import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { getLogoUrl } from '../lib/utils'
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
  ChevronDown,
  KeyRound,
} from 'lucide-react'
import Logo from './Logo'

export default function Layout({ children }) {
  const { profile } = useAuth()
  const { teams, selectedTeamId, setSelectedTeamId } = useTeam()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleResetPassword() {
    const email = profile?.id ? (await supabase.auth.getUser()).data.user?.email : null
    if (!email) return
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/dashboard',
    })
    setResetSent(true)
    setTimeout(() => setResetSent(false), 3000)
  }

  useEffect(() => {
    if (!profile) return

    const fetchCount = () => {
      supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', profile.id)
        .eq('read', false)
        .then(({ count }) => setUnread(count || 0))
    }

    fetchCount()

    const channel = supabase
      .channel('notifications-count')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${profile.id}` 
      }, fetchCount)
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

  const isOwner = profile?.role === 'owner'
  const isManager = profile?.role === 'manager'

  const nav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transcripts', icon: FileText, label: 'Transcripts' },
    { to: '/tasks', icon: CheckSquare, label: 'Tareas' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones', badge: unread },
    ...(isOwner || isManager ? [{ to: '/teams', icon: Users, label: 'Equipos' }] : []),
  ]

  const initials = profile?.full_name
    ?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 overflow-x-hidden">

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex w-60 bg-[#0D1F3C] flex-col flex-shrink-0">
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <Logo size="sm" dark />
          <p className="text-slate-500 text-xs mt-2 truncate">{profile?.organizations?.name}</p>
          {(isOwner || isManager || teams.length > 1) && teams.length > 0 && (
            <div className="mt-3 relative flex items-center gap-2">
              {selectedTeamId && teams.find(t => t.id === selectedTeamId)?.logo_url && (
                <div className="w-8 h-8 rounded bg-white flex-shrink-0 overflow-hidden border border-white/20">
                  <img 
                    src={getLogoUrl(teams.find(t => t.id === selectedTeamId)?.logo_url)} 
                    alt="Team Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="relative flex-1">
                <select
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                  className="w-full appearance-none bg-white/10 text-white text-[11px] rounded-lg pl-2 pr-6 py-1.5 border border-white/20 focus:outline-none focus:border-[#00B4D8] cursor-pointer"
                >
                  {(isOwner || isManager) && <option value="" className="bg-[#0D1F3C]">Todos los equipos</option>}
                  {teams.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0D1F3C]">{t.name}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
          {!(isOwner || isManager) && teams.length === 1 && (
            <div className="mt-2 flex items-center gap-2">
              {teams[0].logo_url && (
                <div className="w-5 h-5 rounded bg-white overflow-hidden border border-white/20">
                  <img src={getLogoUrl(teams[0].logo_url)} alt="Team Logo" className="w-full h-full object-contain" />
                </div>
              )}
              <p className="text-[#00B4D8] text-xs font-medium truncate">{teams[0].name}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-[#00B4D8] text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          {(isOwner || isManager) && (
            <button onClick={copyOrgId}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-500 hover:bg-white/10 hover:text-slate-300 rounded-lg transition-colors">
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              <span>{copied ? 'ID copiado' : 'Copiar ID org'}</span>
            </button>
          )}
          <button onClick={handleResetPassword}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-500 hover:bg-white/10 hover:text-slate-300 rounded-lg transition-colors">
            {resetSent ? <Check size={12} className="text-green-400" /> : <KeyRound size={12} />}
            <span>{resetSent ? 'Email enviado!' : 'Cambiar contraseña'}</span>
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0D1F3C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-600 hover:text-slate-300 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 w-full">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-2 bg-[#0D1F3C] flex-shrink-0 w-full max-w-full">
          <Logo size="sm" dark />
          <button onClick={() => setMobileMenuOpen(true)} className="text-white p-1 relative">
            <Menu size={22} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* ── BOTTOM NAV (mobile) ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0D1F3C] border-t border-white/10 flex z-40 w-full max-w-full">
          {nav.slice(0, 5).map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors relative ${
                  isActive ? 'text-[#00B4D8]' : 'text-slate-500'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span>{label === 'Notificaciones' ? 'Notif.' : label === 'Transcripts' ? 'Reuniones' : label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 bg-[#0D1F3C] flex flex-col h-full ml-auto shadow-2xl">
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <Logo size="sm" dark />
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              {(isOwner || isManager || teams.length > 1) && teams.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedTeamId && teams.find(t => t.id === selectedTeamId)?.logo_url && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-white overflow-hidden border border-white/20">
                        <img 
                          src={getLogoUrl(teams.find(t => t.id === selectedTeamId)?.logo_url)} 
                          alt="Team Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-white text-sm font-medium">{teams.find(t => t.id === selectedTeamId)?.name}</span>
                    </div>
                  )}
                  <div className="relative">
                    <select
                      value={selectedTeamId}
                      onChange={e => setSelectedTeamId(e.target.value)}
                      className="w-full appearance-none bg-white/10 text-white text-xs rounded-lg pl-3 pr-7 py-2 border border-white/20 focus:outline-none focus:border-[#00B4D8] cursor-pointer"
                    >
                      {(isOwner || isManager) && <option value="" className="bg-[#0D1F3C]">Todos los equipos</option>}
                      {teams.map(t => (
                        <option key={t.id} value={t.id} className="bg-[#0D1F3C]">{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
              {!(isOwner || isManager) && teams.length === 1 && (
                <div className="mt-2 flex items-center gap-2">
                  {teams[0].logo_url && (
                    <div className="w-6 h-6 rounded bg-white overflow-hidden border border-white/20">
                      <img src={getLogoUrl(teams[0].logo_url)} alt="Team Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <p className="text-[#00B4D8] text-xs font-medium truncate">{teams[0].name}</p>
                </div>
              )}
            </div>

            <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {nav.map(({ to, icon: Icon, label, badge }) => (
                <NavLink key={to} to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-[#00B4D8] text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 space-y-2">
              {(isOwner || isManager) && (
                <button onClick={() => { copyOrgId(); setMobileMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copied ? 'ID copiado' : 'Copiar ID org'}</span>
                </button>
              )}
              <button onClick={handleResetPassword}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                {resetSent ? <Check size={14} className="text-green-400" /> : <KeyRound size={14} />}
                <span>{resetSent ? 'Email enviado!' : 'Cambiar contraseña'}</span>
              </button>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0D1F3C] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                  <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors p-1">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
