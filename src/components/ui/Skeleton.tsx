export function Skeleton({
  variant = 'block',
  width,
  height,
  className = '',
}: {
  variant?: 'block' | 'text' | 'circle' | 'card'
  width?: number | string
  height?: number | string
  className?: string
}) {
  const shapeClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded-md'
      : 'rounded-2xl'

  const defaultHeight =
    variant === 'text'
      ? '0.9em'
      : variant === 'circle'
      ? width ?? 40
      : variant === 'card'
      ? 140
      : 80

  return (
    <div
      aria-hidden
      className={`animate-shimmer border border-parchment-dark/70 ${shapeClass} ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? defaultHeight,
      }}
    />
  )
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({
  size = 40,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <Skeleton
      variant="circle"
      width={size}
      height={size}
      className={className}
    />
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-parchment-dark bg-surface p-5 shadow-xs ${className}`}
    >
      <Skeleton variant="card" className="mb-4" />
      <Skeleton variant="text" width="70%" className="mb-2" />
      <Skeleton variant="text" width="45%" />
    </div>
  )
}

export function SkeletonList({
  rows = 4,
  className = '',
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 rounded-2xl border border-parchment-dark bg-surface p-4 shadow-xs"
        >
          <SkeletonAvatar size={42} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="55%" />
            <Skeleton variant="text" width="35%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonPage({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width={180} height={28} />
          <Skeleton variant="text" width={120} height={14} />
        </div>
        <Skeleton width={110} height={38} className="rounded-xl" />
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
