import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api, type Order, type Measurements, type User } from '../../api'
import { Card, StatusBadge, PillButton } from '../../components/ui/primitives'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { computeRoleStats } from './roleStats'

function getGreeting(name: string) {
  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12
      ? 'Good morning'
      : hour < 18
      ? 'Good afternoon'
      : 'Good evening'
  const firstName = name.split(' ')[0]
  return { timeGreeting, firstName }
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Card className="p-5" hover>
      <div className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-bold font-display text-forest leading-none">
        {value}
      </div>
      {sub && (
        <div className="mt-2 text-xs font-body text-ink-muted">
          {sub}
        </div>
      )}
    </Card>
  )
}

function OrderRow({
  order,
  onClick,
}: {
  order: Order
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="flex items-center justify-between border-b border-parchment-dark px-5 py-3.5 transition-colors last:border-b-0 hover:bg-parchment cursor-pointer"
    >
      <div className="min-w-0 flex-1 pr-4">
        <div className="truncate text-sm font-semibold font-body text-ink">
          {order.item}
        </div>
        <div className="mt-0.5 text-[10px] font-data text-ink-subtle tracking-wide">
          Ref: {order.id}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {order.price && (
          <span className="text-sm font-data font-medium text-ink">
            {order.currency} {order.price.toLocaleString()}
          </span>
        )}
        <StatusBadge status={order.status} size="sm" />
      </div>
    </div>
  )
}

