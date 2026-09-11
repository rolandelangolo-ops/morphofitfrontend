import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../AuthContext'
import { useNotifications } from '../../NotificationsContext'
import { AppIcon } from '../ui/icons'
import { ConfirmDialog } from '../ui/Modal'
import { NAV_BY_ROLE, ROLE_LABEL } from './nav'

export function Sidebar() {
  const { user, logout } = useAuth()
  const { unreadMessages } = useNotifications()
  const navigate = useNavigate()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  if (!user) return null
  const items = NAV_BY_ROLE[user.role] ?? []

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="hidden w-72 flex-shrink-0 flex-col overflow-hidden border-r border-parchment-dark bg-surface-glass-bg backdrop-blur-xl lg:flex">
      {/* ── Brand Workspace Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-3.5 px-6 pt-7">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl shadow-md ring-2 ring-forest/20"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <span className="text-xl font-bold font-display text-white">M</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-bold font-display text-ink tracking-tight">
            MorphoFit
          </div>
          <div className="truncate text-[10px] font-data text-ink-subtle uppercase tracking-[0.25em]">
            Atelier workspace
          </div>
        </div>
      </div>

      {/* ── Primary Role Nav ────────────────────────────────────────────── */}
      <div className="mt-7 min-h-0 flex-1 overflow-y-auto px-4">
        <div className="mb-2.5 px-3 text-[10px] font-data text-ink-subtle uppercase tracking-[0.3em]">
          {ROLE_LABEL[user.role]} dashboard
        </div>
        <nav className="space-y-1.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all ${
                  isActive
                    ? 'bg-parchment text-forest font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-forest'
                    : 'text-ink-muted hover:bg-parchment/60 hover:text-ink font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-parchment text-ink-subtle group-hover:text-ink'
                    }`}
                  >
                    <AppIcon name={item.icon} size={17} strokeWidth={1.8} />
                    {item.to === '/dashboard/messages' && unreadMessages > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-seal px-1 text-[9px] font-bold font-data text-white ring-2 ring-surface">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </span>
                  <span className="font-body text-sm truncate">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Pinned Footer ───────────────────────────────────────────────── */}
      <div className="mt-auto flex-shrink-0 space-y-3 px-4 pb-6 pt-4 border-t border-parchment-dark/50">
        <nav className="space-y-1">
          {([
            { label: 'Profile', to: '/dashboard/profile', icon: 'user' },
            { label: 'Settings', to: '/dashboard/settings', icon: 'settings' },
            { label: 'Help & Support', to: '/dashboard/help', icon: 'lifeBuoy' },
          ] as const).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold font-body transition-colors ${
                  isActive
                    ? 'bg-parchment text-forest'
                    : 'text-ink-muted hover:bg-parchment/60 hover:text-ink'
                }`
              }
            >
              <AppIcon name={link.icon} size={16} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="rounded-2xl border border-parchment-dark bg-surface p-3.5 shadow-xs">
          <div className="text-[9px] font-data text-ink-subtle uppercase tracking-[0.25em]">
            Active role
          </div>
          <div className="mt-1.5 truncate text-sm font-semibold font-body text-ink">
            {user.name}
          </div>
          <div className="mt-0.5 text-[10px] font-data text-forest uppercase tracking-wider font-semibold">
            {ROLE_LABEL[user.role]}
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-parchment-dark px-3 py-2 text-xs font-semibold font-data uppercase tracking-wider text-ink-subtle transition-colors hover:bg-parchment hover:text-ink"
        >
          <AppIcon name="logOut" size={14} />
          <span>Sign out</span>
        </button>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        description="You'll need to sign in again to access your atelier dashboard."
        confirmLabel="Sign out"
        danger
      />
    </aside>
  )
}

export default Sidebar
