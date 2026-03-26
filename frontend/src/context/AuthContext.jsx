// src/context/AuthContext.jsx
// Global auth state — wraps the entire app
// Fixed: race condition between getSession + onAuthStateChange causing stuck loading
// Fixed: fetchUserData must fully resolve before loading=false is set
// Fixed: profile fetch uses maybeSingle() so it never throws on missing row

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser]                 = useState(null)
  const [profile, setProfile]           = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading]           = useState(true)

  // Ref to avoid duplicate initialisation from both getSession + onAuthStateChange
  const initialised = useRef(false)

  // ── Fetch profile + subscription ──────────────────────────────
  // Uses maybeSingle() on profiles so it never throws PGRST116 (no rows)
  const fetchUserData = async (userId) => {
    try {
      const [profileRes, subRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),          // ← was .single(), which throws if no row
        supabase
          .from('subscriptions')
          .select('*, charities(*)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
      ])

      if (profileRes.error) console.error('Profile fetch error:', profileRes.error)
      if (subRes.error)     console.error('Subscription fetch error:', subRes.error)

      setProfile(profileRes.data ?? null)
      setSubscription(subRes.data ?? null)

      // Debug helper — remove after confirming admin works
      console.log('✅ Profile loaded:', profileRes.data)
      console.log('✅ Role:', profileRes.data?.role)
    } catch (err) {
      console.error('fetchUserData unexpected error:', err)
      setProfile(null)
      setSubscription(null)
    }
  }

  // ── Initialise from a session object ─────────────────────────
  // This is the single source of truth for setting all state + loading=false
  const initialiseFromSession = async (session) => {
    const currentUser = session?.user ?? null
    setUser(currentUser)

    if (currentUser) {
      await fetchUserData(currentUser.id)   // ← await ensures profile is set BEFORE loading=false
    } else {
      setProfile(null)
      setSubscription(null)
    }

    setLoading(false)
  }

  useEffect(() => {
    // ── Step 1: set up the auth listener FIRST ─────────────────
    // onAuthStateChange fires for SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!initialised.current) {
          // First fire — use this to initialise (skip getSession below)
          initialised.current = true
          await initialiseFromSession(session)
        } else {
          // Subsequent fires (logout, token refresh, etc.)
          await initialiseFromSession(session)
        }
      }
    )

    // ── Step 2: getSession as fallback if listener doesn't fire ─
    // In some environments onAuthStateChange doesn't fire on first load
    // so we also call getSession with a short timeout as a safety net
    const fallbackTimer = setTimeout(async () => {
      if (!initialised.current) {
        console.warn('Auth listener did not fire — using getSession fallback')
        initialised.current = true
        const { data: { session } } = await supabase.auth.getSession()
        await initialiseFromSession(session)
      }
    }, 1500)  // 1.5s fallback — if listener fires first this is cancelled

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
      isAdmin, isSubscribed, refreshSubscription,
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
