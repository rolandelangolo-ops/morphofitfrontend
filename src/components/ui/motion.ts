import type { Transition, Variants } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════
// MorphoFit — Motion System
// Shared Framer Motion vocabulary for consistent, premium animations.
// ═══════════════════════════════════════════════════════════════════════════

// ── Easing curves ────────────────────────────────────────────────────────
export const easeDecel = [0.2, 0.7, 0.2, 1] as const
export const easeBounce = [0.2, 1.4, 0.4, 1] as const
export const easeSmooth = [0.4, 0.0, 0.2, 1] as const

// ── Spring presets ───────────────────────────────────────────────────────
export const springSnappy = { type: 'spring' as const, stiffness: 400, damping: 34 }
export const springGentle = { type: 'spring' as const, stiffness: 300, damping: 28 }
export const microBounce = { type: 'spring' as const, stiffness: 500, damping: 32 }

// ── Fade + translate up (list items, cards entering) ─────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeDecel } },
}

// ── Stagger container (parent wraps children for sequential entrance) ────
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

// ── List item (for staggered list row entrance) ──────────────────────────
export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeDecel } },
}

// ── Scale-in (modals, dropdowns, popovers) ───────────────────────────────
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: easeBounce } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: easeDecel } },
}

// ── Slide in from right (master-detail mobile panels) ────────────────────
export const slideInRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  show: { x: 0, opacity: 1, transition: { duration: 0.3, ease: easeDecel } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2, ease: easeSmooth } },
}

// ── Slide in from bottom (mobile sheets) ─────────────────────────────────
export const slideInBottom: Variants = {
  hidden: { y: '100%', opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.3, ease: easeDecel } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2, ease: easeSmooth } },
}

// ── Collapse height (accordion sections, expandable cards) ───────────────
export const collapseHeight: Variants = {
  hidden: { height: 0, opacity: 0, overflow: 'hidden' },
  show: { height: 'auto', opacity: 1, overflow: 'hidden', transition: { duration: 0.3, ease: easeDecel } },
  exit: { height: 0, opacity: 0, overflow: 'hidden', transition: { duration: 0.2, ease: easeSmooth } },
}

// ── Page transitions ─────────────────────────────────────────────────────
// Opacity-only — a transformed ancestor breaks position:sticky/fixed for
// descendants (shell's sticky TopBar / fixed BottomNav), so the page-
// transition wrapper in AppShell must never set x/y/scale.
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const pageTransition: Transition = { duration: 0.28, ease: easeDecel }
