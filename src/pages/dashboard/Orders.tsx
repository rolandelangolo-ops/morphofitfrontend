import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../AuthContext'
import { getSocket } from '../../socket'
import { api, type AppNotification, type Order } from '../../api'
import { Card, StatusBadge, PillButton } from '../../components/ui/primitives'
import { Chip } from '../../components/ui/Chip'
import { useToast } from '../../components/ui/Toast'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { MasterDetail } from '../../components/ui/MasterDetail'
import NegotiationModal from '../../components/orders/NegotiationModal'
import PaymentModal from '../../components/orders/PaymentModal'

const STATUS_STEPS = [
  'pending',
  'negotiating',
  'confirmed',
  'production',
  'ready',
  'assigned',
  'out',
  'delivered',
]

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed (Escrow Paid)',
  production: 'In Production',
  ready: 'Ready for Pickup',
  assigned: 'Courier Assigned',
  out: 'Out for Delivery',
  delivered: 'Delivered',
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending:
    'Bespoke order created with 3D garment specs and morphology measurements.',
  negotiating:
    'Client and Tailor are actively discussing design, fabric drape, and itemized price.',
  confirmed:
    'Quote accepted! Funds safely deposited into MorphoFit Escrow protection.',
  production:
    'Master Tailor is drafting patterns, cutting cloth, and hand-canvassing.',
  ready:
    'Garment tailored and inspected. Smart dynamic delivery matching nearest courier.',
  assigned:
    'Nearest courier dispatched and en route to tailor atelier for pickup.',
  out:
    'Garment collected with verified pickup code. En route to client doorstep.',
  delivered:
    'Handed over to client. Escrow payout unlocked to artisan tailor and courier.',
}

import { useNavigate } from 'react-router'

