import type { ReactNode, KeyboardEvent, CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../theme'
import { STATUS_TONE_VARS, type StatusTone } from './tokens'
import { AppIcon, type IconName } from './icons'

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: 'neutral', label: 'Pending' },
  negotiating: { tone: 'warning', label: 'Negotiating' },
  confirmed: { tone: 'info', label: 'Confirmed' },
  production: { tone: 'warning', label: 'In Production' },
  ready: { tone: 'success', label: 'Ready' },
  assigned: { tone: 'info', label: 'Assigned' },
  out: { tone: 'warning', label: 'Out for Delivery' },
  delivered: { tone: 'success', label: 'Delivered' },
  requested: { tone: 'neutral', label: 'Requested' },
  declined: { tone: 'error', label: 'Declined' },
  completed: { tone: 'success', label: 'Completed' },
  open: { tone: 'info', label: 'Open' },
  in_progress: { tone: 'warning', label: 'In Progress' },
  resolved: { tone: 'success', label: 'Resolved' },
  closed: { tone: 'neutral', label: 'Closed' },
}

export function StatusBadge({
  status,
  size = 'md',
  className = '',
}: {
  status: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const s = STATUS_MAP[status] ?? { tone: 'neutral' as const, label: status }
  const { bg, text } = STATUS_TONE_VARS[s.tone]

  const sizeClass =
    size === 'sm'
      ? 'text-[9px] px-2 py-0.5'
      : 'text-[10px] px-2.5 py-1'

  return (
    <span
      style={{ background: bg, color: text }}
      className={`inline-flex items-center font-data font-semibold uppercase tracking-wider rounded-full whitespace-nowrap shadow-xs ${sizeClass} ${className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {s.label}
    </span>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({
  pct,
  color,
}: {
  pct: number
  color?: string
}) {
  return (
    <div className="w-full h-1.5 rounded-full bg-parchment-dark overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: color || 'var(--color-forest)',
        }}
      />
    </div>
  )
}

// ── Theme toggle ─────────────────────────────────────────────────────────────
export function ThemeToggle({ dark }: { dark?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
        dark
          ? 'bg-white/10 text-white hover:bg-white/20'
          : 'bg-parchment text-ink hover:bg-parchment-dark/70'
      }`}
    >
      {theme === 'dark' ? (
        <AppIcon name="sun" size={15} strokeWidth={1.75} className="text-forest" />
      ) : (
        <AppIcon name="moon" size={15} strokeWidth={1.75} className="text-ink" />
      )}
    </button>
  )
}

// ── User avatar ──────────────────────────────────────────────────────────────
export function UserAvatar({
  onClick,
  size = 36,
  status,
  className = '',
}: {
  onClick?: () => void
  size?: number
  status?: 'online' | 'busy' | 'offline'
  className?: string
}) {
  const { user } = useAuth()
  const Tag = onClick ? 'button' : 'div'

  return (
    <div className="relative inline-flex flex-shrink-0">
      <Tag
        onClick={onClick}
        aria-label="Account menu"
        className={`flex items-center justify-center overflow-hidden rounded-full font-bold font-display bg-forest text-white shadow-sm ring-2 ring-forest/20 transition-transform active:scale-95 ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.42),
        }}
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : user?.name ? (
          user.name[0].toUpperCase()
        ) : (
          'M'
        )}
      </Tag>

      {status && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${
            status === 'online'
              ? 'bg-emerald-500'
              : status === 'busy'
              ? 'bg-amber-500'
              : 'bg-neutral-400'
          }`}
        />
      )}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = '',
  style,
  onClick,
  variant = 'default',
  padding = 'md',
  hover = false,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
  variant?: 'default' | 'elevated' | 'glass' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}) {
  const paddingClass =
    padding === 'none'
      ? ''
      : padding === 'sm'
      ? 'p-4'
      : padding === 'lg'
      ? 'p-6 sm:p-8'
      : 'p-5 sm:p-6'

  const variantClass =
    variant === 'glass'
      ? 'bg-surface-glass-bg border border-surface-glass-border backdrop-blur-xl shadow-md'
      : variant === 'elevated'
      ? 'bg-surface border-0 shadow-lg'
      : 'bg-surface border border-parchment-dark shadow-xs'

  const hoverClass =
    hover || variant === 'interactive'
      ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-forest/40'
      : ''

  const baseContent = (
    <div
      className={`rounded-2xl ${variantClass} ${paddingClass} ${hoverClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  )

  if (!onClick) return baseContent

  const a11yProps = {
    role: 'button' as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
  }

  if (variant === 'interactive') {
    return (
      <motion.div
        {...a11yProps}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        className="cursor-pointer"
      >
        {baseContent}
      </motion.div>
    )
  }

  return (
    <div {...a11yProps} className="cursor-pointer">
      {baseContent}
    </div>
  )
}

// ── Pill button ──────────────────────────────────────────────────────────────
export function PillButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: IconName
}) {
  const sizeClasses = {
    sm: 'px-3.5 py-2 text-xs rounded-lg gap-1.5',
    md: 'px-4.5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5 font-semibold',
  }[size]

  const variantClasses = {
    primary:
      'bg-forest text-white shadow-md hover:brightness-105 active:brightness-95 border border-forest-light/20',
    secondary:
      'bg-parchment text-ink border border-parchment-dark hover:bg-parchment-dark/60 active:bg-parchment-dark',
    ghost:
      'bg-transparent text-forest border border-forest/30 hover:bg-forest/10 active:bg-forest/20',
    danger:
      'bg-[var(--status-error-bg)] text-[var(--status-error-text)] border border-seal/20 hover:brightness-95 active:brightness-90',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium font-body transition-all duration-200 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeClasses} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin-smooth rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <AppIcon name={icon} size={size === 'sm' ? 14 : 16} />
      ) : null}
      <span>{children}</span>
    </button>
  )
}

// ── Screen header ─────────────────────────────────────────────────────────────
export function Header({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold font-display tracking-tight text-ink truncate sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1 text-caption font-data text-ink-subtle uppercase tracking-wider truncate">
              {subtitle}
            </div>
          )}
        </div>
        {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

// ── Step indicator (horizontal numbered stages) ───────────────────────────────
export function StepIndicator({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  return (
    <div className="flex items-center gap-2 w-full overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const isDone = i < current
        const isCurrent = i === current

        return (
          <div key={s} className="flex items-center gap-2 flex-1 min-w-[120px]">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-data transition-all duration-300 flex-shrink-0 ${
                  isDone
                    ? 'bg-forest text-white'
                    : isCurrent
                    ? 'bg-forest text-white ring-4 ring-forest/20'
                    : 'bg-parchment text-ink-subtle'
                }`}
              >
                {isDone ? (
                  <AppIcon name="check" size={13} strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[11px] font-data uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-forest font-semibold'
                    : isDone
                    ? 'text-ink font-medium'
                    : 'text-ink-subtle'
                }`}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded-full transition-colors ${
                  isDone ? 'bg-forest' : 'bg-parchment-dark'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Vertical timeline (status stepper) ─────────────────────────────────────────
export function VerticalSteps({
  steps,
}: {
  steps: { label: string; time: string; done: boolean; current?: boolean }[]
}) {
  return (
    <div className="space-y-0">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                s.done
                  ? 'bg-forest text-white shadow-xs'
                  : s.current
                  ? 'bg-amber text-white ring-4 ring-amber/20'
                  : 'bg-parchment text-ink-subtle'
              }`}
            >
              {s.done ? (
                <AppIcon name="check" size={14} strokeWidth={2.5} />
              ) : s.current ? (
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              ) : (
                <span className="font-data text-xs">{i + 1}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-0.5 h-8 my-1 rounded-full transition-colors ${
                  s.done ? 'bg-forest' : 'bg-parchment-dark'
                }`}
              />
            )}
          </div>
          <div className="pb-4">
            <div className="text-sm font-semibold font-body text-ink">{s.label}</div>
            <div className="text-[10px] font-data text-ink-subtle mt-0.5">{s.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Dashboard hero ───────────────────────────────────────────────────────────
export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  stats,
  background,
  action,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  stats: { label: string; value: string }[]
  background?: string
  action?: ReactNode
}) {
  return (
    <div
      className="rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
      style={{
        background: background ?? 'var(--gradient-primary)',
      }}
    >
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-caption font-data text-white/70 uppercase tracking-widest">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold font-display text-white sm:text-3xl tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-xl text-sm font-body text-white/80 sm:text-base leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {stats.length > 0 && (
        <div className="relative z-10 mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-md transition-transform hover:scale-[1.02]"
            >
              <div className="text-xl font-bold font-display text-white">{value}</div>
              <div className="mt-1 text-[10px] font-data uppercase tracking-widest text-white/70">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