export default function Overview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      // Note: no per-call .catch() here — a genuine failure (expired
      // session, network error) should reach the try/catch below and show
      // the error banner + Retry, not be silently swallowed into an empty
      // dashboard. The backend already returns [] / null for legitimate
      // "nothing yet" cases (e.g. no measurements taken), so there's no
      // empty-state handling lost by letting real errors propagate.
      if (user.role === 'client') {
        const [o, m] = await Promise.all([api.client.orders(), api.client.measurements()])
        setOrders(o)
        setMeasurements(m)
      } else if (user.role === 'stylist') {
        const [o, c] = await Promise.all([api.stylist.orders(), api.stylist.clients()])
        setOrders(o)
        setUsers(c)
      } else if (user.role === 'tailor') {
        const o = await api.tailor.orders()
        setOrders(o)
      } else if (user.role === 'delivery_agent') {
        const o = await api.delivery.orders()
        setOrders(o)
      } else if (user.role === 'admin') {
        const [o, u] = await Promise.all([api.admin.orders(), api.admin.users()])
        setOrders(o)
        setUsers(u)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to synchronize atelier dashboard')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!user) return null
  const { timeGreeting, firstName } = getGreeting(user.name)
  const stats = computeRoleStats(user.role, orders, users, measurements)

  return (
    <div className="space-y-6">
      {/* ── Top Greeting Header ─────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink sm:text-3xl tracking-tight">
            {timeGreeting},{' '}
            <em className="italic text-forest not-italic sm:italic">
              {firstName}.
            </em>
          </h1>
          <p className="mt-1 text-xs font-data text-ink-subtle uppercase tracking-wider">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {error && (
        <Card className="flex items-center justify-between p-4 border-seal/30 bg-[var(--status-error-bg)]">
          <span className="text-xs text-[var(--status-error-text)] font-body">
            {error}
          </span>
          <PillButton variant="secondary" size="sm" onClick={fetchData}>
            Retry
          </PillButton>
        </Card>
      )}

      {/* ── KPI Metric Grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <StatTile key={s.label} {...s} />
            ))}
          </div>
        )
      )}

      {/* ── Role Specific Action Banners ─────────────────────────────────── */}
      {!loading && (
        <>
          {/* Client without measurements */}
          {user.role === 'client' && !measurements && (
            <Card
              className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center"
              style={{ background: 'var(--gradient-mesh)' }}
            >
              <div>
                <h3 className="text-base font-bold font-display text-ink">
                  Start your dual-photo body scan
                </h3>
                <p className="mt-1 text-xs font-body text-ink-muted max-w-xl">
                  Upload front and lateral photos and a reference height to estimate your
                  body measurements, identify your morphology archetype, and unlock 3D
                  fittings.
                </p>
              </div>
              <PillButton
                variant="primary"
                onClick={() => navigate('/dashboard/measurements')}
              >
                Scan Now
              </PillButton>
            </Card>
          )}

          {/* Client with calibrated measurements */}
          {user.role === 'client' && measurements && (
            <Card className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center bg-parchment">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold font-display text-ink capitalize">
                    {measurements.morphology} Archetype Active
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-body text-ink-muted">
                  8 body metrics calibrated. Explore harmonic cuts in 3D or
                  order with Master Tailors.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PillButton
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/dashboard/measurements')}
                >
                  Recalibrate
                </PillButton>
                <PillButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard/visualizer')}
                >
                  Open 3D Studio
                </PillButton>
              </div>
            </Card>
          )}

          {/* Delivery Agent Radar Launch */}
          {user.role === 'delivery_agent' && (
            <Card className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center bg-parchment">
              <div>
                <h3 className="text-sm font-bold font-display text-ink">
                  Dynamic Delivery Radar
                </h3>
                <p className="mt-0.5 text-xs font-body text-ink-muted">
                  Scan for ready garments at Douala & Yaoundé ateliers and accept
                  instant delivery dispatches.
                </p>
              </div>
              <PillButton
                variant="primary"
                onClick={() => navigate('/dashboard/delivery-radar')}
              >
                Launch Radar
              </PillButton>
            </Card>
          )}

          {/* Stylist Direction Studio */}
          {user.role === 'stylist' && (
            <Card className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center bg-parchment">
              <div>
                <h3 className="text-sm font-bold font-display text-ink">
                  Stylist Direction Studio
                </h3>
                <p className="mt-0.5 text-xs font-body text-ink-muted">
                  Review client morphology scans, draft garment silhouettes, and
                  compose technical briefs for tailors.
                </p>
              </div>
              <PillButton
                variant="primary"
                onClick={() => navigate('/dashboard/stylist-studio')}
              >
                Open Studio
              </PillButton>
            </Card>
          )}

          {/* Admin Tools Grid */}
          {user.role === 'admin' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="flex items-center justify-between p-4 bg-parchment">
                <div>
                  <div className="text-sm font-bold font-display text-ink">
                    Service Catalog
                  </div>
                  <div className="text-xs font-body text-ink-muted">
                    Manage 3D garments, textures & morphology rules
                  </div>
                </div>
                <PillButton
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/dashboard/catalog')}
                >
                  Manage
                </PillButton>
              </Card>
              <Card className="flex items-center justify-between p-4 bg-parchment">
                <div>
                  <div className="text-sm font-bold font-display text-ink">
                    Platform Analytics
                  </div>
                  <div className="text-xs font-body text-ink-muted">
                    Morphology distribution & order throughput
                  </div>
                </div>
                <PillButton
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/dashboard/reports')}
                >
                  Analytics
                </PillButton>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ── Recent Activity / Orders ────────────────────────────────────── */}
      {!loading && (
        <>
          {orders.length > 0 ? (
            <Card className="overflow-hidden" padding="none">
              <div className="flex items-center justify-between border-b border-parchment-dark px-5 py-3.5 bg-surface">
                <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
                  {user.role === 'delivery_agent'
                    ? 'Assigned Deliveries'
                    : 'Recent Atelier Orders'}
                </span>
                <Link
                  to="/dashboard/orders"
                  className="text-[11px] font-data font-semibold text-forest hover:underline"
                >
                  View all →
                </Link>
              </div>
              {orders.slice(0, 5).map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  onClick={() => navigate('/dashboard/orders')}
                />
              ))}
            </Card>
          ) : (
            <EmptyState
              icon="receipt"
              title="No active orders"
              description={
                user.role === 'client'
                  ? 'Take your body scan and commission your first tailor-made piece.'
                  : 'Orders will appear here once requested or assigned.'
              }
            />
          )}

          {/* Client Anatomical Breakdown */}
          {user.role === 'client' && measurements && (
            <Card className="overflow-hidden" padding="none">
              <div className="border-b border-parchment-dark px-5 py-3.5 bg-surface">
                <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
                  Calibrated Anatomical Metrics
                </span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-parchment-dark sm:grid-cols-4">
                {[
                  { label: 'Shoulder Width', value: `${measurements.shoulder} cm` },
                  { label: 'Chest / Bust', value: `${measurements.chest} cm` },
                  { label: 'Natural Waist', value: `${measurements.waist} cm` },
                  { label: 'Widest Hip', value: `${measurements.hip} cm` },
                  { label: 'Inseam Length', value: `${measurements.inseam} cm` },
                  { label: 'Thigh Girth', value: `${measurements.thigh} cm` },
                  { label: 'Arm Length', value: `${measurements.armLength} cm` },
                  { label: 'Stature Height', value: `${measurements.height} cm` },
                ].map((m) => (
                  <div key={m.label} className="bg-surface p-4">
                    <div className="mb-1 text-[9px] font-data text-ink-subtle uppercase tracking-wider">
                      {m.label}
                    </div>
                    <div className="text-base font-bold font-display text-forest">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
