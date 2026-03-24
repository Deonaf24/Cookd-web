import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {}
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Initial Session Check
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[AuthContext] Session retrieved:', session ? 'User present' : 'No session')
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('[AuthContext] Initialization error:', error)
      } finally {
        console.log('[AuthContext] Initialization complete, setting loading to false')
        setLoading(false)
      }
    }

    initializeAuth()

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session ? 'User present' : 'No session')
      try {
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          console.log('[AuthContext] No user in state change, clearing profile')
          setProfile(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('[AuthContext] Auth state change error:', error)
      } finally {
        console.log('[AuthContext] State change processing complete')
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    console.log('[AuthContext] Fetching profile for:', userId)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (error) {
        console.warn('[AuthContext] Profile fetch error (may not exist yet):', error)
        throw error
      }
      console.log('[AuthContext] Profile fetched successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('[AuthContext] fetchProfile error:', error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
