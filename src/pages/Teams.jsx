import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getLogoUrl } from '../lib/utils'
import { Users, Plus, X, ChevronDown, Shield } from 'lucide-react'

export default function Teams() {
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner'
  const isManager = profile?.role === 'manager'

  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTeam, setNewTeam] = useState({ name: '', logo_url: '' })
  const [creating, setCreating] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [editingLogo, setEditingLogo] = useState(null)

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
        .select('id, full_name, role')
        .eq('organization_id', profile.organization_id),
    ])
    setTeams(t || [])
    setMembers(m || [])
    setLoading(false)
  }

  async function updateMemberRole(profileId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId)
    
    if (!error) {
      setTeams(prev => prev.map(team => ({
        ...team,
        team_members: team.team_members?.map(m => 
          m.profile_id === profileId 
            ? { ...m, profiles: { ...m.profiles, role: newRole } }
            : m
        )
      })))
      setMembers(prev => prev.map(m => m.id === profileId ? { ...m, role: newRole } : m))
    }
  }

  async function createTeam(e) {
    e.preventDefault()
    if (!newTeam.name.trim()) return
    setCreating(true)
    const { data } = await supabase
      .from('teams')
      .insert({ 
        organization_id: profile.organization_id, 
        name: newTeam.name.trim(),
        logo_url: newTeam.logo_url.trim() || null
      })
      .select('*, team_members(profile_id, profiles(id, full_name, role))')
      .single()
    if (data) setTeams(prev => [...prev, data])
    setNewTeam({ name: '', logo_url: '' })
    setCreating(false)
  }

  async function deleteTeam(teamId) {
    await supabase.from('teams').delete().eq('id', teamId)
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }

  async function updateTeamLogo(teamId, logo_url) {
    await supabase.from('teams').update({ logo_url }).eq('id', teamId)
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, logo_url } : t))
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

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>

  if (!isOwner && !isManager) return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <X size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
      <p className="text-gray-500">Solo los administradores o sub-owners pueden gestionar equipos.</p>
    </div>
  )

  return (
    <div className="p-3 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipos</h2>
      </div>

      {/* Crear equipo */}
      <form onSubmit={createTeam} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">Crear nuevo equipo</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre del equipo (ej: Pauta, Diseño)"
            value={newTeam.name}
            onChange={e => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Logo (ej: logo-kp.png)"
            value={newTeam.logo_url}
            onChange={e => setNewTeam(prev => ({ ...prev, logo_url: e.target.value }))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={creating || !newTeam.name.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={15} />
            Crear
          </button>
        </div>
      </form>

      {/* Lista de equipos */}
      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <Users size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay equipos aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(team => {
            const teamMemberIds = (team.team_members || []).map(m => m.profile_id)
            const available = members.filter(m => !teamMemberIds.includes(m.id))
            const isExpanded = expandedTeam === team.id

            return (
              <div key={team.id} className="bg-white rounded-xl border border-gray-200">
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {team.logo_url ? (
                      <img src={getLogoUrl(team.logo_url)} alt={team.name} className="w-full h-full object-contain" />
                    ) : (
                      <Users size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{teamMemberIds.length} miembro{teamMemberIds.length !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  <button
                    onClick={e => { e.stopPropagation(); deleteTeam(team.id) }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar equipo"
                  >
                    <X size={14} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    {/* Editar Logo */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                          {team.logo_url ? (
                            <img src={getLogoUrl(team.logo_url)} alt={team.name} className="w-full h-full object-contain p-2" />
                          ) : (
                            <Users size={24} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-0.5">Logo del equipo</label>
                          <p className="text-[10px] text-gray-400 mb-2">Ingresa el nombre del archivo en /public/logos/</p>
                          {editingLogo === team.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                autoFocus
                                defaultValue={team.logo_url || ''}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    updateTeamLogo(team.id, e.target.value.trim() || null)
                                    setEditingLogo(null)
                                  }
                                  if (e.key === 'Escape') setEditingLogo(null)
                                }}
                                placeholder="ej. logo-upgoing.png"
                                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                              <button
                                onClick={() => setEditingLogo(null)}
                                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingLogo(team.id)}
                              className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
                            >
                              {team.logo_url ? 'Cambiar logo' : 'Agregar logo'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Miembros actuales */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Miembros</label>
                      {team.team_members?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {team.team_members.map(m => (
                            <div key={m.profile_id} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-xl shadow-sm group">
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px] font-bold ${m.profiles?.role === 'manager' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                {m.profiles?.full_name?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-800">{m.profiles?.full_name}</span>
                                <span className={`text-[9px] uppercase tracking-tighter font-black ${m.profiles?.role === 'manager' ? 'text-amber-600' : 'text-blue-500'}`}>
                                  {m.profiles?.role === 'manager' ? 'Sub-Owner 👑' : 'Miembro'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-2 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => updateMemberRole(m.profile_id, m.profiles?.role === 'manager' ? 'member' : 'manager')}
                                  className={`p-1 rounded-md transition-colors ${m.profiles?.role === 'manager' ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                  title={m.profiles?.role === 'manager' ? 'Quitar Sub-Owner' : 'Hacer Sub-Owner'}
                                >
                                  {m.profiles?.role === 'manager' ? <Users size={12} /> : <Shield size={12} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeMember(team.id, m.profile_id)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  title="Eliminar del equipo"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Sin miembros aún</p>
                      )}
                    </div>

                    {/* Agregar miembro */}
                    {available.length > 0 && (
                      <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) addMember(team.id, e.target.value); e.target.value = '' }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">+ Agregar miembro al equipo</option>
                        {available.map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
