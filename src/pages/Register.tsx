import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../AuthContext'
import { PillButton } from '../components/ui/primitives'
import { Input } from '../components/ui/Input'
import { AppIcon, type IconName } from '../components/ui/icons'

const ROLES: {
  value: string
  label: string
  description: string
  icon: IconName
}[] = [
  {
    value: 'client',
    label: 'Client',
    description: 'Get measured and commission bespoke garments',
    icon: 'user',
  },
  {
    value: 'stylist',
    label: 'Stylist',
    description: 'Provide morphology analysis & style briefs',
    icon: 'sparkles',
  },
  {
    value: 'tailor',
    label: 'Tailor',
    description: 'Cut, draft patterns, and produce garments',
    icon: 'scissors',
  },
  {
    value: 'delivery_agent',
    label: 'Courier',
    description: 'Pick up and deliver finished atelier orders',
    icon: 'truck',
  },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('client')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 6
      ? 1
      : password.length < 10
      ? 2
      : 3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password, role)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-cream font-body text-ink">
      {/* ── Left panel — Editorial Photography ─────────────────────────── */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&h=1200&fit=crop&auto=format"
          alt="Artisanal tailor atelier"
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
            Join a platform where{' '}
            <em className="italic text-forest-light">craft meets precision.</em>
          </h2>
          <p className="mt-4 text-xs font-data uppercase tracking-[0.3em] text-white/80">
            MorphoFit Haute Couture Network
          </p>
        </div>
      </div>

      {/* ── Right panel — Registration Form ─────────────────────────────── */}
      <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:max-w-2xl">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Logo */}
          <Link to="/" className="mb-6 inline-flex items-center gap-3 group">
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
            Create account
          </h1>
          <p className="mt-1.5 mb-6 text-sm font-body text-ink-muted">
            Select your discipline to join the bespoke platform.
          </p>

          {/* Role selector cards */}
          <div className="mb-6">
            <span className="mb-2 block text-[10px] font-data font-semibold uppercase tracking-widest text-ink-subtle">
              Select Your Role
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLES.map((r) => {
                const isActive = role === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                      isActive
                        ? 'border-forest bg-forest/10 ring-1 ring-forest text-forest shadow-xs'
                        : 'border-parchment-dark bg-surface text-ink-muted hover:border-forest/40 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                          isActive
                            ? 'bg-forest text-white'
                            : 'bg-parchment text-ink-subtle'
                        }`}
                      >
                        <AppIcon name={r.icon} size={13} />
                      </span>
                      <span className="text-sm font-semibold font-body text-ink">
                        {r.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-body text-ink-subtle leading-tight line-clamp-2">
                      {r.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              value={name}
              onChange={setName}
              required
              autoComplete="name"
              icon="user"
              placeholder="e.g. Samuel Eto'o"
            />

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

            <div className="space-y-1.5">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                required
                autoComplete="new-password"
                icon="shieldCheck"
                placeholder="Min. 6 characters"
              />

              {password.length > 0 && (
                <div className="flex items-center gap-1.5 px-1">
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength >= 1 ? 'bg-amber' : 'bg-parchment-dark'
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength >= 2 ? 'bg-forest' : 'bg-parchment-dark'
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-parchment-dark'
                    }`}
                  />
                  <span className="text-[10px] font-data text-ink-subtle ml-1">
                    {passwordStrength === 1
                      ? 'Weak'
                      : passwordStrength === 2
                      ? 'Medium'
                      : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              autoComplete="new-password"
              icon="shieldCheck"
              placeholder="Repeat your password"
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
            />

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
              {loading ? 'Creating account…' : 'Create Account'}
            </PillButton>
          </form>

          <p className="mt-8 text-center text-xs sm:text-sm font-body text-ink-muted">
            Already have an atelier account?{' '}
            <Link
              to="/signin"
              className="font-semibold text-forest hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
