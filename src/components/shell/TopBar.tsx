import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../AuthContext'
import { useNotifications } from '../../NotificationsContext'
import { ThemeToggle, UserAvatar } from '../ui/primitives'
import { AppIcon } from '../ui/icons'
import { ConfirmDialog } from '../ui/Modal'
import { ROLE_LABEL } from './nav'
import { useBreadcrumbTrail } from './Breadcrumbs'
import { useCommandPalette } from './CommandPalette'
import { NotificationsDrawer } from './NotificationsDrawer'

export function TopBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { show: showSearch } = useCommandPalette()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const title = useBreadcrumbTrail(user?.role, loc.pathname)
  if (!user) return null

  const signOut = () => {
    setConfirmSignOut(false)
    setMenuOpen(false)
    logout()
    nav('/')
  }

  return (
    <header
      className="flex border-b border-parchment-dark bg-surface-glass-bg backdrop-blur-xl px-4 pb-3 pt-3.5 sm:px-6 lg:px-8"
      style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top))' }}
    >
      <div className="flex w-full items-center justify-between gap-3">
        {/* Title and role eyebrow */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base sm:text-lg font-bold font-display text-ink tracking-tight">
            {title}
          </h1>
          <div className="truncate text-[10px] font-data text-ink-subtle uppercase tracking-wider lg:hidden">
            {ROLE_LABEL[user.role]}
          </div>
        </div>

        {/* Action icons */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-2 sm:gap-3">
          {/* Search button */}
          <button
            type="button"
            onClick={showSearch}
            aria-label="Search"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-parchment text-ink-subtle hover:text-ink hover:bg-parchment-dark/60 transition-all active:scale-95"
          >
            <AppIcon name="search" size={16} />
          </button>

          {/* Notification bell */}
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-parchment text-ink-subtle hover:text-ink hover:bg-parchment-dark/60 transition-all active:scale-95"
          >
            <AppIcon name="bell" size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-seal px-1 text-[9px] font-bold font-data text-white ring-2 ring-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User profile dropdown */}
          <div className="relative">
            <UserAvatar onClick={() => setMenuOpen((o) => !o)} size={36} />
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-2xl border border-parchment-dark bg-surface py-1.5 shadow-xl backdrop-blur-xl"
                  >
                    <div className="px-4 py-2.5">
                      <div className="truncate text-sm font-semibold font-body text-ink">
                        {user.name}
                      </div>
                      <div className="text-[10px] font-data text-forest uppercase tracking-wider font-semibold">
                        {ROLE_LABEL[user.role]}
                      </div>
                    </div>

                    <div className="my-1 border-t border-parchment-dark/60" />

                    {[
                      {
                        label: 'Profile',
                        icon: 'user' as const,
                        action: () => {
                          setMenuOpen(false)
                          nav('/dashboard/profile')
                        },
                      },
                      {
                        label: 'Settings',
                        icon: 'settings' as const,
                        action: () => {
                          setMenuOpen(false)
                          nav('/dashboard/settings')
                        },
                      },
                      {
                        label: 'Help & Support',
                        icon: 'lifeBuoy' as const,
                        action: () => {
                          setMenuOpen(false)
                          nav('/dashboard/help')
                        },
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-body text-ink hover:bg-parchment transition-colors"
                      >
                        <AppIcon name={item.icon} size={15} className="text-ink-subtle" />
                        <span>{item.label}</span>
                      </button>
                    ))}

                    <div className="my-1 border-t border-parchment-dark/60" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        setConfirmSignOut(true)
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-body text-[var(--status-error-text)] hover:bg-red-500/10 transition-colors"
                    >
                      <AppIcon name="logOut" size={15} />
                      <span>Sign out</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <ConfirmDialog
        open={confirmSignOut}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={signOut}
        title="Sign out?"
        description="You'll need to sign in again to access your atelier dashboard."
        confirmLabel="Sign out"
        danger
      />
    </header>
  )
}

export default TopBar
