import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Split-panel chrome shared by the email-driven auth screens (forgot
 * password, reset password, verify email) so they read as part of the same
 * flow as SignIn/Register rather than bare utility pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-cream font-body text-ink">
      {/* Editorial photography panel — desktop only */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&h=1200&fit=crop&auto=format"
          alt="Haute couture tailoring"
          className="h-full w-full object-cover saturate-90"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(10,9,8,0.2) 0%, transparent 40%, var(--color-cream) 98%)',
          }}
        />
        <div className="absolute bottom-16 left-12 right-12">
          <h2 className="max-w-md text-4xl font-bold font-display text-white leading-tight drop-shadow-md">
            Your body.<br />
            <em className="italic text-forest-light">Your blueprint.</em><br />
            Your bespoke garment.
          </h2>
          <p className="mt-4 text-xs font-data uppercase tracking-[0.3em] text-white/80">
            MorphoFit Atelier
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:max-w-xl">
        <div className="w-full max-w-sm sm:max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-3 group">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-md ring-2 ring-forest/20 transition-transform group-hover:scale-105"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <span className="text-xl font-bold font-display text-white">M</span>
            </div>
            <span className="text-xl font-bold font-display text-ink tracking-tight">MorphoFit</span>
          </Link>

          <h1 className="text-3xl font-bold font-display text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 mb-8 text-sm font-body text-ink-muted">{subtitle}</p>}

          {children}

          {footer && <div className="mt-8 text-center text-xs sm:text-sm font-body text-ink-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
