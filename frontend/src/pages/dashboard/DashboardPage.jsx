// src/pages/dashboard/DashboardPage.jsx
// Main subscriber dashboard — shows all key modules at a glance

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getScores, getUserDrawEntries, getMyVerifications } from '../../lib/supabase'
import { Trophy, Heart, Target, Award, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
  <Link to={to} className="card-glow p-5 group flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-body text-white/40 uppercase tracking-wide mb-1">{label}</div>
      <div className="font-display text-2xl text-white">{value}</div>
      {sub && <div className="text-xs font-body text-white/30 mt-0.5">{sub}</div>}
    </div>
    <ArrowRight size={14} className="text-white/20 group-hover:text-brand-400 transition-colors mt-1 shrink-0" />
  </Link>
)

export default function DashboardPage() {
  const { user, profile, subscription } = useAuth()
  const [scores, setScores]       = useState([])
  const [entries, setEntries]     = useState([])
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading]     = useState(true)
  const [params]                  = useSearchParams()

  useEffect(() => {
    // Show welcome toast on successful subscribe redirect
    if (params.get('subscribed') === 'true') {
      toast.success('🎉 Subscription activated! Welcome to ParScore.')
    }
  }, [])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getScores(user.id),
      getUserDrawEntries(user.id),
      getMyVerifications(user.id),
    ]).then(([{ data: sc }, { data: en }, { data: ve }]) => {
      setScores(sc || [])
      setEntries(en || [])
      setVerifications(ve || [])
      setLoading(false)
    })
  }, [user])

  const totalWon   = verifications.filter(v => v.payout_status === 'paid')
                                  .reduce((sum, v) => sum + (v.draw_entries?.prize_amount || 0), 0)
  const pendingPay = verifications.filter(v => v.status === 'approved' && v.payout_status === 'pending').length
  const nextDraw   = entries.find(e => e.draw_periods?.status === 'pending')

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="font-display text-4xl text-white mb-1">
          Hello, {profile?.full_name?.split(' ')[0] || 'Golfer'} 👋
        </h1>
        <p className="font-body text-white/40">Here's your ParScore overview</p>
      </div>

      {/* Subscription status banner */}
      {subscription ? (
        <div className="flex items-center gap-3 p-4 mb-8 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <CheckCircle size={18} className="text-brand-400 shrink-0" />
          <div className="font-body text-sm">
            <span className="text-brand-400 font-medium capitalize">{subscription.plan_type} plan active</span>
            <span className="text-white/40 ml-2">
              · Renews {subscription.current_period_end
                ? format(new Date(subscription.current_period_end), 'dd MMM yyyy')
                : 'automatically'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 mb-8 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div className="font-body text-sm text-white/70">
            No active subscription.{' '}
            <Link to="/subscribe" className="text-brand-400 hover:underline">Subscribe now →</Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Target}  label="Scores logged" value={scores.length} sub="of 5 max"
                  color="bg-brand-600"  to="/dashboard/scores" />
        <StatCard icon={Trophy}  label="Draws entered" value={entries.length}
                  sub={nextDraw ? 'Next draw pending' : 'No upcoming draw'}
                  color="bg-gold-600"   to="/dashboard/draws" />
        <StatCard icon={Heart}   label="Charity"
                  value={subscription?.charities?.name || '—'}
                  sub={subscription ? `${subscription.charity_percentage}% of subscription` : 'Select a charity'}
                  color="bg-pink-600"   to="/dashboard/charity" />
        <StatCard icon={Award}   label="Total won"
                  value={`£${totalWon.toFixed(2)}`}
                  sub={pendingPay > 0 ? `${pendingPay} payout pending` : 'All clear'}
                  color="bg-purple-600" to="/dashboard/winnings" />
      </div>

      {/* Recent scores */}
      <div className="card-glow p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-white">Your last 5 scores</h2>
          <Link to="/dashboard/scores" className="text-xs font-body text-brand-400 hover:underline flex items-center gap-1">
            Manage <ArrowRight size={12} />
          </Link>
        </div>
        {scores.length === 0 ? (
          <div className="text-center py-8 text-white/30 font-body text-sm">
            No scores logged yet.{' '}
            <Link to="/dashboard/scores" className="text-brand-400 hover:underline">Add your first score →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {scores.map((score, i) => (
              <div key={score.id}
                   className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/30 w-4">{i + 1}</span>
                  <span className="font-mono font-bold text-xl text-white">{score.score}</span>
                  <span className="text-xs font-body text-white/30">pts</span>
                </div>
                <span className="text-xs font-body text-white/40">
                  {format(new Date(score.score_date), 'dd MMM yyyy')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent draws */}
      <div className="card-glow p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-white">Recent draw results</h2>
          <Link to="/dashboard/draws" className="text-xs font-body text-brand-400 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-white/30 font-body text-sm">
            No draw history yet. You'll be entered automatically once your scores are logged.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 3).map(entry => (
              <div key={entry.id}
                   className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 border border-white/5">
                <div>
                  <div className="font-body text-sm text-white">{entry.draw_periods?.period_label}</div>
                  <div className="text-xs font-body text-white/30 mt-0.5">
                    Matched {entry.matched_count || 0} of 5 numbers
                  </div>
                </div>
                <div className="text-right">
                  {entry.match_type && entry.match_type !== 'no_match' ? (
                    <div>
                      <span className={`prize-badge-${entry.match_type === '5_match' ? '5' : entry.match_type === '4_match' ? '4' : '3'}`}>
                        {entry.match_type.replace('_', ' ')}
                      </span>
                      <div className="text-xs font-mono text-brand-400 mt-1">£{entry.prize_amount?.toFixed(2)}</div>
                    </div>
                  ) : (
                    <span className="text-xs font-body text-white/30">No match</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
