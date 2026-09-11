// ═══════════════════════════════════════════════════════════════════════════
// MorphoFit — Obsidian & Gold Design Tokens
//
// These resolve through CSS custom properties (see src/index.css) so every
// C.xxx reference automatically follows the active theme.
//
// ⚠ USAGE GUIDANCE:
// Prefer Tailwind utility classes in JSX (e.g. `text-forest`, `bg-surface`,
// `border-parchment-dark`). The C and FONT objects below should only be used
// for Three.js/WebGL programmatic styling, Framer Motion style animations,
// or truly dynamic conditional styles that Tailwind can't express.
// ═══════════════════════════════════════════════════════════════════════════

export const C = {
  forest: 'var(--color-forest)',
  forestLight: 'var(--color-forest-light)',
  navActive: 'var(--color-nav-active)',
  forestDark: 'var(--color-forest-dark)',
  amber: 'var(--color-amber)',
  amberLight: 'var(--color-amber-light)',
  ink: 'var(--color-ink)',
  inkMuted: 'var(--color-ink-muted)',
  inkSubtle: 'var(--color-ink-subtle)',
  parchment: 'var(--color-parchment)',
  parchmentDark: 'var(--color-parchment-dark)',
  cream: 'var(--color-cream)',
  seal: 'var(--color-seal)',
  white: 'var(--color-surface)',
  glassBg: 'var(--surface-glass-bg)',
  glassBorder: 'var(--surface-glass-border)',
  navGlassBg: 'var(--nav-glass-bg)',
  navGlassBorder: 'var(--nav-glass-border)',
  borderBright: 'var(--border-bright)',
  glowPrimary: 'var(--glow-primary)',
  shadowSm: 'var(--shadow-sm)',
  shadowMd: 'var(--shadow-md)',
  shadowLg: 'var(--shadow-lg)',
  shadowXl: 'var(--shadow-xl)',
  glowForest: 'rgba(var(--glow-primary-rgb), 0.35)',
  glowAmber: 'rgba(var(--glow-amber-rgb), 0.35)',
  gradientPrimary: 'var(--gradient-primary)',
  gradientSurface: 'var(--gradient-surface)',
  gradientAmber: 'var(--gradient-amber)',
  gradientMesh: 'var(--gradient-mesh)',
}

// ── Typography ────────────────────────────────────────────────────────────
// Prefer CSS utility classes in JSX: .font-display, .font-body, .font-data,
// .text-eyebrow, .text-caption (defined in index.css).
// Use FONT object only for programmatic/Three.js contexts.
export const FONT = {
  serif: "'Fraunces', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
}

// ── Spacing scale (px) ───────────────────────────────────────────────────
export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64,
} as const

// ── Border radius scale (px) ─────────────────────────────────────────────
export const RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999,
} as const

// ── Elevation levels ─────────────────────────────────────────────────────
export const ELEVATION = {
  1: 'var(--shadow-sm)',
  2: 'var(--shadow-md)',
  3: 'var(--shadow-lg)',
  4: 'var(--shadow-xl)',
} as const

// ── Status tones ─────────────────────────────────────────────────────────
export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'
export const STATUS_TONE_VARS: Record<StatusTone, { bg: string; text: string }> = {
  success: { bg: 'var(--status-success-bg)', text: 'var(--status-success-text)' },
  warning: { bg: 'var(--status-warning-bg)', text: 'var(--status-warning-text)' },
  error: { bg: 'var(--status-error-bg)', text: 'var(--status-error-text)' },
  info: { bg: 'var(--status-info-bg)', text: 'var(--status-info-text)' },
  neutral: { bg: 'var(--status-neutral-bg)', text: 'var(--status-neutral-text)' },
}
