import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTeam } from '../context/TeamContext'
import { useNavigate } from 'react-router-dom'

export default function Tasks() {
  const { profile, loading: authLoading } = useAuth()
  const { selectedTeamId, teams } = useTeam()
  const navigate = useNavigate()

  if (authLoading) return <div>Cargando Perfil...</div>

  return (
    <div className="p-10 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Debug de Tareas 🔍</h1>
      <pre className="bg-gray-100 p-4 rounded mb-4">
        {JSON.stringify({
          profileId: profile?.id,
          role: profile?.role,
          orgId: profile?.organization_id,
          selectedTeamId,
          teamsCount: teams?.length
        }, null, 2)}
      </pre>
      <button 
        onClick={() => navigate('/dashboard')}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Volver al Dashboard
      </button>
      <div className="mt-8">
        <p>Si ves esto, el componente Tasks está renderizando correctamente.</p>
      </div>
    </div>
  )
}
