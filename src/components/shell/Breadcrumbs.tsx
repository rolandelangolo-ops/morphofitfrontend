import type { UserRole } from '../../api'
import { NAV_BY_ROLE } from './nav'

const STATIC_LABELS: { prefix: string; label: string; exact?: boolean }[] = [
  { prefix: '/dashboard/profile', label: 'Profile', exact: true },
  { prefix: '/dashboard/settings', label: 'Settings', exact: true },
  { prefix: '/dashboard/messages', label: 'Messages' },
  { prefix: '/dashboard/users/', label: 'Profile' },
  { prefix: '/dashboard/help', label: 'Help & Support' },
  { prefix: '/dashboard/support', label: 'Support Requests' },
]

/** Resolves the current dashboard route to a single page-title label for
 * TopBar. Deliberately not a multi-level breadcrumb trail — MorphoFit's
 * route tree is flat enough (one dynamic segment deep, at most) that a
 * second level would just repeat "Dashboard" everywhere. Seeded for the
 * routes that exist today rather than solved generically up front, same
 * pragmatic approach as MboaTrust's own Breadcrumbs.tsx. */
export function useBreadcrumbTrail(role: UserRole | undefined, pathname: string): string {
  const items = role ? (NAV_BY_ROLE[role] ?? []) : []
  const navMatch = items.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
  if (navMatch) return navMatch.label

  const staticMatch = STATIC_LABELS.find((entry) => (entry.exact ? pathname === entry.prefix : pathname.startsWith(entry.prefix)))
  return staticMatch?.label ?? 'Dashboard'
}
