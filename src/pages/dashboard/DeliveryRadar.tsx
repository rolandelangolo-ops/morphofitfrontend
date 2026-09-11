import { useState, useEffect } from 'react'
import { useAuth } from '../../AuthContext'
import { api, type Order } from '../../api'
import { Card, StatusBadge, PillButton } from '../../components/ui/primitives'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { useToast } from '../../components/ui/Toast'

interface DeliveryDispatchItem {
  id: string
  orderId: string
  item: string
  tailorName: string
  tailorAddress: string
  distanceToTailorKm: number
  clientName: string
  clientAddress: string
  distanceToClientKm: number
  payoutAmount: number
  currency: string
  pickupCode: string
  status: 'ready' | 'assigned' | 'out' | 'delivered'
}

export default function DeliveryRadar() {
  const { user } = useAuth()
  const { show } = useToast()

  const [isOnline, setIsOnline] = useState(true)
  const [radarList, setRadarList] = useState<DeliveryDispatchItem[]>([])
  const [activeDispatch, setActiveDispatch] =
    useState<DeliveryDispatchItem | null>(null)
  const [completedToday, setCompletedToday] = useState(0)
  const [pickupCodeInput, setPickupCodeInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(true)

  // Distance-to-pickup/drop-off and per-delivery payout have no backing data
  // anywhere in the app (no geolocation, routing, or courier-earnings system
  // exists) — kept as clearly-labeled simulated placeholders rather than
  // invented per-order values. Names/addresses below now come from the real
  // client/tailor on the order (see deliveryController.orders' populate)
  // instead of a fixed fake atelier/client used for every dispatch.
  const SIMULATED_DISTANCE_TO_TAILOR_KM = 1.0
  const SIMULATED_DISTANCE_TO_CLIENT_KM = 3.0
  const SIMULATED_PAYOUT = 3800

  const toDispatchItem = (o: Order, status: DeliveryDispatchItem['status']): DeliveryDispatchItem => ({
    id: o.id,
    orderId: o.id,
    item: o.item,
    tailorName: o.tailor?.name || 'Tailor (unassigned)',
    tailorAddress: o.tailor?.city || 'Address not on file',
    distanceToTailorKm: SIMULATED_DISTANCE_TO_TAILOR_KM,
    clientName: o.client?.name || 'Client',
    clientAddress: o.client?.city || 'Address not on file',
    distanceToClientKm: SIMULATED_DISTANCE_TO_CLIENT_KM,
    payoutAmount: SIMULATED_PAYOUT,
    currency: o.currency || 'XAF',
    pickupCode: `MF-${o.id.slice(-4).toUpperCase()}`,
    status,
  })

  const fetchRadar = async () => {
    try {
      const orders = await api.delivery.orders()
      const inProgress = orders.find(
        (o) => o.status === 'assigned' || o.status === 'out'
      )
      setActiveDispatch(inProgress ? toDispatchItem(inProgress, inProgress.status as 'assigned' | 'out') : null)
      setRadarList(orders.filter((o) => o.status === 'ready').map((o) => toDispatchItem(o, 'ready')))

      const todayKey = new Date().toDateString()
      setCompletedToday(
        orders.filter((o) => o.status === 'delivered' && new Date(o.updatedAt).toDateString() === todayKey).length
      )
    } catch {
      setRadarList([])
      setActiveDispatch(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'delivery_agent') {
      fetchRadar()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleAcceptDelivery = async (item: DeliveryDispatchItem) => {
    try {
      await api.delivery.updateStatus(item.orderId, 'assigned')
      show({
        title: 'Delivery Mission Accepted!',
        description: `Proceed to ${item.tailorName} (${item.distanceToTailorKm} km away) to collect the garment.`,
        tone: 'success',
      })
      await fetchRadar()
    } catch (err) {
      show({
        title: 'Unable to accept mission',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    }
  }

  const handleConfirmTailorPickup = async () => {
    if (!activeDispatch) return
    if (pickupCodeInput.trim().toUpperCase() !== activeDispatch.pickupCode) {
      show({
        title: 'Invalid Verification Code',
        // No hint here on purpose — the code exists to prove the courier is
        // physically with the tailor, so printing it on a failed attempt
        // would defeat the check. It's shown to the client and tailor on the
        // order's dispatch card instead.
        description: 'Ask the tailor for the pickup code shown on their order.',
        tone: 'error',
      })
      return
    }

    setVerifying(true)
    try {
      await api.delivery.updateStatus(activeDispatch.orderId, 'out')
      setPickupCodeInput('')
      show({
        title: 'Garment Collected from Tailor',
        description:
          'Status updated to Out for Delivery. Client notified of your approach.',
        tone: 'success',
      })
      await fetchRadar()
    } catch (err) {
      show({
        title: 'Pickup verification failed',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleCompleteClientDelivery = async () => {
    if (!activeDispatch) return
    setVerifying(true)

    try {
      await api.delivery.updateStatus(activeDispatch.orderId, 'delivered')
      show({
        title: 'Delivery Completed Successfully!',
        description: `Order marked as delivered. Simulated payout: ${
          activeDispatch.currency
        } ${activeDispatch.payoutAmount.toLocaleString()} (no courier wallet exists yet).`,
        tone: 'success',
      })
      await fetchRadar()
    } catch (err) {
      show({
        title: 'Delivery completion failed',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setVerifying(false)
    }
  }

  const headerActions = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-2xl border border-parchment-dark bg-surface px-3 py-1.5 shadow-2xs">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
          }`}
        />
        <span className="text-xs font-bold font-data">
          {isOnline ? 'DISPATCH ONLINE' : 'OFFLINE'}
        </span>
      </div>
      <PillButton
        variant={isOnline ? 'secondary' : 'primary'}
        size="sm"
        onClick={() => setIsOnline(!isOnline)}
      >
        {isOnline ? 'Go Offline' : 'Go Online'}
      </PillButton>
    </div>
  )

  return (
    <PageShell
      title="Dynamic Delivery Radar"
      subtitle="Smart proximity dispatching connecting master ateliers with doorstep courier routes"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* ── KPI Metrics Grid ─────────────────────────────────────────── */}
        {/* Earnings, Avg Speed, and Rating have no backing system yet (no
            courier wallet, routing, or ratings feature exists) — shown as
            clearly-labeled simulated figures. Completed Trips is real,
            computed from today's delivered orders assigned to this agent. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-4 bg-surface" hover>
            <span className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">
              Today's Earnings <span className="text-ink-subtle/70 normal-case">(simulated)</span>
            </span>
            <div className="mt-1 text-2xl font-bold font-display text-forest">
              18,500 <span className="text-xs font-data">XAF</span>
            </div>
          </Card>
          <Card className="p-4 bg-surface" hover>
            <span className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">
              Completed Trips Today
            </span>
            <div className="mt-1 text-2xl font-bold font-display text-ink">
              {completedToday}
            </div>
          </Card>
          <Card className="p-4 bg-surface" hover>
            <span className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">
              Avg Speed to Client <span className="text-ink-subtle/70 normal-case">(simulated)</span>
            </span>
            <div className="mt-1 text-2xl font-bold font-display text-ink">
              24 <span className="text-xs font-data">min</span>
            </div>
          </Card>
          <Card className="p-4 bg-surface" hover>
            <span className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">
              Courier Rating <span className="text-ink-subtle/70 normal-case">(simulated)</span>
            </span>
            <div className="mt-1 text-2xl font-bold font-display text-amber">
              4.98 ★
            </div>
          </Card>
        </div>

        {/* ── Active Mission Card ──────────────────────────────────────── */}
        {activeDispatch && (
          <Card
            className="overflow-hidden border-2 border-forest bg-surface shadow-md"
            padding="none"
          >
            <div className="flex items-center justify-between border-b border-parchment-dark p-5 bg-parchment/60">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <AppIcon name="truck" size={16} />
                </span>
                <span className="text-base font-bold font-display text-ink">
                  Active Mission: {activeDispatch.item}
                </span>
              </div>
              <StatusBadge status={activeDispatch.status} />
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Point A: Tailor */}
                <div
                  className={`rounded-2xl border p-4 transition-all ${
                    activeDispatch.status === 'assigned'
                      ? 'border-forest bg-forest/5'
                      : 'border-parchment-dark bg-parchment'
                  }`}
                >
                  <span className="block text-[10px] font-bold font-data text-forest uppercase tracking-wider mb-1">
                    Point A: Atelier Pickup
                  </span>
                  <div className="text-sm font-bold font-display text-ink">
                    {activeDispatch.tailorName}
                  </div>
                  <div className="mt-0.5 text-xs font-body text-ink-muted">
                    {activeDispatch.tailorAddress}
                  </div>

                  {activeDispatch.status === 'assigned' ? (
                    <div className="mt-3.5 border-t border-parchment-dark pt-3 space-y-2">
                      <span className="block text-[10px] font-data text-ink-subtle uppercase">
                        Enter Atelier Pickup Code:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. MF-7291"
                          value={pickupCodeInput}
                          onChange={(e) => setPickupCodeInput(e.target.value)}
                          className="rounded-xl border border-parchment-dark bg-surface px-3 py-1.5 text-xs font-data uppercase tracking-wider text-ink focus:border-forest focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleConfirmTailorPickup}
                          disabled={verifying}
                          className="rounded-xl bg-forest px-4 py-1.5 text-xs font-bold font-data text-white shadow-xs hover:brightness-105 transition-all"
                        >
                          {verifying ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs font-bold font-body text-emerald-700 flex items-center gap-1.5">
                      <AppIcon name="check" size={14} />
                      <span>Garment in Custody (Code Verified)</span>
                    </div>
                  )}
                </div>

                {/* Point B: Client */}
                <div
                  className={`rounded-2xl border p-4 transition-all ${
                    activeDispatch.status === 'out'
                      ? 'border-forest bg-forest/5'
                      : 'border-parchment-dark bg-surface'
                  }`}
                >
                  <span className="block text-[10px] font-bold font-data text-ink-subtle uppercase tracking-wider mb-1">
                    Point B: Client Delivery
                  </span>
                  <div className="text-sm font-bold font-display text-ink">
                    {activeDispatch.clientName}
                  </div>
                  <div className="mt-0.5 text-xs font-body text-ink-muted">
                    {activeDispatch.clientAddress}
                  </div>

                  {activeDispatch.status === 'out' && (
                    <div className="mt-3.5 border-t border-parchment-dark pt-3">
                      <button
                        type="button"
                        onClick={handleCompleteClientDelivery}
                        disabled={verifying}
                        className="w-full rounded-xl bg-forest py-2.5 text-xs font-bold font-data uppercase tracking-wider text-white shadow-md hover:brightness-105 active:scale-95 transition-all"
                      >
                        {verifying
                          ? 'Finalizing Escrow Payout...'
                          : 'Confirm Handover & Complete Delivery'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── Available Orders in Radar Radius ─────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-ink tracking-tight">
                Available Missions in Your Radar
              </h3>
              <span className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">
                {radarList.length} Ready Orders in Range
              </span>
            </div>
          </div>

          {!isOnline ? (
            <Card className="p-10 text-center bg-surface">
              <AppIcon
                name="navigation"
                size={36}
                className="mx-auto text-ink-subtle mb-3"
              />
              <h4 className="text-sm font-bold font-display text-ink">
                You are currently Offline
              </h4>
              <p className="mt-1 text-xs font-body text-ink-muted max-w-sm mx-auto">
                Toggle your status to Online above to receive real-time location
                matches from nearby tailors.
              </p>
            </Card>
          ) : radarList.length === 0 ? (
            <Card className="p-10 text-center bg-surface">
              <AppIcon
                name="clock"
                size={36}
                className="mx-auto text-ink-subtle mb-3 animate-pulse"
              />
              <h4 className="text-sm font-bold font-display text-ink">
                Radar Scanning for Next Ready Order...
              </h4>
              <p className="mt-1 text-xs font-body text-ink-muted max-w-sm mx-auto">
                As soon as a local atelier finishes tailoring and marks an order
                "Ready", it will ping your radar immediately.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {radarList.map((item) => (
                <Card
                  key={item.id}
                  className="p-5 flex flex-col justify-between space-y-4 bg-surface"
                  hover
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold font-data text-forest uppercase tracking-wider">
                          ~{item.distanceToTailorKm} km to Atelier (est.)
                        </span>
                        <h4 className="text-base font-bold font-display text-ink mt-0.5">
                          {item.item}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-data text-ink-subtle uppercase">
                          Courier Payout (simulated)
                        </span>
                        <span className="text-base font-bold font-data text-forest">
                          {item.currency} {item.payoutAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-2 rounded-xl bg-parchment p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                        <span className="text-ink font-body">
                          Pickup: <strong>{item.tailorName}</strong> (
                          {item.tailorAddress})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" />
                        <span className="text-ink font-body">
                          Drop-off: <strong>{item.clientName}</strong> (
                          {item.clientAddress})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-parchment-dark pt-3">
                    <span className="text-[10px] font-data text-ink-subtle">
                      Ready for immediate collection
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAcceptDelivery(item)}
                      className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-bold font-data uppercase tracking-wider text-white shadow-xs hover:brightness-105 active:scale-95 transition-all"
                    >
                      <AppIcon name="navigation" size={13} />
                      <span>Accept Mission</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
