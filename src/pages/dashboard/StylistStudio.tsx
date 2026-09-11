import { useState, useEffect } from 'react'
import { useAuth } from '../../AuthContext'
import { api } from '../../api'
import { Card, PillButton } from '../../components/ui/primitives'
import { Input } from '../../components/ui/Input'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { MasterDetail } from '../../components/ui/MasterDetail'
import { useToast } from '../../components/ui/Toast'

interface ClientStylingRequest {
  id: string
  name: string
  email: string
  avatarUrl?: string
  morphology: string
  height: number | null
  measurements: {
    shoulder: number
    chest: number
    waist: number
    hip: number
    inseam: number
  } | null
  scannedAt: string
  notes: string
}

export default function StylistStudio() {
  const { user } = useAuth()
  const { show } = useToast()

  const [clients, setClients] = useState<ClientStylingRequest[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientStylingRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const [recommendedCut, setRecommendedCut] = useState(
    'Architectural Wrap Midi Dress'
  )
  const [fabricSuggestion, setFabricSuggestion] = useState(
    'Silk Satin Charmeuse with Organza Facings'
  )
  const [tailorDirectives, setTailorDirectives] = useState(
    'Raise back neckline by 2.5cm. Keep waist cinch natural without stiff boning. Include 4cm seam allowance at hip line for fluid movement.'
  )
  const [colorPalette, setColorPalette] = useState(
    'Emerald Forest & Brushed Champagne'
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.stylist
      .clients()
      .then((data) => {
        if (data && data.length > 0) {
          const mapped: ClientStylingRequest[] = data.map((c) => ({
            id: String(c.id),
            name: c.name,
            email: c.email,
            avatarUrl: c.avatarUrl,
            morphology: c.morphology || c.measurements?.morphology || 'Unclassified',
            height: c.measurements?.height ?? null,
            // Real measurements only — no fabricated fallback numbers. A
            // client the stylist hasn't calibrated yet shows as such below
            // instead of silently rendering someone else's placeholder body.
            measurements: c.measurements
              ? {
                  shoulder: c.measurements.shoulder,
                  chest: c.measurements.chest,
                  waist: c.measurements.waist,
                  hip: c.measurements.hip,
                  inseam: c.measurements.inseam,
                }
              : null,
            scannedAt: c.measurements?.scannedAt
              ? new Date(c.measurements.scannedAt).toLocaleDateString()
              : 'Not scanned yet',
            notes: 'Awaiting bespoke silhouette and fabric recommendation.',
          }))
          setClients(mapped)
          setSelectedClient(mapped[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return
    setSubmitting(true)

    try {
      const conv = await api.messaging.createConversation(selectedClient.id)
      const proposalText = `✂️ [Haute Couture Styling Brief]\n• Recommended Cut: ${recommendedCut}\n• Curated Textile: ${fabricSuggestion}\n• Color Palette: ${colorPalette}\n• Tailor Directives: ${tailorDirectives}`
      await api.messaging.sendMessage(conv.id, { text: proposalText })

      show({
        title: 'Design Direction Dispatched!',
        description: `Styling brief sent to ${selectedClient.name} via atelier messaging.`,
        tone: 'success',
      })
    } catch (err) {
      show({
        title: "Couldn't dispatch design direction",
        description: err instanceof Error ? err.message : `The brief was not sent to ${selectedClient.name} — please try again.`,
        tone: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Master Panel (Clients Queue) ───────────────────────────────────────
  const masterContent = (
    <div className="space-y-4">
      <Card className="overflow-hidden" padding="none">
        <div className="border-b border-parchment-dark px-5 py-3.5 bg-surface">
          <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
            {clients.length} Clients Awaiting Direction
          </span>
        </div>

        <div className="divide-y divide-parchment-dark">
          {clients.map((c) => {
            const active = selectedClient?.id === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClient(c)}
                className={`flex w-full items-start gap-3.5 p-4 text-left transition-colors ${
                  active
                    ? 'bg-parchment/80 border-l-4 border-forest shadow-2xs'
                    : 'hover:bg-parchment/50'
                }`}
              >
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="h-10 w-10 rounded-full object-cover border border-parchment-dark shrink-0"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-parchment-dark bg-parchment font-display text-sm font-bold text-forest">
                    {c.name[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-bold font-display text-ink">
                      {c.name}
                    </span>
                    <span className="text-[9px] font-data uppercase font-bold text-forest shrink-0">
                      {c.morphology}
                    </span>
                  </div>
                  <div className="text-[11px] font-body text-ink-muted truncate">
                    {c.email}
                  </div>
                  <div className="text-[9px] font-data text-ink-subtle mt-1">
                    Scanned: {c.scannedAt}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Selected Client Anatomical Metrics Widget */}
      {selectedClient && (
        <Card className="p-5 space-y-3 bg-surface">
          <div className="flex items-center justify-between border-b border-parchment-dark pb-2">
            <span className="text-xs font-bold font-display text-ink">
              Anatomical Metrics
            </span>
            {selectedClient.height != null && (
              <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[9px] font-bold font-data text-forest">
                {selectedClient.height} cm stature
              </span>
            )}
          </div>

          {selectedClient.measurements ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-parchment p-2.5">
                <span className="block text-[9px] font-data text-ink-subtle uppercase">
                  Shoulder
                </span>
                <span className="font-bold font-data text-ink">
                  {selectedClient.measurements.shoulder} cm
                </span>
              </div>
              <div className="rounded-xl bg-parchment p-2.5">
                <span className="block text-[9px] font-data text-ink-subtle uppercase">
                  Bust / Chest
                </span>
                <span className="font-bold font-data text-ink">
                  {selectedClient.measurements.chest} cm
                </span>
              </div>
              <div className="rounded-xl bg-parchment p-2.5">
                <span className="block text-[9px] font-data text-ink-subtle uppercase">
                  Waist
                </span>
                <span className="font-bold font-data text-forest">
                  {selectedClient.measurements.waist} cm
                </span>
              </div>
              <div className="rounded-xl bg-parchment p-2.5">
                <span className="block text-[9px] font-data text-ink-subtle uppercase">
                  Hip
                </span>
                <span className="font-bold font-data text-ink">
                  {selectedClient.measurements.hip} cm
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-parchment-dark p-3 text-center text-xs font-body text-ink-subtle">
              No measurements on file yet — this client hasn't completed a body scan.
            </div>
          )}

          <div className="rounded-xl bg-parchment p-3">
            <span className="block mb-1 text-[9px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
              Client Vision
            </span>
            <p className="text-xs font-body text-ink-muted leading-relaxed italic">
              "{selectedClient.notes}"
            </p>
          </div>
        </Card>
      )}
    </div>
  )

  // ── Detail Panel (Proposal Composer) ───────────────────────────────────
  const detailContent = selectedClient ? (
    <Card className="p-6 bg-surface space-y-6">
      <div className="flex items-center justify-between border-b border-parchment-dark pb-4">
        <div>
          <span className="text-[10px] font-data font-semibold text-forest uppercase tracking-wider">
            Stylist Proposal for {selectedClient.name}
          </span>
          <h3 className="text-xl font-bold font-display text-ink tracking-tight mt-0.5">
            Design Direction & Technical Brief
          </h3>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-white shadow-xs">
          <AppIcon name="sparkles" size={18} />
        </span>
      </div>

      <form onSubmit={handleSendProposal} className="space-y-4">
        <Input
          label="Recommended Silhouette / Cut"
          value={recommendedCut}
          onChange={setRecommendedCut}
          required
          icon="sparkles"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Textile & Drape Recommendation"
            value={fabricSuggestion}
            onChange={setFabricSuggestion}
            required
            icon="scissors"
          />
          <Input
            label="Color Palette Harmonization"
            value={colorPalette}
            onChange={setColorPalette}
            required
            icon="tag"
          />
        </div>

        <Input
          label="Technical Tailoring Directives (for the Artisan Tailor)"
          value={tailorDirectives}
          onChange={setTailorDirectives}
          multiline
          rows={4}
          required
          hint="Specify ease allowances, neckline depth, seam placement, and structural padding."
        />

        <div className="border-t border-parchment-dark pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-[10px] font-data text-ink-subtle">
            Dispatches directly to client dashboard & tailor workshop ticket
          </span>

          <PillButton
            type="submit"
            variant="primary"
            loading={submitting}
            icon="send"
          >
            {submitting ? 'Dispatching…' : 'Dispatch Design Direction'}
          </PillButton>
        </div>
      </form>
    </Card>
  ) : null

  return (
    <PageShell
      title="Stylist Direction Studio"
      subtitle="Morphology profile analysis, bespoke garment silhouettes & tailor technical briefs"
      loading={loading}
    >
      <MasterDetail
        masterContent={masterContent}
        detailContent={detailContent}
        hasSelection={Boolean(selectedClient)}
        onBack={() => setSelectedClient(null)}
        backLabel="Back to client queue"
        masterWidth="narrow"
      />
    </PageShell>
  )
}
