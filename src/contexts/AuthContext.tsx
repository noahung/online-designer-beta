import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userType: 'admin' | 'client' | null
  clientData: any | null
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'admin' | 'client' | null>(null)
  const [clientData, setClientData] = useState<any | null>(null)

  // Simple initialization without complex loops
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      console.log('AuthProvider: Simple initialization')
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (session?.user && !error) {
          console.log('AuthProvider: Found existing session for', session.user.email)
          setSession(session)
          setUser(session.user)
          setUserType('admin') // For now, all Supabase users are admins
          setClientData(null)
        } else {
          console.log('AuthProvider: No existing session')
          setSession(null)
          setUser(null)
          setUserType(null)
          setClientData(null)
        }
      } catch (error) {
        console.error('AuthProvider: Init error:', error)
      } finally {
        if (mounted) {
          console.log('AuthProvider: Initialization complete')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Simple auth listener without complex logic
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthProvider: Auth change:', event)
        
        if (!mounted) return
        
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          setUserType('admin')
          setClientData(null)
        } else {
          setSession(null)
          setUser(null)
          setUserType(null)
          setClientData(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Simple signIn called')
    
    try {
      // First, try standard Supabase admin authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (data?.user && !error) {
        console.log('AuthContext: Admin login successful')
        // State will be updated by the auth state listener
        return { data, error }
      }

      // If Supabase auth fails, check if this might be a client login
      console.log('AuthContext: Admin login failed, trying client login')
      const { data: clientRecord } = await supabase
        .from('clients')
        .select('*')
        .eq('client_email', email)
        .eq('client_password_hash', password)
        .maybeSingle()

      if (clientRecord) {
        console.log('AuthContext: Client login successful')
        
        // Create a simple mock user for the client (no complex session handling)
        const mockUser = {
          id: clientRecord.id,
          email: email,
          user_metadata: { client_id: clientRecord.id, is_client: true },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          phone: null,
          confirmation_sent_at: null,
          confirmed_at: null,
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated',
          phone_confirmed_at: null,
          recovery_sent_at: null,
          email_change_sent_at: null,
          new_email: null,
          invited_at: null,
          action_link: null,
          email_change: null,
          phone_change: null,
          phone_change_sent_at: null,
          email_change_confirm_status: 0,
          phone_change_confirm_status: 0,
          banned_until: null,
          deleted_at: null
        } as unknown as User

        // Set the state directly without going through Supabase auth
        setUser(mockUser)
        setSession({
          user: mockUser,
          access_token: `client_token_${clientRecord.id}`,
          refresh_token: '',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer'
        } as Session)
        setUserType('client')
        setClientData(clientRecord)
        setLoading(false)

        return { 
          data: { user: mockUser, session: null }, 
          error: null 
        }
      }

      // If neither admin nor client login works
      console.log('AuthContext: Login failed', error)
      return { data, error }
    } catch (error) {
      console.error('AuthContext: SignIn error:', error)
      return { data: null, error: error as any }
    }
  }

  const signOut = async () => {
    console.log('AuthContext: SignOut called')
    try {
      // Clear local state first
      setUser(null)
      setSession(null)
      setUserType(null)
      setClientData(null)
      
      // Only call Supabase signOut for real Supabase sessions (not client mock sessions)
      if (user && !user.user_metadata?.is_client) {
        await supabase.auth.signOut()
      }
      
      console.log('AuthContext: SignOut completed')
    } catch (error) {
      console.error('AuthContext: SignOut error:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    userType,
    clientData,
    signIn,
    signOut,
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
    console.error('useAuth called outside AuthProvider')
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}