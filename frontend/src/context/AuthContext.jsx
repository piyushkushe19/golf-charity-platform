// src/context/AuthContext.jsx
// Global auth state — wraps the entire app

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser]                 = useState(null)
  const [profile, setProfile]           = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading]           = useState(true)

  // Fetch profile + active subscription for a given user id
  const fetchUserData = async (userId) => {
    try {
      const [{ data: profileData }, { data: subData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase
          .from('subscriptions')
          .select('*, charities(*)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
      ])
      setProfile(profileData ?? null)
      setSubscription(subData ?? null)
    } catch (err) {
      console.error('fetchUserData error:', err)
      setProfile(null)
      setSubscription(null)
    }
  }

  useEffect(() => {
    let mounted = true

    // Initial session check
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          return fetchUserData(session.user.id)
        }
      })
      .catch((err) => {
        console.error('getSession error:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserData(session.user.id)
        } else {
          setProfile(null)
          setSubscription(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      authSub.unsubscribe()
    }
  }, [])

  const isAdmin      = profile?.role === 'admin'
  const isSubscribed = subscription?.status === 'active'

  const refreshSubscription = () => {
    if (user) fetchUserData(user.id)
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
