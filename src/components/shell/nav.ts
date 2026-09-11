import type { IconName } from '../ui/icons'
import type { UserRole } from '../../api'

export interface NavItem {
  label: string
  to: string
  icon: IconName
  end?: boolean
}

// Same destinations as the previous NAV_BY_ROLE in pages/dashboard/Layout.tsx
// (unchanged routes), now iconified and shared between Sidebar and BottomNav
// — mirrors MboaTrust's single-source-of-truth TAB_ROUTES pattern.
// Settings/Profile deliberately aren't here: they live in the TopBar avatar
// menu and Sidebar footer instead, the same "Menu hub" split MboaTrust uses.
//
// Order matters beyond display: BottomNav only shows the first 5 entries on
// mobile (everything is still reachable there via the search/command
// palette, and in full on the desktop Sidebar) — so for roles with more than
// 5 destinations, Messages (a core, frequently-used real-time feature) is
// kept within the first 5 rather than pushed off the mobile bar by
// less-frequently-used pages.
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  client: [
    { label: 'Overview', to: '/dashboard', icon: 'home', end: true },
    { label: 'My Orders', to: '/dashboard/orders', icon: 'receipt' },
    { label: 'Messages', to: '/dashboard/messages', icon: 'message' },
    { label: 'Browse Tailors', to: '/dashboard/tailors', icon: 'store' },
    { label: 'Body Scan', to: '/dashboard/measurements', icon: 'camera' },
    { label: '3D Studio', to: '/dashboard/visualizer', icon: 'layers' },
    { label: 'Appointments', to: '/dashboard/appointments', icon: 'calendar' },
  ],
  stylist: [
    { label: 'Overview', to: '/dashboard', icon: 'home', end: true },
    { label: 'My Clients', to: '/dashboard/clients', icon: 'users' },
    { label: 'Orders', to: '/dashboard/orders', icon: 'receipt' },
    { label: 'Messages', to: '/dashboard/messages', icon: 'message' },
    { label: 'Style Studio', to: '/dashboard/stylist-studio', icon: 'sparkles' },
    { label: '3D Visualizer', to: '/dashboard/visualizer', icon: 'layers' },
  ],
  tailor: [
    { label: 'Overview', to: '/dashboard', icon: 'home', end: true },
    { label: 'Orders & Quotes', to: '/dashboard/orders', icon: 'receipt' },
    { label: '3D Visualizer', to: '/dashboard/visualizer', icon: 'layers' },
    { label: 'Appointments', to: '/dashboard/appointments', icon: 'calendar' },
    { label: 'Messages', to: '/dashboard/messages', icon: 'message' },
  ],
  delivery_agent: [
    { label: 'Overview', to: '/dashboard', icon: 'home', end: true },
    { label: 'Delivery Radar', to: '/dashboard/delivery-radar', icon: 'navigation' },
    { label: 'Deliveries', to: '/dashboard/orders', icon: 'truck' },
    { label: 'Messages', to: '/dashboard/messages', icon: 'message' },
  ],
  admin: [
    { label: 'Overview', to: '/dashboard', icon: 'home', end: true },
    { label: 'All Users', to: '/dashboard/users', icon: 'shieldCheck', end: true },
    { label: 'All Orders', to: '/dashboard/orders', icon: 'receipt' },
    { label: 'Messages', to: '/dashboard/messages', icon: 'message' },
    { label: 'Service Catalog', to: '/dashboard/catalog', icon: 'box' },
    { label: 'Reports & Stats', to: '/dashboard/reports', icon: 'barChart' },
    { label: 'Support Requests', to: '/dashboard/support', icon: 'lifeBuoy' },
  ],
}

export const ROLE_LABEL: Record<UserRole, string> = {
  client: 'Client',
  stylist: 'Stylist',
  tailor: 'Tailor',
  delivery_agent: 'Delivery Agent',
  admin: 'Admin',
}
