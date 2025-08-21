// Backup of current AuthContext
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'client'

export interface UserProfile {
  id: string
  user_id: string
  role: UserRole
  client_id?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  isAdmin: boolean
  isClient: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle to handle no results gracefully
      
      if (error) {
        console.error('Error fetching user profile:', error)
        // Default to admin role if profile fetch fails
        return {
          id: '',
          user_id: userId,
          role: 'admin',
          created_at: new Date().toISOString()
        }
      }
      
      // If no profile found, create a default admin profile
      if (!data) {
        return {
          id: '',
          user_id: userId,
          role: 'admin',
          created_at: new Date().toISOString()
        }
      }
      
      return data as UserProfile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Always return a default admin profile on error
      return {
        id: '',
        user_id: userId,
        role: 'admin',
        created_at: new Date().toISOString()
      }
    }
  }

  useEffect(() => {
    let isMounted = true

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        try {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id)
            if (isMounted) {
              setUserProfile(profile)
            }
          } else {
            if (isMounted) {
              setUserProfile(null)
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
          if (isMounted) {
            setUserProfile(null)
          }
        }

        if (isMounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserProfile(null)
  }

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === undefined // Default to admin if role is undefined
  const isClient = userProfile?.role === 'client'

  const value = {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signOut,
    isAdmin,
    isClient,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
