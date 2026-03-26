// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser]                 = useState(null)
  const [profile, setProfile]           = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [debugInfo, setDebugInfo]       = useState({})
  const initialised = useRef(false)

  const fetchUserData = async (userId) => {
    const debug = { userId, timestamp: new Date().toISOString() }

    try {
      // Profile fetch
      const profileRes = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      debug.profileError  = profileRes.error?.message || null
      debug.profileStatus = profileRes.status
      debug.profileData   = profileRes.data

      console.log('Profile fetch result:', JSON.stringify(profileRes, null, 2))

      if (profileRes.data) {
        setProfile(profileRes.data)
      } else if (!profileRes.data && !profileRes.error) {
        // Row missing — create it on the fly
        console.warn('Profile row missing — creating now...')
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        const insertRes = await supabase
          .from('profiles')
          .insert({
            id:        userId,
            email:     currentUser?.email || '',
            full_name: currentUser?.user_metadata?.full_name || '',
            role:      'subscriber',
          })
          .select()
          .single()
        debug.insertError = insertRes.error?.message || null
        debug.insertData  = insertRes.data
        console.log('Profile insert result:', JSON.stringify(insertRes, null, 2))
        setProfile(insertRes.data ?? null)
      } else {
        console.error('Profile fetch blocked (likely RLS):', profileRes.error)
        setProfile(null)
      }

      // Subscription fetch
      const subRes = await supabase
        .from('subscriptions')
        .select('*, charities(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      debug.subError = subRes.error?.message || null
      setSubscription(subRes.data ?? null)

    } catch (err) {
      debug.exception = err.message
      console.error('fetchUserData exception:', err)
      setProfile(null)
      setSubscription(null)
    }

    setDebugInfo(debug)
  }

  const initialiseFromSession = async (session) => {
    const currentUser = session?.user ?? null
    setUser(currentUser)
    if (currentUser) {
      await fetchUserData(currentUser.id)
    } else {
      setProfile(null)
      setSubscription(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!initialised.current) {
          initialised.current = true
          await initialiseFromSession(session)
        } else {
          await initialiseFromSession(session)
        }
      }
    )

    const fallbackTimer = setTimeout(async () => {
      if (!initialised.current) {
        initialised.current = true
        const { data: { session } } = await supabase.auth.getSession()
        await initialiseFromSession(session)
      }
    }, 1500)

    return () => {
      clearTimeout(fallbackTimer)
      authListener.unsubscribe()
    }
  }, [])

  const isAdmin      = profile?.role === 'admin'
  const isSubscribed = subscription?.status === 'active'

  const refreshSubscription = async () => {
    if (user) await fetchUserData(user.id)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, subscription, loading,
      isAdmin, isSubscribed, refreshSubscription, debugInfo,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
