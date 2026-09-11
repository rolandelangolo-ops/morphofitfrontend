import type { ReactNode } from 'react'
import type { IconName } from '@/components/ui/icons'
import { AppIcon } from '@/components/ui/icons'
import { Header, PillButton, Card } from '@/components/ui/primitives'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export interface PageShellProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  empty?: {
    icon: IconName
    title: string
    description?: string
    action?: ReactNode
  }
  className?: string
}

export function PageShell({
  title,
  subtitle,
  actions,
  children,
  loading = false,
  error,
  onRetry,
  empty,
  className = '',
}: PageShellProps) {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Header title={title} subtitle={subtitle} />
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content area */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <Card className="p-8" style={{ background: 'var(--gradient-mesh)' }}>
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--status-error-bg)]">
              <AppIcon
                name="alert"
                size={26}
                className="text-[var(--status-error-text)]"
              />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold text-ink">
                Something went wrong
              </p>
              <p className="mt-1.5 max-w-sm font-sans text-sm text-ink-subtle">
                {error}
              </p>
            </div>
            {onRetry && (
              <PillButton variant="secondary" onClick={onRetry}>
                Try Again
              </PillButton>
            )}
          </div>
        </Card>
      ) : empty && !children ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      ) : (
        <div className={className}>{children}</div>
      )}
    </div>
  )
}

export default PageShell
