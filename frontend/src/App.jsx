// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
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
import DashboardPage      from './pages/dashboard/DashboardPage'
import ScoresPage         from './pages/dashboard/ScoresPage'
import MyDrawsPage        from './pages/dashboard/MyDrawsPage'
import MyCharityPage      from './pages/dashboard/MyCharityPage'
import WinningsPage       from './pages/dashboard/WinningsPage'

// Admin pages
import AdminDashboard     from './pages/admin/AdminDashboard'
import AdminUsers         from './pages/admin/AdminUsers'
import AdminDraws         from './pages/admin/AdminDraws'
import AdminCharities     from './pages/admin/AdminCharities'
import AdminWinners       from './pages/admin/AdminWinners'

// Route guards
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" replace />
}

const SubscriberRoute = ({ children }) => {
  const { user, isSubscribed, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isSubscribed) return <Navigate to="/subscribe" replace />
  return children
}

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

const LoadingScreen = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <p className="text-white/50 font-body text-sm">Loading…</p>
    </div>
  </div>
)

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/"            element={<HomePage />} />
        <Route path="/charities"   element={<CharitiesPage />} />
        <Route path="/charities/:slug" element={<CharityDetail />} />
        <Route path="/draws"       element={<DrawsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/signup"      element={<SignupPage />} />
        <Route path="/subscribe"   element={<PrivateRoute><SubscribePage /></PrivateRoute>} />
      </Route>

      {/* Subscriber dashboard */}
      <Route path="/dashboard" element={<SubscriberRoute><Layout /></SubscriberRoute>}>
        <Route index           element={<DashboardPage />} />
        <Route path="scores"   element={<ScoresPage />} />
        <Route path="draws"    element={<MyDrawsPage />} />
        <Route path="charity"  element={<MyCharityPage />} />
        <Route path="winnings" element={<WinningsPage />} />
      </Route>

      {/* Admin panel */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index            element={<AdminDashboard />} />
        <Route path="users"     element={<AdminUsers />} />
        <Route path="draws"     element={<AdminDraws />} />
        <Route path="charities" element={<AdminCharities />} />
        <Route path="winners"   element={<AdminWinners />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}