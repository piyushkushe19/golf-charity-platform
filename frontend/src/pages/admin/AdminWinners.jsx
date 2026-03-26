// src/pages/admin/AdminWinners.jsx
import { useEffect, useState } from 'react'
import { adminGetPendingVerifications, adminUpdateVerification, supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, DollarSign, Eye } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminWinners() {
  const [verifications, setVerifications] = useState([])
  const [allVerifs, setAllVerifs]         = useState([])
  const [tab, setTab]                     = useState('pending') // pending | all
  const [loading, setLoading]             = useState(true)
  const [actionNote, setActionNote]       = useState({}) // id → note text
  const [proofUrl, setProofUrl]           = useState({}) // id → signed url

  const loadData = async () => {
    const [{ data: pending }, { data: all }] = await Promise.all([
      adminGetPendingVerifications(),
      supabase
        .from('winner_verifications')
        .select('*, profiles(full_name, email), draw_periods(period_label), draw_entries(prize_amount, match_type)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setVerifications(pending || [])
    setAllVerifs(all || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const getProofUrl = async (v) => {
    if (!v.proof_url) return
    if (proofUrl[v.id]) { window.open(proofUrl[v.id], '_blank'); return }
    const { data } = await supabase.storage.from('winner-proofs').createSignedUrl(v.proof_url, 3600)
    if (data?.signedUrl) {
      setProofUrl(p => ({ ...p, [v.id]: data.signedUrl }))
      window.open(data.signedUrl, '_blank')
    }
  }

  const handleReview = async (id, status) => {
    const updates = {
      status,
      admin_notes: actionNote[id] || null,
      reviewed_at: new Date().toISOString(),
    }
    const { error } = await adminUpdateVerification(id, updates)
    if (error) { toast.error(error.message); return }
    toast.success(`Submission ${status}`)
    loadData()
  }

  const handleMarkPaid = async (id) => {
    const { error } = await adminUpdateVerification(id, {
      payout_status: 'paid', payout_date: new Date().toISOString(),
    })
    if (error) { toast.error(error.message); return }
    toast.success('Marked as paid!')
    loadData()
  }

  const displayed = tab === 'pending' ? verifications : allVerifs

  const StatusBadge = ({ status, payout }) => {
    const map = {
      pending:  'bg-orange-500/20 text-orange-400',
      approved: payout === 'paid' ? 'bg-brand-500/20 text-brand-400' : 'bg-gold-500/20 text-gold-400',
      rejected: 'bg-red-500/20 text-red-400',
    }
    const label = status === 'approved' && payout === 'paid' ? 'Paid' : status
    return <span className={`text-xs px-2 py-0.5 rounded-full font-body ${map[status]}`}>{label}</span>
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Winners</h1>
          <p className="font-body text-sm text-white/40">
            {verifications.length} pending verification{verifications.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${
                    tab === 'pending' ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}>
            Pending ({verifications.length})
          </button>
          <button onClick={() => setTab('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${
                    tab === 'all' ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}>
            All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 card-glow animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card-glow p-12 text-center text-white/30 font-body">
          {tab === 'pending' ? 'No pending verifications 🎉' : 'No submissions yet'}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(v => (
            <div key={v.id} className="card-glow p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  {/* User & draw info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-display text-lg text-white">
                        {v.profiles?.full_name || v.profiles?.email}
                      </div>
                      <div className="text-xs font-body text-white/40">{v.profiles?.email}</div>
                    </div>
                    <StatusBadge status={v.status} payout={v.payout_status} />
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs font-body mb-3">
                    <span className="text-white/40">
                      Draw: <span className="text-white">{v.draw_periods?.period_label}</span>
                    </span>
                    <span className="text-white/40">
                      Match: <span className={`prize-badge-${v.draw_entries?.match_type === '5_match' ? '5' : v.draw_entries?.match_type === '4_match' ? '4' : '3'}`}>
                        {v.draw_entries?.match_type?.replace('_', ' ')}
                      </span>
                    </span>
                    <span className="text-white/40">
                      Prize: <span className="text-gold-400 font-mono">£{v.draw_entries?.prize_amount?.toFixed(2)}</span>
                    </span>
                    <span className="text-white/40">
                      Submitted: {format(new Date(v.created_at), 'dd MMM yyyy')}
                    </span>
                  </div>

                  {/* Proof */}
                  {v.proof_url && (
                    <button onClick={() => getProofUrl(v)}
                            className="flex items-center gap-1.5 text-xs font-body text-brand-400 hover:underline mb-3">
                      <Eye size={12} /> View proof: {v.proof_filename || 'screenshot'}
                    </button>
                  )}

                  {v.admin_notes && (
                    <div className="text-xs font-body text-white/40 bg-white/3 p-2 rounded-lg mb-3">
                      Note: {v.admin_notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {v.status === 'pending' && (
                  <div className="shrink-0 flex flex-col gap-2 min-w-[180px]">
                    <input type="text" placeholder="Admin note (optional)"
                           className="input-field text-xs py-2"
                           value={actionNote[v.id] || ''}
                           onChange={e => setActionNote(p => ({ ...p, [v.id]: e.target.value }))} />
                    <button onClick={() => handleReview(v.id, 'approved')}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                                       bg-brand-500/15 text-brand-400 text-sm font-body hover:bg-brand-500/25 transition-colors">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => handleReview(v.id, 'rejected')}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                                       bg-red-500/15 text-red-400 text-sm font-body hover:bg-red-500/25 transition-colors">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}

                {v.status === 'approved' && v.payout_status === 'pending' && (
                  <div className="shrink-0">
                    <button onClick={() => handleMarkPaid(v.id)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold-500/15
                                       text-gold-400 text-sm font-body hover:bg-gold-500/25 transition-colors">
                      <DollarSign size={14} /> Mark Paid
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
