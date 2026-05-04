import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Users, Plus, X, ChevronDown, Camera, Shield, ShieldCheck, User as UserIcon } from 'lucide-react'

export default function Teams() {
  const { profile } = useAuth()
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTeamName, setNewTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchAll()
  }, [profile])

  async function fetchAll() {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase
        .from('teams')
        .select('*, team_members(profile_id, profiles(id, full_name, role))')
        .eq('organization_id', profile.organization_id)
        .order('created_at'),
      supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('organization_id', profile.organization_id)
        .order('full_name'),
    ])
    setTeams(t || [])
    setMembers(m || [])
    setLoading(false)
  }

  async function createTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setCreating(true)
    const { data } = await supabase
      .from('teams')
      .insert({ organization_id: profile.organization_id, name: newTeamName.trim() })
      .select('*, team_members(profile_id, profiles(id, full_name, role))')
      .single()
    if (data) setTeams(prev => [...prev, data])
    setNewTeamName('')
    setCreating(false)
  }

  async function deleteTeam(teamId) {
    if (!confirm('¿Estás seguro de eliminar este equipo?')) return
    await supabase.from('teams').delete().eq('id', teamId)
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }

  async function addMember(teamId, profileId) {
    await supabase.from('team_members').insert({ team_id: teamId, profile_id: profileId })
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t
      const member = members.find(m => m.id === profileId)
      return {
        ...t,
        team_members: [...(t.team_members || []), { profile_id: profileId, profiles: member }],
      }
    }))
  }

  async function removeMember(teamId, profileId) {
    await supabase.from('team_members').delete().eq('team_id', teamId).eq('profile_id', profileId)
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t
      return { ...t, team_members: t.team_members.filter(m => m.profile_id !== profileId) }
    }))
  }

  async function updateRole(memberId, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId)
    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      setTeams(prev => prev.map(t => ({
        ...t,
        team_members: t.team_members?.map(tm => 
          tm.profile_id === memberId 
            ? { ...tm, profiles: { ...tm.profiles, role: newRole } }
            : tm
        )
      })))
    }
  }

  async function uploadLogo(teamId, file) {
    if (!file) return
    setUploadingLogo(teamId)
    const fileExt = file.name.split('.').pop()
    const fileName = `${teamId}-${Math.random()}.${fileExt}`
    const filePath = `team-logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file)

    if (uploadError) {
      alert('Error al subir logo')
      setUploadingLogo(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('teams')
      .update({ logo_url: publicUrl })
      .eq('id', teamId)

    if (updateError) {
      alert('Error al actualizar equipo')
    } else {
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, logo_url: publicUrl } : t))
    }
    setUploadingLogo(null)
  }

  function getLogoByName(teamName) {
    if (!teamName) return null
    const name = teamName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (name.includes('upgoing')) return '/logos/logo-upgoing.png'
    if (name.includes('cluenza')) return '/logos/logo-cluenza.png'
    if (name.includes('impulsy')) return '/logos/logo-impulsy.jpg'
    if (name.includes('kp')) return '/logos/logo-kp.png'
    if (name.includes('velik')) return '/logos/logo-velik.png'
    if (name.includes('detailing')) return '/logos/jpdetailing.png'
    if (name.includes('oral')) return '/logos/oralgroup.jpg'
    return null
  }

  function getLogoUrl(logoUrl, teamName) {
    // Primero intenta logo local por nombre (siempre disponible)
    const local = getLogoByName(teamName)
    if (local) return local
    // Si no hay local, usa la URL de Supabase Storage
    return logoUrl || null
  }

  if (loading) return <div className="p-8 text-[rgb(var(--text-muted))] animate-pulse">Cargando equipos...</div>

  const isOwner = profile?.role === 'owner'

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Equipos y Colaboradores</h2>
          <p className="text-[rgb(var(--text-secondary))] mt-1">Gestiona los equipos de trabajo y los roles de acceso.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Equipos */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-4">Equipos de Trabajo</h3>
            
            {isOwner && (
              <form onSubmit={createTeam} className="flex gap-2 mb-6 p-1 bg-[#0c0c0c] rounded-2xl premium-shadow border border-[#1c1c1c]">
                <input
                  type="text"
                  placeholder="Nuevo equipo (ej: Marketing, Desarrollo...)"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white focus:ring-0 placeholder:text-[rgb(var(--text-muted))]"
                />
                <button
                  type="submit"
                  disabled={creating || !newTeamName.trim()}
                  className="flex items-center gap-2 bg-[rgb(var(--primary))] text-black px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  <Plus size={16} />
                  Crear
                </button>
              </form>
            )}

            <div className="space-y-4">
              {teams.length === 0 ? (
                <div className="premium-card p-10 text-center text-[rgb(var(--text-secondary))]">
                  <Users size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No has creado equipos todavía.</p>
                </div>
              ) : (
                teams.map(team => {
                  const teamMemberIds = (team.team_members || []).map(m => m.profile_id)
                  const available = members.filter(m => !teamMemberIds.includes(m.id))
                  const isExpanded = expandedTeam === team.id

                  return (
                    <div key={team.id} className={`premium-card overflow-hidden ${isExpanded ? 'ring-2 ring-blue-500/10' : ''}`}>
                      <div
                        className="flex items-center gap-4 px-6 py-5 cursor-pointer select-none"
                        onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                      >
                        <div className="relative group">
                          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#252525] flex items-center justify-center text-[rgb(var(--text-muted))] overflow-hidden group-hover:border-[rgb(var(--primary))/30] transition-colors">
                            {getLogoUrl(team.logo_url, team.name) ? (
                              <img src={getLogoUrl(team.logo_url, team.name)} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={20} />
                            )}
                            {isOwner && (
                              <div 
                                className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); document.getElementById(`logo-${team.id}`).click() }}
                              >
                                <Camera size={14} className="text-white" />
                              </div>
                            )}
                          </div>
                          <input 
                            id={`logo-${team.id}`}
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => uploadLogo(team.id, e.target.files[0])}
                          />
                        </div>

                        <div className="flex-1">
                          <h4 className="font-bold text-white">{team.name}</h4>
                          <p className="text-xs text-[rgb(var(--text-secondary))] font-medium">
                            {teamMemberIds.length} miembro{teamMemberIds.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ChevronDown size={18} className={`text-[rgb(var(--text-secondary))] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                          {isOwner && (
                            <button
                              onClick={e => { e.stopPropagation(); deleteTeam(team.id) }}
                              className="p-2 text-[rgb(var(--text-secondary))] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-[#080808] border-t border-[#1c1c1c] px-6 py-5 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {team.team_members?.length > 0 ? (
                              team.team_members.map(m => (
                                <div key={m.profile_id} className="group flex items-center gap-2 bg-[#141414] border border-[#252525] text-[rgb(var(--text-secondary))] text-xs pl-1 pr-2 py-1 rounded-xl shadow-sm hover:border-[rgb(var(--primary))/30] transition-all">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold ${m.profiles?.role === 'manager' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                    {m.profiles?.full_name?.[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{m.profiles?.full_name}</span>
                                    {m.profiles?.role === 'manager' && (
                                      <span className="text-[8px] text-amber-600 font-bold uppercase tracking-tight -mt-0.5">Sub-Owner 👑</span>
                                    )}
                                  </div>
                                  
                                  {isOwner && (
                                    <div className="flex items-center gap-1 ml-1">
                                      <button
                                        onClick={() => updateRole(m.profile_id, m.profiles?.role === 'manager' ? 'member' : 'manager')}
                                        className={`p-1 rounded-md transition-colors ${m.profiles?.role === 'manager' ? 'text-blue-500 bg-blue-50' : 'text-[rgb(var(--text-secondary))] hover:text-amber-500 hover:bg-amber-50'}`}
                                        title={m.profiles?.role === 'manager' ? 'Quitar Sub-Owner' : 'Hacer Sub-Owner'}
                                      >
                                        {m.profiles?.role === 'manager' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                                      </button>
                                      <button
                                        onClick={() => removeMember(team.id, m.profile_id)}
                                        className="text-[rgb(var(--text-secondary))] hover:text-red-500 transition-colors p-1"
                                        title="Eliminar del equipo"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-[rgb(var(--text-muted))] italic">No hay miembros asignados.</p>
                            )}
                          </div>

                          {isOwner && available.length > 0 && (
                            <div className="relative">
                              <select
                                defaultValue=""
                                onChange={e => { if (e.target.value) addMember(team.id, e.target.value); e.target.value = '' }}
                                className="w-full bg-[#141414] border border-[#252525] rounded-xl px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-secondary))] appearance-none cursor-pointer hover:border-[rgb(var(--primary))/30] transition-all shadow-sm"
                              >
                                <option value="" disabled className="bg-[#0c0c0c]">+ Asignar colaborador al equipo</option>
                                {available.map(m => (
                                  <option key={m.id} value={m.id} className="bg-[#0c0c0c]">{m.full_name}</option>
                                ))}
                              </select>
                              <Plus size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] pointer-events-none" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </div>

        {/* Columna Derecha: Roles y Permisos */}
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-4">Roles de la Organización</h3>
            <div className="premium-card p-6 space-y-6">
              <div className="space-y-4">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 py-3 last:border-0 border-b border-[#1c1c1c]">
                    <div className="w-10 h-10 rounded-xl bg-[#141414] flex items-center justify-center text-[rgb(var(--text-muted))] font-bold border border-[#252525]">
                      {member.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{member.full_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {member.role === 'owner' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                            <ShieldCheck size={10} /> Propietario
                          </span>
                        ) : member.role === 'manager' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                            <Shield size={10} /> Sub-Owner
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[rgb(var(--text-muted))] bg-[#141414] px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                            <UserIcon size={10} /> Miembro
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isOwner && member.id !== profile.id && (
                      <div className="flex items-center gap-1">
                        {member.role === 'member' ? (
                          <button
                            onClick={() => updateRole(member.id, 'manager')}
                            className="p-2 text-[rgb(var(--text-muted))] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Hacer Sub-Owner"
                          >
                            <Shield size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateRole(member.id, 'member')}
                            className="p-2 text-[rgb(var(--text-muted))] hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                            title="Quitar permisos"
                          >
                            <ShieldCheck size={16} className="text-indigo-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-[#1c1c1c]">
                <div className="flex items-start gap-3 p-3 bg-[rgb(var(--primary))]/5 rounded-xl border border-[rgb(var(--primary))]/10">
                  <ShieldCheck size={16} className="text-[rgb(var(--primary))] mt-0.5" />
                  <p className="text-[11px] text-[rgb(var(--text-secondary))] leading-relaxed">
                    <strong className="block mb-0.5 text-[rgb(var(--primary))]">Sobre el Sub-Owner:</strong>
                    Los sub-owners pueden gestionar tareas, aprobar cambios y ver todos los equipos, pero no pueden eliminar la organización.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
