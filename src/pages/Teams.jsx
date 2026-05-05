import { useState, useEffect } from 'react'
import { Plus, Users, Search, MoreHorizontal, Settings2, Trash2, Camera, UserPlus, Shield, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TeamDrawer from '../components/TeamDrawer'

export default function Teams() {
  const { profile } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(null)

  useEffect(() => {
    if (!profile?.organization_id) return
    
    async function fetchTeams() {
      let query = supabase
        .from('teams')
        .select('*')
        .eq('organization_id', profile.organization_id)

      // RBAC: Solo el Owner ve todos los equipos
      if (profile.role !== 'owner') {
        const myTeamIds = profile.team_members?.map(tm => tm.team_id) || []
        if (myTeamIds.length === 0) {
          setTeams([])
          setLoading(false)
          return
        }
        query = query.in('id', myTeamIds)
      }

      const { data } = await query.order('name')
      setTeams(data || [])
      setLoading(false)
    }

    fetchTeams()
  }, [profile])

  async function deleteTeam(teamId) {
    if (!confirm('¿Eliminar este equipo? Esto no eliminará las tareas pero les quitará la etiqueta de equipo.')) return
    await supabase.from('teams').delete().eq('id', teamId)
    setTeams(prev => prev.filter(t => t.id !== teamId))
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

    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath)

    await supabase.from('teams').update({ logo_url: publicUrl }).eq('id', teamId)
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, logo_url: publicUrl } : t))
    setUploadingLogo(null)
  }

  function getLogoDisplay(team) {
    if (team.logo_url) return { type: 'img', src: team.logo_url }
    return { type: 'text', text: team.name.substring(0, 2).toUpperCase() }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="w-8 h-8 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#f0f0f0] tracking-tight">Equipos</h1>
          <p className="text-sm text-[#707070]">Organiza tus proyectos por células de trabajo</p>
        </div>
        {profile?.role === 'owner' && (
          <button 
            onClick={() => { setEditingTeam(null); setShowNewTeam(true); }}
            className="flex bg-[rgb(var(--primary))] text-black text-xs font-black rounded-xl h-[40px] px-6 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:brightness-110 transition-all items-center gap-2 active:scale-95"
          >
            <Plus size={18} />
            Crear equipo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(t => {
          const logo = getLogoDisplay(t)
          return (
            <div key={t.id} className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl p-6 hover:border-[rgb(var(--primary),0.3)] transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="relative group/logo">
                  {logo.type === 'img' ? (
                    <img src={logo.src} alt={t.name} className="w-16 h-16 rounded-2xl object-cover border border-[#1c1c1c]" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--card))] border border-[#1c1c1c] flex items-center justify-center text-xl font-black text-[rgb(var(--primary))]">
                      {logo.text}
                    </div>
                  )}
                  {profile?.role === 'owner' && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover/logo:opacity-100 cursor-pointer transition-opacity">
                      <input type="file" className="hidden" onChange={(e) => uploadLogo(t.id, e.target.files[0])} accept="image/*" />
                      <Camera size={20} className="text-white" />
                    </label>
                  )}
                  {uploadingLogo === t.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                      <div className="w-5 h-5 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {profile?.role === 'owner' && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingTeam(t); setShowNewTeam(true); }}
                      className="p-2 hover:bg-white/5 rounded-lg text-[#707070] hover:text-white transition-colors"
                    >
                      <Settings2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteTeam(t.id); }}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-[#707070] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-[#f0f0f0] mb-1">{t.name}</h3>
              <p className="text-sm text-[#707070] mb-6 line-clamp-2">{t.description || 'Sin descripción'}</p>

              <div className="flex items-center justify-between pt-6 border-t border-[#1c1c1c]">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0c0c0c] bg-[#1c1c1c] flex items-center justify-center text-[10px] font-bold text-[#707070]">
                      U{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-[#0c0c0c] bg-[#0c0c0c] flex items-center justify-center text-[10px] font-bold text-[rgb(var(--primary))]">
                    +5
                  </div>
                </div>
                <button className="text-xs font-bold text-[rgb(var(--primary))] hover:underline flex items-center gap-1 group/link">
                  Ver equipo <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {(showNewTeam || editingTeam) && (
        <TeamDrawer
          team={editingTeam}
          isOpen={showNewTeam || !!editingTeam}
          onClose={() => { setShowNewTeam(false); setEditingTeam(null); }}
          onSave={async () => {
            const { data } = await supabase.from('teams').select('*').eq('organization_id', profile.organization_id).order('name')
            setTeams(data || [])
            setShowNewTeam(false)
            setEditingTeam(null)
          }}
        />
      )}
    </div>
  )
}
