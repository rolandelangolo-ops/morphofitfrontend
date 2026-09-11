import type { ReactNode } from 'react'
import { AppIcon, type IconName } from './icons'

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'default',
  illustration = 'float',
}: {
  icon: IconName
  title: string
  description?: string
  action?: ReactNode
  tone?: 'default' | 'success' | 'error'
  illustration?: 'float' | 'none'
}) {
  const ringClass =
    tone === 'success'
      ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
      : tone === 'error'
      ? 'bg-[var(--status-error-bg)] text-[var(--status-error-text)]'
      : 'bg-forest/10 text-forest'

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-parchment-dark/80 px-6 py-14 text-center shadow-xs"
      style={{ background: 'var(--gradient-mesh)' }}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs ${ringClass} ${
          illustration === 'float' ? 'animate-float' : ''
        }`}
      >
        <AppIcon name={icon} size={28} strokeWidth={1.75} />
      </div>

      <div className="max-w-sm">
        <h3 className="text-lg font-bold font-display text-ink tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 text-sm font-body text-ink-subtle leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export default EmptyState
