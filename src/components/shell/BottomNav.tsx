import { useLocation, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../../AuthContext'
import { useNotifications } from '../../NotificationsContext'
import { AppIcon } from '../ui/icons'
import { NAV_BY_ROLE } from './nav'

export function BottomNav() {
  const { user } = useAuth()
  const { unreadMessages } = useNotifications()
  const loc = useLocation()
  const nav = useNavigate()
  const reduceMotion = useReducedMotion()
  if (!user) return null
  const items = (NAV_BY_ROLE[user.role] ?? []).slice(0, 5)

  const handleNav = (to: string) => {
    try {
      navigator.vibrate?.(2)
    } catch {
      // safe fallback
    }
    nav(to)
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-parchment-dark bg-surface-glass-bg backdrop-blur-xl shadow-lg lg:hidden"
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
    >
      {items.map((item) => {
        const active = item.end
          ? loc.pathname === item.to
          : loc.pathname.startsWith(item.to)

        return (
          <button
            key={item.to}
            type="button"
            onClick={() => handleNav(item.to)}
            className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center py-2 transition-all active:scale-95 ${
              active ? 'text-forest font-semibold' : 'text-ink-subtle'
            }`}
          >
            {active && (
              <motion.span
                layoutId="bottomNavIndicator"
                className="absolute inset-x-2 top-1 bottom-1 -z-10 rounded-2xl bg-forest/10"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 30 }
                }
              />
            )}

            <span className="relative flex flex-col items-center gap-1">
              <span
                className={`relative transition-transform duration-200 ${
                  active ? 'scale-110' : ''
                }`}
              >
                <AppIcon name={item.icon} size={20} strokeWidth={active ? 2.2 : 1.7} />
                {item.to === '/dashboard/messages' && unreadMessages > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-seal px-1 text-[8px] font-bold font-data text-white ring-2 ring-surface">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </span>
              <span className="text-[9px] font-data uppercase tracking-wider">
                {item.label}
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
