import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api'
import { AuthShell } from '../components/auth/AuthShell'
import { PillButton } from '../components/ui/primitives'
import { Input } from '../components/ui/Input'
import { AppIcon } from '../components/ui/icons'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.auth.forgotPassword(email)
      // The API answers identically whether or not the address exists, so
      // the confirmation copy below deliberately doesn't reveal which.
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Could not send the reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`If an account exists for ${email}, we've sent a link to reset your password.`}
        footer={
          <Link to="/signin" className="font-semibold text-forest hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="rounded-2xl border border-parchment-dark bg-surface p-5 shadow-xs">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-parchment text-forest">
            <AppIcon name="mail" size={20} />
          </span>
          <p className="text-sm font-body text-ink-muted leading-relaxed">
            The link expires in 24 hours and can only be used once. If it doesn't arrive within a few
            minutes, check your spam folder.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-4 text-xs font-semibold font-body text-forest hover:underline"
          >
            Use a different email address
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address on your atelier account and we'll send you a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/signin" className="font-semibold text-forest hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
          icon="mail"
          placeholder="you@atelier.com"
        />

        {error && (
          <div className="rounded-xl border border-seal/20 bg-[var(--status-error-bg)] p-3 text-xs font-body text-[var(--status-error-text)] animate-shake">
            {error}
          </div>
        )}

        <PillButton type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </PillButton>
      </form>
    </AuthShell>
  )
}
