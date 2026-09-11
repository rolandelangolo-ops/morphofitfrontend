import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../api'
import { AuthShell } from '../components/auth/AuthShell'
import { PillButton } from '../components/ui/primitives'
import { AppIcon } from '../components/ui/icons'

type State = 'verifying' | 'success' | 'error' | 'missing'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [state, setState] = useState<State>(token ? 'verifying' : 'missing')
  const [message, setMessage] = useState('')
  // React 18/19 StrictMode double-invokes effects in dev; the token is
  // single-use, so a second call would report a spurious failure.
  const attempted = useRef(false)

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true
    api.auth
      .verifyEmail(token)
      .then((res) => {
        setMessage(res.email)
        setState('success')
      })
      .catch((err: any) => {
        setMessage(err.message || 'This verification link is invalid or has expired.')
        setState('error')
      })
  }, [token])

  const isSignedIn = Boolean(localStorage.getItem('morphofit_token'))
  const destination = isSignedIn ? '/dashboard' : '/signin'

  if (state === 'verifying') {
    return (
      <AuthShell title="Confirming your email…" subtitle="One moment while we verify this link.">
        <div className="flex items-center gap-3 rounded-2xl border border-parchment-dark bg-surface p-5 shadow-xs">
          <span className="inline-block h-5 w-5 animate-spin-smooth rounded-full border-2 border-forest border-t-transparent" />
          <span className="text-sm font-body text-ink-muted">Verifying…</span>
        </div>
      </AuthShell>
    )
  }

  if (state === 'success') {
    return (
      <AuthShell
        title="Email confirmed"
        subtitle={`${message} is now verified. Your account is fully secured and password recovery is enabled.`}
      >
        <div className="rounded-2xl border border-parchment-dark bg-surface p-5 shadow-xs">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--status-success-bg)] text-[var(--status-success-text)]">
            <AppIcon name="checkCircle" size={20} />
          </span>
          <p className="mb-4 text-sm font-body text-ink-muted leading-relaxed">
            Thanks for confirming. You can head back to your atelier workspace.
          </p>
          <PillButton variant="primary" size="lg" fullWidth onClick={() => window.location.assign(destination)}>
            {isSignedIn ? 'Go to dashboard' : 'Sign in'}
          </PillButton>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={state === 'missing' ? 'This link is incomplete' : "We couldn't confirm that link"}
      subtitle={
        state === 'missing'
          ? 'The verification link is missing its token.'
          : message
      }
      footer={
        <Link to={destination} className="font-semibold text-forest hover:underline">
          {isSignedIn ? 'Back to dashboard' : 'Back to sign in'}
        </Link>
      }
    >
      <div className="rounded-2xl border border-parchment-dark bg-surface p-5 shadow-xs">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]">
          <AppIcon name="alert" size={20} />
        </span>
        <p className="text-sm font-body text-ink-muted leading-relaxed">
          Verification links expire after 24 hours and can only be used once. You can request a fresh
          one from Settings once you're signed in.
        </p>
      </div>
    </AuthShell>
  )
}
