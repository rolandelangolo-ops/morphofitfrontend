import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../AuthContext'
import type { UserRole } from '../api'

/** Route-level enforcement of the same per-role destinations NAV_BY_ROLE
 * (components/shell/nav.ts) uses to decide what to show in the Sidebar/
 * BottomNav — hiding a link isn't access control, so a user who types the
 * URL directly is redirected back to their own Overview instead of being
 * able to load a page meant for another role. */
export function RoleGate({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return null
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
