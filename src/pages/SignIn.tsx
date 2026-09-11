import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../AuthContext'
import { PillButton } from '../components/ui/primitives'
import { Input } from '../components/ui/Input'
import { Chip } from '../components/ui/Chip'
import { AppIcon } from '../components/ui/icons'

const DEMO_ACCOUNTS = [
  { role: 'Client', email: 'client@morphofit.com' },
  { role: 'Stylist', email: 'stylist@morphofit.com' },
  { role: 'Tailor', email: 'tailor@morphofit.com' },
  { role: 'Delivery', email: 'delivery@morphofit.com' },
  { role: 'Admin', email: 'admin@morphofit.com' },
]

export default function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('password123')
    setError('')
  };

  return (
    <div className="flex min-h-screen bg-cream font-body text-ink">
      {/* ── Left panel — Editorial Photography ─────────────────────────── */}
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

      {/* ── Right panel — Sign In Form ──────────────────────────────────── */}
      <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:max-w-xl">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Logo */}
          <Link to="/" className="mb-8 inline-flex items-center gap-3 group">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-md ring-2 ring-forest/20 group-hover:scale-105 transition-transform"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <span className="text-xl font-bold font-display text-white">M</span>
            </div>
            <span className="text-xl font-bold font-display text-ink tracking-tight">
              MorphoFit
            </span>
          </Link>

          <h1 className="text-3xl font-bold font-display text-ink tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 mb-8 text-sm font-body text-ink-muted">
            Sign in to access your bespoke atelier workspace.
          </p>

          {/* Quick Demo Accounts Selection */}
          <div className="mb-6 rounded-2xl border border-parchment-dark bg-surface p-4 shadow-xs">
            <div className="mb-2.5 text-[10px] font-data font-semibold uppercase tracking-widest text-ink-subtle">
              Instant Demo Access
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <Chip
                  key={d.email}
                  selected={email === d.email}
                  onClick={() => fillDemo(d.email)}
                >
                  {d.role}
                </Chip>
              ))}
            </div>
          </div>

          {/* Form */}
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

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
              icon="shieldCheck"
              placeholder="••••••••"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-ink-subtle hover:text-ink transition-colors p-1"
                >
                  <AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              }
            />

            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold font-body text-forest hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-xl border border-seal/20 bg-[var(--status-error-bg)] p-3 text-xs font-body text-[var(--status-error-text)] animate-shake">
                {error}
              </div>
            )}

            <PillButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </PillButton>
          </form>

          <p className="mt-8 text-center text-xs sm:text-sm font-body text-ink-muted">
            Don't have an atelier account?{' '}
            <Link
              to="/register"
              className="font-semibold text-forest hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