export default function Orders() {
  const { user } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [updating, setUpdating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  const reloadOrders = async () => {
    if (!user) return
    try {
      let data: Order[] = []
      if (user.role === 'client') data = await api.client.orders()
      else if (user.role === 'stylist') data = await api.stylist.orders()
      else if (user.role === 'tailor') data = await api.tailor.orders()
      else if (user.role === 'delivery_agent') data = await api.delivery.orders()
      else data = await api.admin.orders()

      setOrders(data || [])
      setSelected((prev) => {
        if (!data || data.length === 0) return null
        if (!prev) return data[0]
        const found = data.find((o) => o.id === prev.id)
        return found || data[0]
      })
    } catch {
      setOrders([])
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reloadOrders()
    // Only re-fetch when the logged-in user actually changes (login/logout),
    // not on every AuthContext.updateUser() patch (avatar upload, settings
    // save, etc.) which produces a new `user` object with the same id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Orders (status, price, negotiation counter-offers) can change from the
  // OTHER party's side at any time — reload whenever that happens instead of
  // requiring a manual refresh. `order_status_changed` is pushed to this
  // user's own socket room automatically (see notify() in the backend), so
  // this is reliable regardless of which order is currently selected.
  useEffect(() => {
    const socket = getSocket()
    const onNotification = (n: AppNotification) => {
      if (n.type === 'order_status_changed') reloadOrders()
    }
    socket.on('notification:new', onNotification)
    return () => {
      socket.off('notification:new', onNotification)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.item.toLowerCase().includes(search.toLowerCase()) ||
        (o.id && o.id.toLowerCase().includes(search.toLowerCase()))
      const matchesStatus =
        statusFilter === 'all' || o.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return
    setUpdating(true)
    try {
      if (user?.role === 'delivery_agent') {
        await api.delivery.updateStatus(selected.id, newStatus)
      } else if (user?.role === 'tailor' || user?.role === 'admin') {
        await api.tailor.updateStatus(selected.id, newStatus)
      } else if (user?.role === 'client') {
        await api.client.updateOrder(selected.id, { status: newStatus })
      }

      const updated = {
        ...selected,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      )
      setSelected(updated)
      show({
        title: 'Order Progress Advanced',
        description: `${updated.item} is now marked as "${STATUS_LABEL[newStatus]}".`,
        tone: 'success',
      })
    } catch (err) {
      show({
        title: 'Status update failed',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleAcceptQuoteFromModal = async (
    orderId: string,
    agreedPrice: number
  ) => {
    setIsNegotiationOpen(false)
    if (!selected) return

    try {
      if (user?.role === 'client') {
        await api.client.updateOrder(orderId, { price: agreedPrice, status: 'confirmed' })
      } else if (user?.role === 'tailor') {
        await api.tailor.updateOrder(orderId, { price: agreedPrice, status: 'confirmed' })
      }
    } catch (err) {
      show({
        title: "Couldn't record the agreed quote",
        description: err instanceof Error ? err.message : 'The order was not updated — please try again.',
        tone: 'error',
      })
      return
    }

    const updated = { ...selected, price: agreedPrice, status: 'confirmed' }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    setSelected(updated)

    show({
      title: 'Quote Agreed & Recorded!',
      description: `Agreed on ${selected.currency} ${agreedPrice.toLocaleString()}. Proceeding to Escrow Checkout.`,
      tone: 'success',
    })

    if (user?.role === 'client') {
      setIsPaymentOpen(true)
    }
  }

  // Note: no try/catch here — PaymentModal awaits this and shows its own
  // inline failure state instead of the "Payment Confirmed" screen when it
  // throws, so the payment flow never claims success for an order update
  // that didn't actually happen.
  const handlePaymentSuccess = async (orderId: string) => {
    if (!selected) return
    if (user?.role === 'client') {
      await api.client.updateOrder(orderId, { status: 'production' })
    }

    const updated = { ...selected, status: 'production' }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    setSelected(updated)

    show({
      title: 'Escrow Deposited — Production Commenced',
      description:
        'Tailor has received confirmation to draft patterns and cut fabric.',
      tone: 'success',
    })
  }

  const currentStepIdx = selected
    ? STATUS_STEPS.indexOf(selected.status)
    : 0

  // ── Master Panel (Orders List) ─────────────────────────────────────────
  const masterContent = (
    <Card className="overflow-hidden" padding="none">
      {/* Header with Search */}
      <div className="border-b border-parchment-dark p-4 bg-surface space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
            {filteredOrders.length} of {orders.length} Orders
          </span>
        </div>

        {/* Search input */}
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
            placeholder="Search orders, ref..."
            className="w-full rounded-xl border border-parchment-dark bg-parchment pl-8 pr-3 py-1.5 text-xs font-body text-ink placeholder:text-ink-subtle focus:border-forest focus:outline-none"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'negotiating', 'confirmed', 'production', 'ready'].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-data font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-forest text-white'
                    : 'bg-parchment text-ink-muted hover:bg-parchment-dark/60'
                }`}
              >
                {st === 'all' ? 'All' : STATUS_LABEL[st]?.split(' ')[0] || st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-parchment-dark max-h-[70dvh] overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-xs font-body text-ink-subtle">
            No matching orders
          </div>
        ) : (
          filteredOrders.map((order) => {
            const active = selected?.id === order.id
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelected(order)}
                className={`block w-full p-4 text-left transition-colors ${
                  active
                    ? 'bg-parchment/80 border-l-4 border-forest shadow-2xs'
                    : 'hover:bg-parchment/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-bold font-display text-ink">
                    {order.item}
                  </span>
                  <span className="text-xs font-semibold font-data text-forest shrink-0">
                    {order.price
                      ? `${order.currency} ${order.price.toLocaleString()}`
                      : 'Quoting'}
                  </span>
                </div>
                <div className="mt-1 text-[10px] font-data text-ink-subtle tracking-wider">
                  #{order.id.slice(-6)} • {order.morphology.toUpperCase()}
                </div>
                <div className="mt-2.5">
                  <StatusBadge status={order.status} size="sm" />
                </div>
              </button>
            )
          })
        )}
      </div>
    </Card>
  )

  // ── Detail Panel (Selected Order Inspection) ───────────────────────────
  const detailContent = selected ? (
    <div className="space-y-5">
      {/* Header Card */}
      <Card className="overflow-hidden" padding="none">
        <div className="flex flex-col justify-between gap-4 border-b border-parchment-dark p-6 sm:flex-row sm:items-center bg-surface">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold font-display text-ink tracking-tight">
                {selected.item}
              </h2>
              <StatusBadge status={selected.status} />
            </div>
            <div className="mt-1.5 text-xs font-data text-ink-subtle">
              Tracking Ref: #{selected.id} • Initiated{' '}
              {new Date(selected.createdAt).toLocaleDateString('en-GB')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(selected.status === 'pending' ||
              selected.status === 'negotiating') && (
              <PillButton
                variant="primary"
                size="sm"
                icon="handshake"
                onClick={() => setIsNegotiationOpen(true)}
              >
                Negotiation Studio
              </PillButton>
            )}

            {selected.status === 'confirmed' && user?.role === 'client' && (
              <PillButton
                variant="primary"
                size="sm"
                icon="creditCard"
                onClick={() => setIsPaymentOpen(true)}
              >
                Pay Escrow
              </PillButton>
            )}

            {(selected.status === 'assigned' ||
              selected.status === 'out') && (
              <span className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <AppIcon
                  name="truck"
                  size={14}
                  className="animate-pulse"
                />
                Courier En Route
              </span>
            )}
          </div>
        </div>

        {/* 8-Stage Visual Lifecycle Stepper */}
        <div className="border-b border-parchment-dark p-6 bg-parchment/60">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
              8-Stage Lifecycle Tracker
            </span>
            <span className="text-xs font-bold font-data text-forest">
              Stage {currentStepIdx + 1} of 8: {STATUS_LABEL[selected.status]}
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIdx
              const isCurrent = idx === currentStepIdx
              return (
                <div key={step} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-2.5 w-full rounded-full transition-all ${
                      isDone
                        ? 'bg-forest'
                        : 'bg-parchment-dark'
                    } ${isCurrent ? 'ring-2 ring-forest shadow-xs' : ''}`}
                  />
                  <span
                    className={`text-[8px] font-data uppercase tracking-tighter truncate text-center w-full ${
                      isCurrent
                        ? 'block font-bold text-forest'
                        : 'hidden text-ink-subtle sm:block'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="mt-3.5 text-xs font-body text-ink-muted leading-relaxed">
            {STATUS_DESCRIPTIONS[selected.status]}
          </p>
        </div>

        {/* Tailoring Specs Grid */}
        <div className="grid grid-cols-2 gap-px bg-parchment-dark sm:grid-cols-4">
          {[
            {
              label: 'Morphology',
              value: selected.morphology.toUpperCase(),
            },
            {
              label: 'Textile Drape',
              value: selected.fabric || 'Silk Satin',
            },
            {
              label: 'Agreed Quote',
              value: selected.price
                ? `${selected.currency} ${selected.price.toLocaleString()}`
                : 'In Negotiation',
            },
            {
              label: 'Escrow Protection',
              value: currentStepIdx >= 2 ? 'Active (Held)' : 'Pending Agreement',
            },
          ].map((item) => (
            <div key={item.label} className="bg-surface p-4">
              <span className="block mb-1 text-[9px] font-data text-ink-subtle uppercase tracking-wider">
                {item.label}
              </span>
              <span className="text-xs font-semibold font-body text-ink">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Notes & Directives */}
        <div className="p-6 bg-surface">
          <span className="block mb-2 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
            Design Directives & Bespoke Specifications
          </span>
          <p className="text-xs font-body text-ink-muted leading-relaxed">
            {selected.notes}
          </p>
        </div>
      </Card>

      {/* Dynamic Courier Dispatch Tracking Card */}
      {currentStepIdx >= 4 && (
        <Card className="p-5 border-forest/40 bg-forest/5 shadow-xs">
          <div className="flex items-center justify-between border-b border-parchment-dark/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <AppIcon name="truck" size={15} />
              </span>
              <span className="text-sm font-bold font-display text-ink">
                Smart Dynamic Courier Dispatch
              </span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold font-data text-emerald-800">
              Proximity Matched
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
            <div>
              <span className="block text-[9px] font-data text-ink-subtle uppercase">
                Matched Courier
              </span>
              <span className="font-semibold font-body text-ink">
                {selected.deliveryAgent?.name ?? 'Awaiting courier assignment'}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-data text-ink-subtle uppercase">
                Atelier Pickup Code
              </span>
              {/* Must match what the courier types in Delivery Radar —
                  same derivation as DeliveryRadar's toDispatchItem. */}
              <span className="font-bold font-data text-forest">
                MF-{selected.id.slice(-4).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-data text-ink-subtle uppercase">
                Estimated Delivery <span className="normal-case">(simulated)</span>
              </span>
              <span className="font-semibold font-body text-ink">
                25-35 Minutes
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Tailor / Admin Stage Progression Controls */}
      {(user?.role === 'tailor' || user?.role === 'admin') && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
              {user.role === 'tailor'
                ? 'Tailor Atelier Action Desk'
                : 'Admin Stage Override'}
            </span>
            <span className="text-[10px] font-data text-ink-subtle">
              Advance order stage
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_STEPS.map((s) => (
              <Chip
                key={s}
                selected={selected.status === s}
                onClick={() =>
                  updating || selected.status === s
                    ? undefined
                    : handleStatusChange(s)
                }
              >
                {STATUS_LABEL[s]}
              </Chip>
            ))}
          </div>
        </Card>
      )}
    </div>
  ) : null

  return (
    <PageShell
      title={
        user?.role === 'delivery_agent'
          ? 'Active Deliveries'
          : 'Bespoke Orders & Traceability'
      }
      subtitle="End-to-end multi-actor traceability: negotiation, escrow payment, tailor craftsmanship, and smart delivery."
      loading={loading}
      empty={
        !loading && orders.length === 0
          ? {
              icon: 'receipt',
              title: 'No bespoke orders yet',
              description:
                user?.role === 'client'
                  ? 'Explore style configurations in 3D or discover a master tailor to start your first bespoke order.'
                  : 'Orders assigned to your atelier will appear here in real-time.',
              action:
                user?.role === 'client' ? (
                  <PillButton size="sm" onClick={() => navigate('/dashboard/visualizer')}>
                    Explore Styles
                  </PillButton>
                ) : undefined,
            }
          : undefined
      }
    >
      <MasterDetail
        masterContent={masterContent}
        detailContent={detailContent}
        hasSelection={Boolean(selected)}
        onBack={() => setSelected(null)}
        backLabel="Back to orders list"
        masterWidth="default"
      />

      {/* Negotiation Modal */}
      <NegotiationModal
        order={selected}
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        onAcceptQuote={handleAcceptQuoteFromModal}
        onUpdateQuote={async (id, newPrice, notes) => {
          if (!selected || selected.id !== id) return
          // The backend appends a structured negotiationHistory entry and
          // returns the full updated order — use that directly rather than
          // guessing its shape locally, so the trail (and everyone viewing
          // it) reflects exactly what was persisted.
          let updated: Order
          if (user?.role === 'client') {
            updated = await api.client.updateOrder(id, { price: newPrice, notes })
          } else if (user?.role === 'tailor') {
            updated = await api.tailor.updateOrder(id, { price: newPrice, notes })
          } else {
            return
          }

          setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
          setSelected(updated)
        }}
      />

      {/* Payment Checkout Modal */}
      <PaymentModal
        order={selected}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </PageShell>
  )
}
