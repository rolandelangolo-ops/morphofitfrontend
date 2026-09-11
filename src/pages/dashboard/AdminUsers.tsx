import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { api, type AdminActivityEntry, type User, type UserRole } from '../../api'
import { Card, PillButton } from '../../components/ui/primitives'
import { ChipGroup } from '../../components/ui/Chip'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { ROLE_LABEL as SINGULAR_ROLE_LABEL } from '../../components/shell/nav'
import { timeAgo } from '../../lib/timeAgo'

const ROLE_LABEL: Record<string, string> = {
  all: 'All Users',
  client: 'Clients',
  stylist: 'Stylists',
  tailor: 'Tailors',
  delivery_agent: 'Couriers',
  admin: 'Admins',
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  client: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  stylist: 'bg-purple-50 text-purple-800 border-purple-200',
  tailor: 'bg-amber-50 text-amber-800 border-amber-200',
  delivery_agent: 'bg-blue-50 text-blue-800 border-blue-200',
  admin: 'bg-neutral-100 text-neutral-800 border-neutral-300',
}

const ROLE_OPTIONS = (['client', 'stylist', 'tailor', 'delivery_agent', 'admin'] as UserRole[]).map((r) => ({
  value: r,
  label: SINGULAR_ROLE_LABEL[r],
}))

const ACTION_LABEL: Record<string, string> = {
  'user.create': 'created a user',
  'user.update': "updated a user's profile",
  'user.changeRole': "changed a user's role",
  'user.setPassword': "reset a user's password",
  'user.deactivate': 'deactivated a user',
  'user.reactivate': 'reactivated a user',
  'user.delete': 'deleted a user',
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const { show } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activity, setActivity] = useState<AdminActivityEntry[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('client')
  const [newCity, setNewCity] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api.admin
      .users()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load the user directory'))
      .finally(() => setLoading(false))
  }

  const loadActivity = () => {
    api.admin
      .activity()
      .then(setActivity)
      .catch(() => {})
  }

  useEffect(() => {
    load()
    loadActivity()
  }, [])

  const roles = [
    'all',
    'client',
    'stylist',
    'tailor',
    'delivery_agent',
    'admin',
  ]

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = filter === 'all' || u.role === filter
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      return matchesRole && matchesSearch
    })
  }, [users, filter, search])

  const resetCreateForm = () => {
    setNewName('')
    setNewEmail('')
    setNewRole('client')
    setNewCity('')
    setNewPhone('')
  }

  const createUser = async () => {
    if (!newName.trim() || !newEmail.trim()) return
    setCreating(true)
    try {
      await api.admin.createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        city: newCity.trim() || undefined,
        phone: newPhone.trim() || undefined,
      })
      show({
        title: 'User created',
        description: `A password-setup email was sent to ${newEmail.trim()}.`,
        tone: 'success',
      })
      setCreateOpen(false)
      resetCreateForm()
      load()
      loadActivity()
    } catch (err) {
      show({
        title: "Couldn't create user",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <PageShell
      title="User Directory"
      subtitle="Platform identity management, verified ateliers, credentials & access control"
      loading={loading}
      error={error}
      onRetry={load}
      actions={
        <PillButton variant="primary" icon="userPlus" onClick={() => setCreateOpen(true)}>
          New User
        </PillButton>
      }
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <AppIcon
              name="search"
              size={15}
              className="absolute left-3.5 top-3 text-ink-subtle"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full rounded-xl border border-parchment-dark bg-surface pl-9 pr-4 py-2 text-xs font-body text-ink placeholder:text-ink-subtle focus:border-forest focus:outline-none shadow-2xs"
            />
          </div>

          {/* Filter Chips */}
          <ChipGroup
            options={roles.map((r) => ROLE_LABEL[r])}
            value={ROLE_LABEL[filter]}
            onChange={(label) => {
              const entry = Object.entries(ROLE_LABEL).find(
                ([, v]) => v === label
              )
              if (entry) setFilter(entry[0])
            }}
          />
        </div>

        {/* Users Table Card */}
        {filtered.length === 0 ? (
          <Card className="p-8 text-center bg-surface">
            <p className="text-sm font-body text-ink-muted">
              No matching users found.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden" padding="none">
            {/* Table Header */}
            <div
              className="hidden gap-4 border-b border-parchment-dark px-6 py-3.5 sm:grid bg-surface"
              style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto' }}
            >
              {['Atelier User', 'Email Address', 'Platform Role', 'Registered', ''].map(
                (h, idx) => (
                  <div
                    key={idx}
                    className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider"
                  >
                    {h}
                  </div>
                )
              )}
            </div>

            {/* Rows */}
            <div className="divide-y divide-parchment-dark">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  onClick={() => navigate(`/dashboard/users/${u.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') &&
                    navigate(`/dashboard/users/${u.id}`)
                  }
                  className="flex flex-col gap-2.5 p-5 transition-colors hover:bg-parchment cursor-pointer sm:grid sm:items-center sm:gap-4 sm:px-6 sm:py-4"
                  style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/10 font-display text-xs font-bold text-forest">
                      {u.name ? u.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="truncate text-sm font-semibold font-body text-ink">
                      {u.name}
                    </div>
                  </div>

                  <div className="text-xs font-body text-ink-subtle truncate">
                    {u.email}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-data font-semibold uppercase tracking-wider ${
                        ROLE_BADGE_CLASS[u.role] ||
                        'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </div>

                  <div className="text-xs font-data text-ink-subtle">
                    {new Date(u.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>

                  <div className="text-ink-subtle text-right">
                    <AppIcon name="chevronRight" size={15} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Admin Activity */}
        {activity.length > 0 && (
          <Card className="overflow-hidden" padding="none">
            <div className="border-b border-parchment-dark px-6 py-3.5 bg-surface">
              <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
                Recent Admin Activity
              </span>
            </div>
            <div className="divide-y divide-parchment-dark">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <span className="truncate text-xs font-body text-ink-muted">
                    <span className="font-semibold text-ink">{a.adminName}</span>{' '}
                    {ACTION_LABEL[a.action] || a.action}
                    {a.detail ? <span className="text-ink-subtle"> · {a.detail}</span> : null}
                  </span>
                  <span className="flex-shrink-0 text-[10px] font-data text-ink-subtle uppercase tracking-wider">
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* New User Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          resetCreateForm()
        }}
        title="New User"
        footer={
          <>
            <PillButton variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </PillButton>
            <PillButton variant="primary" onClick={createUser} loading={creating}>
              Create user
            </PillButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" value={newName} onChange={setNewName} required icon="user" />
          <Input label="Email address" type="email" value={newEmail} onChange={setNewEmail} required icon="mail" />
          <Select label="Role" value={newRole} onChange={(v) => setNewRole(v as UserRole)} options={ROLE_OPTIONS} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="City (optional)" value={newCity} onChange={setNewCity} icon="mapPin" />
            <Input label="Phone (optional)" value={newPhone} onChange={setNewPhone} icon="phone" />
          </div>
          <p className="text-xs font-body text-ink-subtle leading-relaxed">
            The new user gets a password-setup email — no password is set here.
          </p>
        </div>
      </Modal>
    </PageShell>
  )
}
