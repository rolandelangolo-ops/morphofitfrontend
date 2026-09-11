import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { api, type User } from '../../api'
import { Card, PillButton } from '../../components/ui/primitives'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { MasterDetail } from '../../components/ui/MasterDetail'
import { useToast } from '../../components/ui/Toast'

export default function Clients() {
  const navigate = useNavigate()
  const { show } = useToast()
  const [clients, setClients] = useState<User[]>([])
  const [selected, setSelected] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    api.stylist
      .clients()
      .then((data) => {
        setClients(data)
        if (data.length) setSelected(data[0])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load your client roster'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    )
  }, [clients, search])

  const handleStartChat = async (clientId: string) => {
    try {
      const conv = await api.messaging.createConversation(clientId)
      navigate(`/dashboard/messages/${conv.id}`)
    } catch (err) {
      show({
        title: "Couldn't start conversation",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    }
  }

  // ── Master Panel (Client Roster) ───────────────────────────────────────
  const masterContent = (
    <Card className="overflow-hidden" padding="none">
      <div className="border-b border-parchment-dark p-4 bg-surface space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
            {filteredClients.length} of {clients.length} Clients
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <AppIcon
            name="search"
            size={14}
            className="absolute left-3 top-2.5 text-ink-subtle"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client roster..."
            className="w-full rounded-xl border border-parchment-dark bg-parchment pl-8 pr-3 py-1.5 text-xs font-body text-ink placeholder:text-ink-subtle focus:border-forest focus:outline-none"
          />
        </div>
      </div>

      <div className="divide-y divide-parchment-dark max-h-[70dvh] overflow-y-auto">
        {filteredClients.length === 0 ? (
          <div className="p-6 text-center text-xs font-body text-ink-subtle">
            No matching clients found
          </div>
        ) : (
          filteredClients.map((client) => {
            const active = selected?.id === client.id
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelected(client)}
                className={`block w-full p-4 text-left transition-colors ${
                  active
                    ? 'bg-parchment/80 border-l-4 border-forest shadow-2xs'
                    : 'hover:bg-parchment/50'
                }`}
              >
                <div className="truncate text-sm font-semibold font-body text-ink">
                  {client.name}
                </div>
                <div className="mt-0.5 text-xs font-body text-ink-subtle truncate">
                  {client.email}
                </div>
                {client.measurements?.morphology && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-0.5 text-[10px] font-semibold font-data uppercase tracking-wider text-forest">
                    <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                    {client.measurements.morphology}
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>
    </Card>
  )

  // ── Detail Panel (Client Specifications) ───────────────────────────────
  const detailContent = selected ? (
    <div className="space-y-5">
      <Card className="overflow-hidden" padding="none">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-parchment-dark p-6 sm:flex-row sm:items-center bg-surface">
          <div>
            <h2 className="text-xl font-bold font-display text-ink tracking-tight">
              {selected.name}
            </h2>
            <div className="mt-1 text-xs font-body text-ink-subtle">
              {selected.email} • Client Ref: #{selected.id}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PillButton
              variant="secondary"
              size="sm"
              icon="message"
              onClick={() => handleStartChat(selected.id)}
            >
              Message
            </PillButton>
            <PillButton
              variant="primary"
              size="sm"
              icon="sparkles"
              onClick={() => navigate('/dashboard/stylist-studio')}
            >
              Style Studio
            </PillButton>
          </div>
        </div>

        {selected.measurements ? (
          <>
            {/* Morphology Archetype */}
            <div className="border-b border-parchment-dark p-6 bg-parchment/60">
              <span className="block text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest mb-1.5">
                Morphology Archetype
              </span>
              <div className="text-xl font-bold font-display text-forest capitalize">
                {selected.measurements.morphology}
              </div>
              <p className="mt-1 text-xs font-body text-ink-muted">
                Calibrated from dual-photo body keypoints with verified posture balance.
              </p>
            </div>

            {/* Metric grid */}
            <div className="grid grid-cols-2 gap-px bg-parchment-dark sm:grid-cols-4">
              {[
                { label: 'Shoulder', value: `${selected.measurements.shoulder} cm` },
                { label: 'Chest / Bust', value: `${selected.measurements.chest} cm` },
                { label: 'Waist', value: `${selected.measurements.waist} cm` },
                { label: 'Hip', value: `${selected.measurements.hip} cm` },
                { label: 'Inseam', value: `${selected.measurements.inseam} cm` },
                { label: 'Thigh', value: `${selected.measurements.thigh} cm` },
                { label: 'Arm Length', value: `${selected.measurements.armLength} cm` },
                { label: 'Stature Height', value: `${selected.measurements.height} cm` },
              ].map((m) => (
                <div key={m.label} className="bg-surface p-4">
                  <span className="block mb-1 text-[9px] font-data text-ink-subtle uppercase tracking-wider">
                    {m.label}
                  </span>
                  <span className="text-base font-bold font-display text-forest">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-10 text-center text-sm font-body text-ink-muted">
            <AppIcon name="camera" size={32} className="mx-auto mb-2 text-ink-subtle" />
            Client has not completed the dual-photo body scan yet.
          </div>
        )}
      </Card>
    </div>
  ) : null

  return (
    <PageShell
      title="My Clients"
      subtitle="Client morphology profiles, calibrated body measurements, and styling history."
      loading={loading}
      error={error}
      onRetry={load}
    >
      <MasterDetail
        masterContent={masterContent}
        detailContent={detailContent}
        hasSelection={Boolean(selected)}
        onBack={() => setSelected(null)}
        backLabel="Back to client roster"
        masterWidth="narrow"
      />
    </PageShell>
  )
}
