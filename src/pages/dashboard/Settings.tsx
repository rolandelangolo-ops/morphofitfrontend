import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../theme'
import { api, type UserRich } from '../../api'
import { Card, PillButton } from '../../components/ui/primitives'
import { Input } from '../../components/ui/Input'
import { Switch } from '../../components/ui/Switch'
import { ConfirmDialog } from '../../components/ui/Modal'
import { PageShell } from '../../components/ui/PageShell'
import { useToast } from '../../components/ui/Toast'

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="mb-4 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
      {children}
    </div>
  )
}

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { show } = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<UserRich | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const loadProfile = () => {
    setLoading(true)
    setError(null)
    api.users
      .me()
      .then((p) => {
        setProfile(p)
        setName(p.name)
        setPhone(p.phone || '')
        setCity(p.city || '')
        setBio(p.bio || '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load your settings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAccount(true)
    try {
      const updated = await api.users.updateMe({ name, phone, city, bio })
      setProfile(updated)
      updateUser({ name: updated.name, city: updated.city })
      show({ title: 'Atelier profile updated', tone: 'success' })
    } catch (err) {
      show({
        title: "Couldn't save profile",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setSavingAccount(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setSavingPassword(true)
    try {
      await api.users.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      show({ title: 'Password updated successfully', tone: 'success' })
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Unable to change password'
      )
    } finally {
      setSavingPassword(false)
    }
  }

  const toggleNotificationPref = async (
    key: 'appointments' | 'orders' | 'messages' | 'support',
    value: boolean
  ) => {
    if (!profile) return
    const previous = profile
    setProfile({
      ...profile,
      notificationPrefs: { ...profile.notificationPrefs, [key]: value },
    })
    try {
      await api.users.updateMe({ notificationPrefs: { [key]: value } })
    } catch {
      setProfile(previous)
      show({ title: "Couldn't update notification preference", tone: 'error' })
    }
  }

  const toggleEmailPref = async (
    key: 'appointments' | 'orders' | 'messages' | 'support',
    value: boolean
  ) => {
    if (!profile) return
    const previous = profile
    setProfile({ ...profile, emailPrefs: { ...profile.emailPrefs, [key]: value } })
    try {
      await api.users.updateMe({ emailPrefs: { [key]: value } })
    } catch {
      setProfile(previous)
      show({ title: "Couldn't update email preference", tone: 'error' })
    }
  }

  const resendVerification = async () => {
    setResendingVerification(true)
    try {
      const res = await api.auth.resendVerification()
      show({
        title: res.alreadyVerified ? 'Already verified' : 'Verification email sent',
        description: res.alreadyVerified
          ? 'This address is confirmed.'
          : 'Check your inbox for the confirmation link.',
        tone: 'success',
      })
    } catch (err) {
      show({
        title: "Couldn't send verification email",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setResendingVerification(false)
    }
  }

  const downloadData = async () => {
    try {
      const data = await api.users.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'morphofit-data-export.json'
      a.click()
      URL.revokeObjectURL(url)
      show({ title: 'Data export downloaded', tone: 'success' })
    } catch (err) {
      show({
        title: "Couldn't export data",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    }
  }

  const deactivate = async () => {
    setDeactivating(true)
    try {
      await api.users.deactivate()
      logout()
      navigate('/')
    } catch (err) {
      show({
        title: "Couldn't deactivate account",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setDeactivating(false)
      setConfirmDeactivate(false)
    }
  }

  if (!user) return null

  return (
    <PageShell
      title="Settings"
      subtitle="Workspace preferences, atelier credentials & security"
      loading={loading}
      error={error}
      onRetry={loadProfile}
    >
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* ── Theme & Interface ───────────────────────────────────────── */}
        <Card className="p-6">
          <SectionTitle>Interface & Theme</SectionTitle>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold font-body text-ink">
                Obsidian Dark Palette
              </div>
              <p className="text-xs font-body text-ink-subtle mt-0.5">
                Toggle between obsidian night and warm parchment day modes.
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onChange={toggleTheme}
              label=""
            />
          </div>
        </Card>

        {/* ── Account Details ─────────────────────────────────────────── */}
        <Card className="p-6">
          <SectionTitle>Atelier Profile</SectionTitle>
          <form onSubmit={saveAccount} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={name}
                onChange={setName}
                required
                icon="user"
              />
              <Input
                label="Phone number"
                value={phone}
                onChange={setPhone}
                placeholder="+237 6XX XXX XXX"
                icon="phone"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="City / Atelier Hub"
                value={city}
                onChange={setCity}
                placeholder="e.g. Douala / Yaoundé"
                icon="mapPin"
              />
              <Input
                label="Account email"
                value={profile?.email || user.email}
                onChange={() => {}}
                disabled
                icon="mail"
                hint="Verified atelier identifier (immutable)"
              />
            </div>

            <Input
              label="Biography & atelier notes"
              value={bio}
              onChange={setBio}
              multiline
              rows={3}
              placeholder="Tell clients or tailors about your style sensibilities and background."
            />

            <div>
              <PillButton
                type="submit"
                variant="primary"
                loading={savingAccount}
              >
                {savingAccount ? 'Saving changes…' : 'Save changes'}
              </PillButton>
            </div>
          </form>
        </Card>

        {/* ── Security & Credentials ──────────────────────────────────── */}
        <Card className="p-6">
          <SectionTitle>Security & Password</SectionTitle>
          <form onSubmit={savePassword} className="space-y-4">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              required
              placeholder="••••••••"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                required
                placeholder="Min. 6 characters"
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                required
                placeholder="Repeat new password"
              />
            </div>

            {passwordError && (
              <div className="rounded-xl border border-seal/20 bg-[var(--status-error-bg)] p-3 text-xs font-body text-[var(--status-error-text)] animate-shake">
                {passwordError}
              </div>
            )}

            <div>
              <PillButton
                type="submit"
                variant="secondary"
                loading={savingPassword}
              >
                {savingPassword ? 'Updating…' : 'Change password'}
              </PillButton>
            </div>
          </form>
        </Card>

        {/* ── Notifications ───────────────────────────────────────────── */}
        {profile && (
          <Card className="p-6">
            <SectionTitle>Live Notifications</SectionTitle>
            <div className="space-y-4 divide-y divide-parchment-dark">
              <div className="pt-2 first:pt-0">
                <Switch
                  checked={profile.notificationPrefs.appointments}
                  onChange={(v) => toggleNotificationPref('appointments', v)}
                  label="Fitting appointments & schedule reminders"
                />
              </div>
              <div className="pt-4">
                <Switch
                  checked={profile.notificationPrefs.orders}
                  onChange={(v) => toggleNotificationPref('orders', v)}
                  label="Order progress, negotiation updates & escrow releases"
                />
              </div>
              <div className="pt-4">
                <Switch
                  checked={profile.notificationPrefs.messages}
                  onChange={(v) => toggleNotificationPref('messages', v)}
                  label="Real-time direct messages & attachments"
                />
              </div>
              <div className="pt-4">
                <Switch
                  checked={profile.notificationPrefs.support}
                  onChange={(v) => toggleNotificationPref('support', v)}
                  label="Support updates & replies to your requests"
                />
              </div>
            </div>
          </Card>
        )}

        {/* ── Email notifications ─────────────────────────────────────── */}
        {profile && (
          <Card className="p-6">
            <SectionTitle>Email Notifications</SectionTitle>

            {!profile.emailVerified && (
              <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--status-warning-text)]/25 bg-[var(--status-warning-bg)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold font-body text-[var(--status-warning-text)]">
                    Confirm your email address
                  </div>
                  <div className="mt-0.5 text-xs font-body text-[var(--status-warning-text)]/85">
                    Verifying {profile.email} secures your account and enables password recovery.
                  </div>
                </div>
                <PillButton
                  variant="secondary"
                  size="sm"
                  onClick={resendVerification}
                  loading={resendingVerification}
                >
                  {resendingVerification ? 'Sending…' : 'Resend link'}
                </PillButton>
              </div>
            )}

            <p className="mb-4 text-xs font-body text-ink-muted leading-relaxed">
              Choose what reaches your inbox. Security mail — password changes and account
              deactivation — is always sent and can't be turned off.
            </p>

            <div className="space-y-4 divide-y divide-parchment-dark">
              <div className="pt-2 first:pt-0">
                <Switch
                  checked={profile.emailPrefs.appointments}
                  onChange={(v) => toggleEmailPref('appointments', v)}
                  label="Email me about fitting appointments"
                />
              </div>
              <div className="pt-4">
                <Switch
                  checked={profile.emailPrefs.orders}
                  onChange={(v) => toggleEmailPref('orders', v)}
                  label="Email me when an order changes status"
                />
              </div>
              <div className="pt-4">
                <Switch
                  checked={profile.emailPrefs.messages}
                  onChange={(v) => toggleEmailPref('messages', v)}
                  label="Email me about unread messages"
                />
                <p className="mt-1.5 pl-0.5 text-[11px] font-body text-ink-subtle">
                  Only sent when you're offline, and at most once every 20 minutes per conversation.
                </p>
              </div>
              <div className="pt-4">
                <Switch
                  checked={profile.emailPrefs.support}
                  onChange={(v) => toggleEmailPref('support', v)}
                  label="Email me about support requests & replies"
                />
              </div>
            </div>
          </Card>
        )}

        {/* ── Privacy & Data Portability ──────────────────────────────── */}
        <Card className="p-6">
          <SectionTitle>Privacy & Data Portability</SectionTitle>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold font-body text-ink">
                Download your atelier data
              </h3>
              <p className="mt-0.5 text-xs font-body text-ink-subtle max-w-lg leading-relaxed">
                Receive a complete, portable JSON bundle containing your
                calibrated body keypoints, order timeline logs, and messaging
                history.
              </p>
            </div>
            <PillButton
              variant="secondary"
              size="sm"
              icon="upload"
              onClick={downloadData}
            >
              Export JSON
            </PillButton>
          </div>
        </Card>

        {/* ── Danger Zone ─────────────────────────────────────────────── */}
        <Card className="p-6 border-seal/30 bg-[var(--status-error-bg)]">
          <SectionTitle>Danger Zone</SectionTitle>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold font-body text-seal">
                Deactivate atelier account
              </h3>
              <p className="mt-0.5 text-xs font-body text-ink-subtle max-w-lg">
                Your profile will be deactivated, active courier dispatches
                paused, and session invalidated immediately.
              </p>
            </div>
            <PillButton
              variant="danger"
              size="sm"
              onClick={() => setConfirmDeactivate(true)}
            >
              Deactivate
            </PillButton>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        onCancel={() => setConfirmDeactivate(false)}
        onConfirm={deactivate}
        title="Deactivate your account?"
        description="This will sign you out immediately. Contact atelier support to restore your account."
        confirmLabel={deactivating ? 'Deactivating…' : 'Deactivate'}
        danger
      />
    </PageShell>
  )
}
