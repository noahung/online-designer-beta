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

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener')
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed', { event, session })
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('AuthProvider: User found, determining type')
          await determineUserType(session.user)
        } else {
          console.log('AuthProvider: No user, resetting state')
          setUserType(null)
          setClientData(null)
        }
        
        console.log('AuthProvider: Setting loading to false')
        setLoading(false)
      }
    )

    return () => {
      console.log('AuthProvider: Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [])

  const determineUserType = async (user: User) => {
    console.log('AuthProvider: Determining user type for', user.email)
    
    // Check if user is a client first (by looking up their email in clients table)
    const { data: clientRecord, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('client_email', user.email)
      .maybeSingle()  // Use maybeSingle() instead of single()

    console.log('AuthProvider: Client lookup result', { clientRecord, clientError })

    if (clientRecord && !clientError) {
      console.log('AuthProvider: User is a client')
      setUserType('client')
      setClientData(clientRecord)
    } else {
      // Assume user is admin if not found in clients table
      console.log('AuthProvider: User is admin')
      setUserType('admin')
      setClientData(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: signIn called with', { email, password: '***' })
    
    try {
      // First, check if this is a client login by email only
      console.log('AuthContext: Checking for client credentials')
      
      // Debug: Let's see what clients exist (using public access)
      const { data: allClients, error: allClientsError } = await supabase
        .from('clients')
        .select('id, client_email, client_password_hash')
      console.log('AuthContext: All clients query result:', { allClients, allClientsError })
      
      // Try with different query approach - get all clients first then filter
      if (allClients && allClients.length > 0) {
        const matchingClient = allClients.find(client => client.client_email === email)
        console.log('AuthContext: Found matching client:', matchingClient ? 'Yes' : 'No')
        
        if (matchingClient && matchingClient.client_password_hash === password) {
          console.log('AuthContext: Client password verified, getting full client record')
          
          // Get the full client record
          const { data: fullClientRecord } = await supabase
            .from('clients')
            .select('*')
            .eq('id', matchingClient.id)
            .single()
            
          if (fullClientRecord) {
            console.log('AuthContext: Creating client session')
            
            // Create a mock user session for client
            const mockUser = {
              id: fullClientRecord.id,
              email: email,
              user_metadata: { client_id: fullClientRecord.id, is_client: true },
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

            const mockSession = {
              user: mockUser,
              access_token: `client_token_${fullClientRecord.id}`,
              refresh_token: '',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer'
            } as Session

            setSession(mockSession)
            setUser(mockUser)
            setUserType('client')
            setClientData(fullClientRecord)
            setLoading(false)
            
            return { data: { user: mockUser, session: mockSession }, error: null }
          }
        } else {
          console.log('AuthContext: Client password mismatch or no matching client')
        }
      }

      // If no client found, try regular admin login through Supabase
      console.log('AuthContext: No client found, attempting admin login')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (data && !error) {
        console.log('AuthContext: Admin login successful')
      } else {
        console.log('AuthContext: Admin login failed', error)
      }
      
      return { data, error }
    } catch (error) {
      console.error('AuthContext: SignIn error:', error)
      return { data: null, error: error as any }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserType(null)
    setClientData(null)
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