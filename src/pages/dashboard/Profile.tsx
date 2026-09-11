import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api, type Order, type User, type Measurements } from '../../api'
import { Card, StatusBadge, PillButton } from '../../components/ui/primitives'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { useToast } from '../../components/ui/Toast'
import { ROLE_LABEL } from '../../components/shell/nav'
import { computeRoleStats, fetchRoleStatsData } from './roleStats'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [bio, setBio] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.users.me().then((p) => setBio(p.bio || '')),
      fetchRoleStatsData(user.role).then((data) => {
        setOrders(data.orders)
        setUsers(data.users)
        setMeasurements(data.measurements)
      }),
    ]).finally(() => setLoading(false))
    // Re-fetch only on login/logout, not on every AuthContext.updateUser()
    // patch (e.g. the avatar upload below produces a new `user` object with
    // the same id, which would otherwise trigger a redundant re-fetch here).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // 5MB limit check
    if (file.size > 5 * 1024 * 1024) {
      show({
        title: 'Image too large',
        description: 'Please select an image smaller than 5MB.',
        tone: 'error',
      })
      return
    }

    setUploading(true)
    try {
      const updated = await api.users.uploadAvatar(file)
      updateUser({ avatarUrl: updated.avatarUrl })
      show({ title: 'Atelier avatar updated', tone: 'success' })
    } catch (err) {
      show({
        title: "Couldn't upload photo",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setUploading(false)
    }
  }

  if (!user) return null
  const stats = computeRoleStats(user.role, orders, users, measurements)

  return (
    <PageShell
      title="My Atelier Profile"
      subtitle="Identity, atelier credentials & performance overview"
      loading={loading}
    >
      <div className="space-y-6">
        {/* ── Profile Header Card ──────────────────────────────────────── */}
        <Card className="overflow-hidden" padding="none">
          <div
            className="p-6 sm:p-8"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              {/* Avatar with Camera Overlay */}
              <div className="relative flex-shrink-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/15 shadow-md">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold font-display text-white">
                      {user.name[0]?.toUpperCase()}
                    </span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <div className="h-6 w-6 animate-spin-smooth rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change atelier photo"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-forest text-white shadow-md transition-transform hover:scale-110 active:scale-95"
                >
                  <AppIcon name="camera" size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onAvatarSelected}
                />
              </div>

              {/* Identity details */}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold font-display text-white tracking-tight sm:text-3xl">
                  {user.name}
                </h1>
                <div className="mt-1 text-xs font-data uppercase tracking-widest text-white/80">
                  {ROLE_LABEL[user.role]}
                  {user.city ? ` · ${user.city}` : ''}
                </div>
                <div className="mt-0.5 text-xs font-body text-white/70">
                  {user.email}
                </div>
              </div>

              {/* Edit action */}
              <PillButton
                variant="secondary"
                size="md"
                onClick={() => navigate('/dashboard/settings')}
              >
                Edit Settings
              </PillButton>
            </div>
          </div>

          {/* Bio Section */}
          <div className="p-6 bg-surface">
            <div className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest mb-2">
              Atelier Bio
            </div>
            {bio ? (
              <p className="text-sm font-body text-ink-muted leading-relaxed">
                {bio}
              </p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs font-body text-ink-subtle italic">
                  No biography provided yet. Add notes about your sartorial background.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/settings')}
                  className="text-xs font-semibold text-forest hover:underline"
                >
                  + Add bio
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* ── KPI Metric Grid ─────────────────────────────────────────── */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="p-5" hover>
                <div className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">
                  {s.label}
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-bold font-display text-forest leading-none">
                  {s.value}
                </div>
                {s.sub && (
                  <div className="mt-2 text-xs font-body text-ink-muted">
                    {s.sub}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── Recent Activity ─────────────────────────────────────────── */}
        {orders.length > 0 && (
          <Card className="overflow-hidden" padding="none">
            <div className="flex items-center justify-between border-b border-parchment-dark px-5 py-3.5 bg-surface">
              <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
                Recent Atelier Activity
              </span>
              <button
                type="button"
                onClick={() => navigate('/dashboard/orders')}
                className="text-[11px] font-data text-forest hover:underline"
              >
                View all orders →
              </button>
            </div>
            <div className="divide-y divide-parchment-dark">
              {orders.slice(0, 4).map((o) => (
                <div
                  key={o.id}
                  onClick={() => navigate('/dashboard/orders')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') &&
                    navigate('/dashboard/orders')
                  }
                  className="flex items-center justify-between p-4 bg-surface hover:bg-parchment transition-colors cursor-pointer"
                >
                  <span className="truncate text-sm font-semibold font-body text-ink pr-3">
                    {o.item}
                  </span>
                  <StatusBadge status={o.status} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  )
}
