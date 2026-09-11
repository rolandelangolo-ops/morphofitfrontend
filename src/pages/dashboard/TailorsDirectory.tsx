import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api } from '../../api'
import { Card, PillButton } from '../../components/ui/primitives'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { useToast } from '../../components/ui/Toast'

// Real tailor fields only, as returned by GET /appointments/tailors — no
// fabricated ratings/reviews/portfolio/pricing. This used to cycle real
// tailor accounts through a 4-entry hardcoded showcase array (fake ratings,
// review counts, portfolio images, specialties, availability, and starting
// prices attached to real tailors, with orders created using that fabricated
// price) — dropped in favor of showing only what the platform actually
// knows about a tailor.
export interface TailorProfile {
  id: string
  name: string
  city?: string
  avatarUrl?: string
  bio: string
  morphology?: string
}

export default function TailorsDirectory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { show } = useToast()

  const [tailors, setTailors] = useState<TailorProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTailors = () => {
    setLoading(true)
    setError(null)
    api.appointments
      .tailors()
      .then((realTailors) => {
        setTailors(
          realTailors.map((rt) => ({
            id: String(rt.id),
            name: rt.name,
            city: rt.city,
            avatarUrl: rt.avatarUrl,
            bio: rt.bio || 'No atelier bio provided yet.',
            morphology: rt.morphology,
          }))
        )
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load the tailor directory'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTailors()
  }, [])

  const filteredTailors = tailors.filter((t) => {
    const q = searchQuery.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      (t.city || '').toLowerCase().includes(q)
    )
  })

  const handleStartChatWithTailor = async (tailor: TailorProfile) => {
    try {
      const conv = await api.messaging.createConversation(tailor.id)
      navigate(`/dashboard/messages/${conv.id}`)
    } catch (err) {
      show({
        title: "Couldn't start conversation",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    }
  }

  const handleStartOrderWithTailor = async (tailor: TailorProfile) => {
    const draft = localStorage.getItem('morphofit_draft_order')
    const parsedDraft = draft ? JSON.parse(draft) : null

    // No price here — a starting price was previously fabricated per
    // showcase entry. Pricing now goes through the same tailor
    // quote/negotiation flow every other order uses (Negotiation Studio on
    // the Orders page) once the tailor responds.
    const orderPayload = {
      tailorId: tailor.id,
      item: parsedDraft?.item || 'Bespoke Garment',
      morphology: parsedDraft?.morphology || user?.morphology || undefined,
      fabric: parsedDraft?.fabric || undefined,
      notes:
        parsedDraft?.notes ||
        `Bespoke custom order created with ${tailor.name}. Awaiting design & price quote.`,
    }

    try {
      await api.client.createOrder(orderPayload)
      show({
        title: 'Order Initiated',
        description: `Started bespoke request with ${tailor.name}. They'll send a quote via Negotiation Studio.`,
        tone: 'success',
      })
      navigate('/dashboard/orders')
    } catch (err) {
      show({
        title: 'Unable to start order',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    }
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <PillButton
        variant="secondary"
        size="sm"
        icon="ruler"
        onClick={() => navigate('/dashboard/measurements')}
      >
        My Metrics
      </PillButton>
      <PillButton
        variant="primary"
        size="sm"
        icon="layers"
        onClick={() => navigate('/dashboard/visualizer')}
      >
        3D Studio
      </PillButton>
    </div>
  )

  return (
    <PageShell
      title="Artisan Tailors & Ateliers"
      subtitle="Discover master artisans and commission bespoke tailoring"
      actions={headerActions}
      loading={loading}
      error={error}
      onRetry={loadTailors}
      empty={
        !error && filteredTailors.length === 0
          ? {
              icon: 'store',
              title: tailors.length === 0 ? 'No tailors on the platform yet' : 'No tailors match your search',
              description: tailors.length === 0 ? 'Check back soon.' : 'Try a different name or city.',
            }
          : undefined
      }
    >
      <div className="space-y-6">
        {/* ── Search Toolbar ───────────────────────────────────────────── */}
        <Card className="p-5 bg-surface">
          <div className="relative max-w-md">
            <AppIcon
              name="search"
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <input
              type="text"
              placeholder="Search by tailor or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-parchment-dark bg-parchment pl-10 pr-4 py-2 text-xs font-body text-ink placeholder:text-ink-subtle focus:border-forest focus:outline-none"
            />
          </div>
        </Card>

        {/* ── Tailors Grid ────────────────────────────────────────────── */}
        {filteredTailors.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredTailors.map((tailor) => (
              <Card
                key={tailor.id}
                className="overflow-hidden flex flex-col justify-between"
                padding="none"
                hover
              >
                <div>
                  {/* Header info */}
                  <div className="flex items-start gap-4 p-5 border-b border-parchment-dark bg-surface">
                    {tailor.avatarUrl ? (
                      <img
                        src={tailor.avatarUrl}
                        alt={tailor.name}
                        className="h-16 w-16 rounded-2xl object-cover border-2 border-parchment-dark shadow-sm"
                      />
                    ) : (
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-parchment-dark bg-parchment font-display text-xl font-bold text-forest shadow-sm">
                        {tailor.name[0]?.toUpperCase()}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold font-display text-ink">
                        {tailor.name}
                      </h3>
                      {tailor.city && (
                        <div className="text-xs font-body text-ink-muted mt-0.5">
                          {tailor.city}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="p-5 bg-surface">
                    <p className="text-xs font-body text-ink-muted leading-relaxed">
                      {tailor.bio}
                    </p>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="flex items-center justify-end gap-2 border-t border-parchment-dark p-5 bg-parchment/60">
                  <button
                    type="button"
                    onClick={() => handleStartChatWithTailor(tailor)}
                    aria-label="Chat with tailor"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-parchment-dark bg-surface text-ink transition-colors hover:bg-parchment active:scale-95"
                  >
                    <AppIcon name="message" size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/appointments')}
                    className="rounded-xl border border-parchment-dark bg-surface px-3 py-2 text-xs font-semibold font-body text-ink transition-colors hover:bg-parchment active:scale-95"
                  >
                    Fitting
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartOrderWithTailor(tailor)}
                    className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-bold font-data uppercase tracking-wider text-white shadow-sm hover:brightness-105 active:scale-95 transition-all"
                  >
                    <AppIcon name="scissors" size={13} />
                    <span>Start Order</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
