import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const TeamContext = createContext({})
export const useTeam = () => useContext(TeamContext)

export function TeamProvider({ children }) {
  const { profile } = useAuth()
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamIdState] = useState(
    () => localStorage.getItem('selectedTeamId') || ''
  )

  function setSelectedTeamId(id) {
    setSelectedTeamIdState(id)
    localStorage.setItem('selectedTeamId', id)
  }

  useEffect(() => {
    if (!profile?.organization_id) {
      setTeams([])
      return
    }
    loadTeams()
  }, [profile])

  async function loadTeams() {
    if (profile?.role === 'owner') {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name')
      setTeams(data || [])
    } else {
      const { data } = await supabase
        .from('team_members')
        .select('teams(id, name)')
        .eq('profile_id', profile.id)
      setTeams(data?.map(m => m.teams).filter(Boolean) || [])
    }
  }

  return (
    <TeamContext.Provider value={{ teams, selectedTeamId, setSelectedTeamId }}>
      {children}
    </TeamContext.Provider>
  )
}
