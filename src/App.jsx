import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transcripts from './pages/Transcripts'
import Tasks from './pages/Tasks'
import Notifications from './pages/Notifications'
import Teams from './pages/Teams'
import Guide from './pages/Guide'
import GamificationPreview from './pages/GamificationPreview'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  return user ? children : <Navigate to="/" replace />
}

function OwnerRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  if (!user) return <Navigate to="/" replace />
  if (profile?.role !== 'owner' && profile?.role !== 'manager') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>

  if (!user) {
    return (
      <Routes>
        <Route path="/guia" element={<Guide />} />
        <Route path="*" element={
          showRegister
            ? <Register onSwitch={() => setShowRegister(false)} />
            : <Login onSwitch={() => setShowRegister(true)} />
        } />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/transcripts" element={<OwnerRoute><Transcripts /></OwnerRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/teams" element={<OwnerRoute><Teams /></OwnerRoute>} />
        <Route path="/gamification-preview" element={<GamificationPreview />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
