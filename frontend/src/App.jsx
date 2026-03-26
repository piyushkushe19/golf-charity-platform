// src/App.jsx
import { Component } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'

// Pages
import HomePage       from './pages/HomePage'
import CharitiesPage  from './pages/CharitiesPage'
import CharityDetail  from './pages/CharityDetail'
import DrawsPage      from './pages/DrawsPage'
import HowItWorksPage from './pages/HowItWorksPage'
import LoginPage      from './pages/LoginPage'
import SignupPage     from './pages/SignupPage'
import SubscribePage  from './pages/SubscribePage'

// Dashboard pages
import DashboardPage  from './pages/dashboard/DashboardPage'
import ScoresPage     from './pages/dashboard/ScoresPage'
import MyDrawsPage    from './pages/dashboard/MyDrawsPage'
import MyCharityPage  from './pages/dashboard/MyCharityPage'
import WinningsPage   from './pages/dashboard/WinningsPage'

// Admin pages
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

// ── Error boundary — catches render errors so the screen isn't blank ──
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('App render error:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
          <div className="max-w-lg text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="font-display text-2xl text-white mb-3">Something went wrong</h1>
            <p className="font-body text-white/50 text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <p className="font-body text-white/30 text-xs mb-6">
              Most common cause: missing <code className="text-brand-400">.env</code> file.<br />
              Copy <code className="text-brand-400">.env.example</code> → <code className="text-brand-400">.env</code> and fill in your Supabase credentials.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary"
            >
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

// Guard: must be logged in
const RequireAuth = () => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

// Guard: must be logged in AND have active subscription
const RequireSubscription = () => {
  const { user, isSubscribed, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isSubscribed) return <Navigate to="/subscribe" replace />
  return <Layout />
}

// Guard: must be admin
// Shows a clear error message if logged in but not admin, instead of redirecting
const RequireAdmin = () => {
  const { user, profile, isAdmin, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) return <Navigate to="/login" replace />

  // User is logged in but profile hasn't loaded yet (shouldn't happen, but safety net)
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center card-glow p-8">
          <div className="text-4xl mb-4">🔄</div>
          <h2 className="font-display text-xl text-white mb-3">Loading your profile…</h2>
          <p className="font-body text-sm text-white/50 mb-4">
            If this persists, your profile row may be missing from the database.
          </p>
          <p className="font-mono text-xs text-white/30 bg-white/5 p-3 rounded-lg text-left">
            Run in Supabase SQL Editor:<br />
            SELECT * FROM profiles WHERE id = '{user.id}';
          </p>
        </div>
      </div>
    )
  }

  // Profile loaded but role is not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center card-glow p-8">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="font-display text-xl text-white mb-3">Not an admin</h2>
          <p className="font-body text-sm text-white/50 mb-4">
            Your account <span className="text-brand-400">{user.email}</span> has role:{' '}
            <span className="font-mono text-gold-400">"{profile?.role || 'unknown'}"</span>
          </p>
          <p className="font-body text-xs text-white/30 mb-6">
            To fix: run this in Supabase SQL Editor:
          </p>
          <pre className="font-mono text-xs text-brand-400 bg-dark-700 p-3 rounded-lg text-left mb-6 overflow-x-auto">
{`UPDATE public.profiles 
SET role = 'admin' 
WHERE email = '${user.email}';`}
          </pre>
          <p className="font-body text-xs text-white/30 mb-4">
            Then sign out and sign back in for the change to take effect.
          </p>
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
        {/* ── Public routes (always use Layout shell) ── */}
        <Route element={<Layout />}>
          <Route path="/"               element={<HomePage />} />
          <Route path="/charities"      element={<CharitiesPage />} />
          <Route path="/charities/:slug" element={<CharityDetail />} />
          <Route path="/draws"          element={<DrawsPage />} />
          <Route path="/how-it-works"   element={<HowItWorksPage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/signup"         element={<SignupPage />} />
        </Route>

        {/* Subscribe page — needs auth but NOT subscription */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/subscribe" element={<SubscribePage />} />
          </Route>
        </Route>

        {/* ── Subscriber dashboard ── */}
        <Route path="/dashboard" element={<RequireSubscription />}>
          <Route index           element={<DashboardPage />} />
          <Route path="scores"   element={<ScoresPage />} />
          <Route path="draws"    element={<MyDrawsPage />} />
          <Route path="charity"  element={<MyCharityPage />} />
          <Route path="winnings" element={<WinningsPage />} />
        </Route>

        {/* ── Admin panel ── */}
        <Route path="/admin" element={<RequireAdmin />}>
          <Route index            element={<AdminDashboard />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="draws"     element={<AdminDraws />} />
          <Route path="charities" element={<AdminCharities />} />
          <Route path="winners"   element={<AdminWinners />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
