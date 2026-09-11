import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { AppIcon, type IconName } from '../ui/icons'
import { EmptyState } from '../ui/EmptyState'
import { useNotifications } from '../../NotificationsContext'
import { useAuth } from '../../AuthContext'
import { timeAgo } from '../../lib/timeAgo'
import type { AppNotification, NotificationType, UserRole } from '../../api'

const TYPE_ICON: Record<NotificationType, IconName> = {
  appointment_requested: 'calendar',
  appointment_confirmed: 'calendar',
  appointment_declined: 'calendar',
  order_status_changed: 'receipt',
  message_received: 'message',
  support_request_created: 'lifeBuoy',
  support_reply_received: 'lifeBuoy',
  support_response_added: 'lifeBuoy',
  support_status_changed: 'lifeBuoy',
  account_updated_by_admin: 'shieldCheck',
  role_changed_by_admin: 'shieldCheck',
  account_deactivated_by_admin: 'shieldCheck',
  account_reactivated_by_admin: 'shieldCheck',
  password_reset_by_admin: 'shieldCheck',
}

const ACCOUNT_NOTIFICATION_TYPES = new Set<NotificationType>([
  'account_updated_by_admin',
  'role_changed_by_admin',
  'account_deactivated_by_admin',
  'account_reactivated_by_admin',
  'password_reset_by_admin',
])

// Admin-authored support events deep-link into the admin console; the
// user-facing ones (a reply/status change on the requester's own submission)
// deep-link into the Help Center's "My Requests" tab instead.
const ADMIN_SUPPORT_TYPES = new Set<NotificationType>(['support_request_created', 'support_reply_received'])

function deepLinkFor(n: AppNotification, role?: UserRole): string {
  if (ACCOUNT_NOTIFICATION_TYPES.has(n.type)) return '/dashboard/settings'
  if (n.data.supportRequestId) {
    return ADMIN_SUPPORT_TYPES.has(n.type) && role === 'admin'
      ? `/dashboard/support?requestId=${n.data.supportRequestId}`
      : `/dashboard/help?requestId=${n.data.supportRequestId}`
  }
  if (n.data.conversationId) return `/dashboard/messages/${n.data.conversationId}`
  if (n.data.orderId) return '/dashboard/orders'
  if (n.data.appointmentId) return '/dashboard/appointments'
  return '/dashboard'
}

export function NotificationsDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const reduceMotion = useReducedMotion()
  const nav = useNavigate()
  const { user } = useAuth()
  const { notifications, markRead, markAllRead } = useNotifications()

  const unread = notifications.filter((n) => !n.read)
  const earlier = notifications.filter((n) => n.read)

  const openNotification = (n: AppNotification) => {
    if (!n.read) markRead(n.id)
    onClose()
    nav(deepLinkFor(n, user?.role))
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000]">
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed right-0 top-0 flex h-full w-full flex-col border-l border-parchment-dark bg-surface shadow-2xl sm:w-[420px]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 340, damping: 34 }
            }
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-parchment-dark px-6 py-4"
              style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
            >
              <div>
                <h2 className="text-lg font-bold font-display text-ink tracking-tight">
                  Notifications
                </h2>
                {unread.length > 0 && (
                  <p className="text-[11px] font-data text-forest">
                    {unread.length} unread updates
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unread.length > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="text-[10px] font-semibold font-data uppercase tracking-wider text-forest hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-subtle hover:bg-parchment hover:text-ink transition-colors"
                >
                  <AppIcon name="close" size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length === 0 ? (
                <EmptyState
                  icon="bell"
                  title="You're all caught up"
                  description="New updates on your orders, fittings, and messages will arrive here in real time."
                />
              ) : (
                <>
                  {unread.length > 0 && (
                    <div>
                      <div className="px-2 pb-2 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
                        Unread
                      </div>
                      <div className="space-y-1.5">
                        {unread.map((n) => (
                          <NotificationRow
                            key={n.id}
                            notification={n}
                            onClick={() => openNotification(n)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {earlier.length > 0 && (
                    <div>
                      <div className="px-2 pb-2 pt-2 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
                        Earlier
                      </div>
                      <div className="space-y-1.5">
                        {earlier.map((n) => (
                          <NotificationRow
                            key={n.id}
                            notification={n}
                            onClick={() => openNotification(n)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: AppNotification
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-3.5 rounded-2xl p-3 text-left transition-all ${
        notification.read
          ? 'hover:bg-parchment/60 text-ink-muted'
          : 'bg-parchment/70 hover:bg-parchment text-ink shadow-xs'
      }`}
    >
      <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface border border-parchment-dark text-forest shadow-xs">
        <AppIcon name={TYPE_ICON[notification.type]} size={16} />
        {!notification.read && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-seal ring-2 ring-surface" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold font-body text-ink">
          {notification.title}
        </span>
        {notification.body && (
          <span className="mt-0.5 block line-clamp-2 text-xs font-body text-ink-subtle leading-relaxed">
            {notification.body}
          </span>
        )}
        <span className="mt-1.5 block text-[10px] font-data text-ink-subtle uppercase tracking-wider">
          {timeAgo(notification.createdAt)}
        </span>
      </span>
    </button>
  )
}

export default NotificationsDrawer
