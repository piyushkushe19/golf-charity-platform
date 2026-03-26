// src/pages/SubscribePage.jsx
// Stripe subscription checkout — monthly & yearly plans

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loadStripe } from '@stripe/stripe-js'
import { CheckCircle, Trophy, Zap, Star } from 'lucide-react'
import toast from 'react-hot-toast'

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 9.99,
    period: '/month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
    description: 'Perfect for trying it out. Cancel anytime.',
    badge: null,
    icon: Zap,
    poolContribution: 7.99,  // ~80% to pool after charity
    charityMin: 1.00,        // 10%
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: 99.99,
    period: '/year',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
    description: 'Best value — save over £19 per year.',
    badge: 'Best Value',
    icon: Star,
    poolContribution: 79.99,
    charityMin: 10.00,
  },
]

const features = [
  'Score tracking with rolling 5-score logic',
  'Monthly draw entries (3, 4 & 5 number match)',
  'Charity contribution — choose your cause',
  'Full subscriber dashboard & winnings tracker',
  'Winner proof upload & payout system',
  'Cancel or change plan anytime',
]

export default function SubscribePage() {
  const { user, subscription, refreshSubscription } = useAuth()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [loading, setLoading] = useState(false)

  // If already subscribed, redirect to dashboard
  if (subscription?.status === 'active') {
    navigate('/dashboard')
    return null
  }

  const handleSubscribe = async () => {
    const plan = PLANS.find(p => p.id === selectedPlan)
    if (!plan.stripePriceId) {
      toast.error('Stripe price ID not configured. Check your .env file.')
      return
    }

    setLoading(true)
    try {
      // Call your Stripe checkout session edge function (Supabase Edge Function)
      // The edge function creates a Stripe Checkout session and returns the URL
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          planType: plan.id,
          userId: user.id,
          successUrl: `${window.location.origin}/dashboard?subscribed=true`,
          cancelUrl:  `${window.location.origin}/subscribe`,
        }),
      })

      const { url, error } = await response.json()
      if (error) throw new Error(error)

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err) {
      console.error(err)
      toast.error('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  const plan = PLANS.find(p => p.id === selectedPlan)

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10
                          border border-brand-500/20 text-brand-400 text-xs font-body mb-6">
            <Trophy size={12} /> One step away from playing for good
          </div>
          <h1 className="font-display text-5xl text-white mb-4">Choose your plan</h1>
          <p className="font-body text-white/40 text-lg">
            Every plan includes full access. Pick what works for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Plan selector */}
          <div className="lg:col-span-2 space-y-4">
            {PLANS.map(p => {
              const Icon = p.icon
              const active = selectedPlan === p.id
              return (
                <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                          active
                            ? 'border-brand-500 bg-brand-500/10'
                            : 'border-white/10 bg-dark-800 hover:border-white/20'
                        }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        active ? 'bg-brand-500' : 'bg-white/5'
                      }`}>
                        <Icon size={18} className={active ? 'text-white' : 'text-white/40'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xl text-white">{p.label}</span>
                          {p.badge && (
                            <span className="text-xs font-body bg-gold-500 text-dark-900 px-2 py-0.5 rounded-full font-medium">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="font-body text-sm text-white/40 mt-0.5">{p.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-2xl text-white font-bold">£{p.price}</div>
                      <div className="text-xs font-body text-white/40">{p.period}</div>
                    </div>
                  </div>

                  {active && (
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-body">
                      <div className="text-white/40">→ Pool contribution: <span className="text-brand-400">£{p.poolContribution.toFixed(2)}</span></div>
                      <div className="text-white/40">→ Min. charity: <span className="text-pink-400">£{p.charityMin.toFixed(2)}</span></div>
                    </div>
                  )}
                </button>
              )
            })}

            {/* Features list */}
            <div className="card-glow p-6">
              <h3 className="font-display text-lg text-white mb-4">Everything included</h3>
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 font-body text-sm text-white/60">
                    <CheckCircle size={15} className="text-brand-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Checkout summary */}
          <div className="lg:col-span-1">
            <div className="card-glow p-6 sticky top-24">
              <h3 className="font-display text-xl text-white mb-6">Order summary</h3>

              <div className="space-y-3 mb-6 text-sm font-body">
                <div className="flex justify-between text-white/60">
                  <span>Plan</span>
                  <span className="text-white capitalize">{plan.label}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Prize pool contribution</span>
                  <span className="text-brand-400">£{plan.poolContribution.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Min. charity (10%)</span>
                  <span className="text-pink-400">£{plan.charityMin.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-medium text-white">
                  <span>Total</span>
                  <span>£{plan.price}{plan.period}</span>
                </div>
              </div>

              <button onClick={handleSubscribe} disabled={loading}
                      className="btn-primary w-full justify-center py-4 text-base">
                {loading ? 'Redirecting…' : `Subscribe — £${plan.price}${plan.period}`}
              </button>

              <div className="mt-4 space-y-2 text-xs font-body text-white/30 text-center">
                <p>🔒 Secured by Stripe — we never store your card details</p>
                <p>Cancel anytime from your dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}