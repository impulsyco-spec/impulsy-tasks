import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, UserPlus, X, Shield, User } from 'lucide-react'

export default function TeamMembersModal({ isOpen, onClose, team, profile }) {
  const [members, setMembers] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addingUser, setAddingUser] = useState('')
  const [processing, setProcessing] = useState(false)

  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'

  useEffect(() => {
    if (isOpen && team) {
      fetchData()
    }
  }, [isOpen, team])

  async function fetchData() {
    setLoading(true)
    
    // Fetch all profiles in the org
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('organization_id', profile.organization_id)
      .order('full_name')

    // Fetch team members
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('profile_id, profiles(id, full_name, role, email)')
      .eq('team_id', team.id)

    const memberIds = new Set(teamMembers?.map(tm => tm.profile_id) || [])
    
    const mappedMembers = teamMembers?.map(tm => tm.profiles) || []
    setMembers(mappedMembers)

    // Filter available users (not in team)
    const available = allProfiles?.filter(p => !memberIds.has(p.id)) || []
    setAvailableUsers(available)
    
    setLoading(false)
  }

  async function handleAddMember() {
    if (!addingUser || !isOwner) return
    setProcessing(true)
    
    try {
      await supabase.from('team_members').insert({
        team_id: team.id,
        profile_id: addingUser
      })
      
      setAddingUser('')
      await fetchData()
    } catch (error) {
      console.error("Error adding member", error)
      alert("Error al añadir miembro")
    } finally {
      setProcessing(false)
    }
  }

  async function handleRemoveMember(profileId) {
    if (!isOwner) return
    if (!confirm('¿Eliminar a este usuario del equipo?')) return
    
    setProcessing(true)
    try {
      await supabase.from('team_members')
        .delete()
        .eq('team_id', team.id)
        .eq('profile_id', profileId)
        
      await fetchData()
    } catch (error) {
      console.error("Error removing member", error)
      alert("Error al eliminar miembro")
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen) return null

  const filteredMembers = members.filter(m => 
    m?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    m?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[450px] max-w-full z-50 bg-[rgb(var(--card))] border-l border-[rgb(var(--border))] flex flex-col animate-in slide-in-from-right duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
          <div>
            <h2 className="text-base font-bold text-[rgb(var(--text-primary))]">
              Miembros: {team?.name}
            </h2>
            <p className="text-xs text-[rgb(var(--text-secondary))]">{members.length} miembros en este equipo</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background))] flex items-center justify-center transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {isOwner && (
            <div className="bg-[rgb(var(--background))] p-4 rounded-xl border border-[rgb(var(--border))]">
              <h3 className="text-xs font-bold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-3">Añadir miembro</h3>
              <div className="flex gap-2">
                <select 
                  value={addingUser}
                  onChange={e => setAddingUser(e.target.value)}
                  className="flex-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg text-sm px-3 py-2 outline-none focus:border-[rgb(var(--primary))]"
                >
                  <option value="">Selecciona un usuario...</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
                <button 
                  onClick={handleAddMember}
                  disabled={!addingUser || processing}
                  className="bg-[rgb(var(--primary))] text-white px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <UserPlus size={16} /> Añadir
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" size={16} />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar miembro..."
                className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-[rgb(var(--text-secondary))] text-sm">
                No se encontraron miembros.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--background))] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgb(var(--primary),0.1)] text-[rgb(var(--primary))] flex items-center justify-center font-bold">
                        {m.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[rgb(var(--text-primary))] flex items-center gap-1.5">
                          {m.full_name}
                          {m.role === 'owner' && <Shield size={12} className="text-[rgb(var(--primary))]" />}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-secondary))]">{m.email}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <button 
                        onClick={() => handleRemoveMember(m.id)}
                        disabled={processing}
                        className="text-[rgb(var(--text-muted))] hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors disabled:opacity-50"
                        title="Eliminar del equipo"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
