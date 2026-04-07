import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Users, Plus, X, ChevronDown } from 'lucide-react'

export default function Teams() {
  const { profile } = useAuth()
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTeamName, setNewTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState(null)

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchAll()
  }, [profile])

  async function fetchAll() {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase
        .from('teams')
        .select('*, team_members(profile_id, profiles(id, full_name))')
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

  async function createTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setCreating(true)
    const { data } = await supabase
      .from('teams')
      .insert({ organization_id: profile.organization_id, name: newTeamName.trim() })
      .select('*, team_members(profile_id, profiles(id, full_name))')
      .single()
    if (data) setTeams(prev => [...prev, data])
    setNewTeamName('')
    setCreating(false)
  }

  async function deleteTeam(teamId) {
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

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipos</h2>
      </div>

      {/* Crear equipo */}
      <form onSubmit={createTeam} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Nombre del equipo (ej: Pauta, Diseño, Contenido)"
          value={newTeamName}
          onChange={e => setNewTeamName(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={creating || !newTeamName.trim()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={15} />
          Crear equipo
        </button>
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
                  <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                    {/* Miembros actuales */}
                    {team.team_members?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {team.team_members.map(m => (
                          <div key={m.profile_id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-medium">
                              {m.profiles?.full_name?.[0]?.toUpperCase()}
                            </div>
                            {m.profiles?.full_name}
                            <button
                              onClick={() => removeMember(team.id, m.profile_id)}
                              className="ml-0.5 text-blue-400 hover:text-blue-700"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Sin miembros aún</p>
                    )}

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
