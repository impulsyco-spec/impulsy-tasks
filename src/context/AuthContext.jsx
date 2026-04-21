import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loginOneSignal, logoutOneSignal } from '../lib/onesignal'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)  // Set loading false only after profile is ready
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)  // setLoading(false) will be called inside fetchProfile
      } else {
        setLoading(false)  // No user, no profile fetch needed
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        loginOneSignal(session.user.id)
      } else {
        setProfile(null)
        logoutOneSignal()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
