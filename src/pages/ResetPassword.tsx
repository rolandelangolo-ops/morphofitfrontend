import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api } from '../api'
import { AuthShell } from '../components/auth/AuthShell'
import { PillButton } from '../components/ui/primitives'
import { Input } from '../components/ui/Input'
import { AppIcon } from '../components/ui/icons'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('The two passwords don\'t match')

    setLoading(true)
    try {
      const { token: sessionToken } = await api.auth.resetPassword(token, password)
      // The endpoint returns a fresh session, so land the user straight in
      // the dashboard rather than making them sign in again.
      localStorage.setItem('morphofit_token', sessionToken)
      window.location.assign('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Could not reset your password. The link may have expired.')
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="This link is incomplete"
        subtitle="The reset link is missing its token. Request a fresh one to continue."
        footer={
          <Link to="/signin" className="font-semibold text-forest hover:underline">
            Back to sign in
          </Link>
        }
      >
        <PillButton variant="primary" size="lg" fullWidth onClick={() => navigate('/forgot-password')}>
          Request a new link
        </PillButton>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you haven't used before. You'll be signed in straight after."
      footer={
        <Link to="/signin" className="font-semibold text-forest hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
          icon="shieldCheck"
          placeholder="At least 6 characters"
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="p-1 text-ink-subtle transition-colors hover:text-ink"
            >
              <AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
            </button>
          }
        />

        <Input
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={setConfirm}
          required
          autoComplete="new-password"
          icon="shieldCheck"
          placeholder="Repeat it"
        />

        {error && (
          <div className="rounded-xl border border-seal/20 bg-[var(--status-error-bg)] p-3 text-xs font-body text-[var(--status-error-text)] animate-shake">
            {error}
          </div>
        )}

        <PillButton type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          {loading ? 'Updating…' : 'Set new password'}
        </PillButton>
      </form>
    </AuthShell>
  )
}
