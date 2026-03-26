// src/App.jsx
import { Component } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'

import HomePage       from './pages/HomePage'
import CharitiesPage  from './pages/CharitiesPage'
import CharityDetail  from './pages/CharityDetail'
import DrawsPage      from './pages/DrawsPage'
import HowItWorksPage from './pages/HowItWorksPage'
import LoginPage      from './pages/LoginPage'
import SignupPage     from './pages/SignupPage'
import SubscribePage  from './pages/SubscribePage'

import DashboardPage  from './pages/dashboard/DashboardPage'
import ScoresPage     from './pages/dashboard/ScoresPage'
import MyDrawsPage    from './pages/dashboard/MyDrawsPage'
import MyCharityPage  from './pages/dashboard/MyCharityPage'
import WinningsPage   from './pages/dashboard/WinningsPage'

import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminUsers      from './pages/admin/AdminUsers'
import AdminDraws      from './pages/admin/AdminDraws'
import AdminCharities  from './pages/admin/AdminCharities'
import AdminWinners    from './pages/admin/AdminWinners'

// ── Loading screen ────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <p className="text-white/50 font-body text-sm">Loading…</p>
    </div>
  </div>
)

// ── Error boundary ────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('App render error:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
          <div className="max-w-lg text-center card-glow p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="font-display text-2xl text-white mb-3">Something went wrong</h1>
            <p className="font-mono text-sm text-red-400 bg-red-500/10 p-3 rounded-lg mb-4">
              {this.state.error?.message}
            </p>
            <button onClick={() => this.setState({ hasError: false })} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Route guards ──────────────────────────────────────────────
const RequireAuth = () => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

const RequireSubscription = () => {
  const { user, isSubscribed, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isSubscribed) return <Navigate to="/subscribe" replace />
  return <Layout />
}

// Admin guard — shows full debug info instead of spinning forever
const RequireAdmin = () => {
  const { user, profile, isAdmin, loading, debugInfo } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) return <Navigate to="/login" replace />

  // Profile is null — show debug panel with everything we know
  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="card-glow p-8">
            <div className="text-3xl mb-4">🔍 Debug: Profile not loading</div>
            <p className="font-body text-white/60 text-sm mb-6">
              You are logged in as <span className="text-brand-400 font-mono">{user.email}</span> (ID: <span className="font-mono text-white/60 text-xs">{user.id}</span>) but the profile row could not be read.
            </p>

            {/* Debug info */}
            <div className="bg-dark-700 rounded-xl p-4 mb-6 text-xs font-mono overflow-x-auto">
              <div className="text-white/40 mb-2">Debug info:</div>
              <pre className="text-green-400 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-white font-body font-medium mb-2">Step 1 — Run this in Supabase SQL Editor:</p>
                <pre className="bg-dark-700 text-brand-400 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">{`-- Check if your profile row exists:
SELECT * FROM public.profiles WHERE id = '${user.id}';

-- If no rows returned, insert it:
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('${user.id}', '${user.email}', 'Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Confirm it worked:
SELECT id, email, role FROM public.profiles WHERE id = '${user.id}';`}
                </pre>
              </div>

              <div>
                <p className="text-white font-body font-medium mb-2">Step 2 — Disable RLS on profiles (for dev):</p>
                <pre className="bg-dark-700 text-brand-400 text-xs p-4 rounded-xl overflow-x-auto">{`ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;`}
                </pre>
              </div>

              <div>
                <p className="text-white font-body font-medium mb-2">Step 3 — After running SQL, click here:</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary w-full justify-center"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Profile loaded but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-lg card-glow p-8 text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="font-display text-xl text-white mb-3">Not an admin</h2>
          <p className="font-body text-sm text-white/50 mb-4">
            Logged in as <span className="text-brand-400">{user.email}</span><br/>
            Current role: <span className="font-mono text-gold-400">"{profile?.role}"</span>
          </p>
          <pre className="bg-dark-700 text-brand-400 text-xs p-4 rounded-xl text-left mb-6 overflow-x-auto">{`UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '${user.id}';`}
          </pre>
          <p className="text-xs text-white/30 mb-4">Run the above in Supabase SQL Editor, then sign out and back in.</p>
          <a href="/" className="btn-secondary text-sm">← Back to Home</a>
        </div>
      </div>
    )
  }

  return <AdminLayout />
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                element={<HomePage />} />
          <Route path="/charities"       element={<CharitiesPage />} />
          <Route path="/charities/:slug" element={<CharityDetail />} />
          <Route path="/draws"           element={<DrawsPage />} />
          <Route path="/how-it-works"    element={<HowItWorksPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/subscribe" element={<SubscribePage />} />
          </Route>
        </Route>

        <Route path="/dashboard" element={<RequireSubscription />}>
          <Route index           element={<DashboardPage />} />
          <Route path="scores"   element={<ScoresPage />} />
          <Route path="draws"    element={<MyDrawsPage />} />
          <Route path="charity"  element={<MyCharityPage />} />
          <Route path="winnings" element={<WinningsPage />} />
        </Route>

        <Route path="/admin" element={<RequireAdmin />}>
          <Route index            element={<AdminDashboard />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="draws"     element={<AdminDraws />} />
          <Route path="charities" element={<AdminCharities />} />
          <Route path="winners"   element={<AdminWinners />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
