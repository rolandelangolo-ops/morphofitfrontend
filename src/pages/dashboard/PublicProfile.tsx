import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api, type AdminUserDetail, type UserPublic, type UserRole, type Order, type Appointment } from '../../api'
import { Card, StatusBadge, PillButton } from '../../components/ui/primitives'
import { PageShell } from '../../components/ui/PageShell'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import { ROLE_LABEL } from '../../components/shell/nav'

const ROLE_OPTIONS = (['client', 'stylist', 'tailor', 'delivery_agent', 'admin'] as UserRole[]).map((r) => ({
  value: r,
  label: ROLE_LABEL[r],
}))

function sharesCounterpart(
  item: Order | Appointment,
  profileId: string
): boolean {
  return (
    ('clientId' in item && item.clientId === profileId) ||
    ('stylistId' in item && item.stylistId === profileId) ||
    ('tailorId' in item && item.tailorId === profileId)
  )
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<UserPublic | null>(null)
  const [shared, setShared] = useState<(Order | Appointment)[]>([])
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // ── Admin-only management (see components below) ────────────────────────
  const isAdminViewingOther = user?.role === 'admin' && id !== user.id
  const [adminDetail, setAdminDetail] = useState<AdminUserDetail | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editBio, setEditBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [pendingRole, setPendingRole] = useState<UserRole | null>(null)
  const [changingRole, setChangingRole] = useState(false)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)

  const [confirmActiveToggle, setConfirmActiveToggle] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id || !user) return
    setLoading(true)
    setNotFound(false)

    const historyFetch: Promise<(Order | Appointment)[]> =
      user.role === 'client'
        ? Promise.all([api.client.orders(), api.appointments.list()]).then(
            ([o, a]) => [...o, ...a]
          )
        : user.role === 'stylist'
        ? api.stylist.orders()
        : user.role === 'tailor'
        ? Promise.all([api.tailor.orders(), api.appointments.list()]).then(
            ([o, a]) => [...o, ...a]
          )
        : Promise.resolve([])

    const tasks: Promise<unknown>[] = [
      api.users
        .getById(id)
        .then(setProfile)
        .catch(() => setNotFound(true)),
      historyFetch
        .then((items) =>
          setShared(items.filter((item) => sharesCounterpart(item, id)))
        )
        .catch(() => {}),
    ]

    if (user.role === 'admin' && id !== user.id) {
      tasks.push(
        api.admin
          .getUser(id)
          .then((detail) => {
            setAdminDetail(detail)
            setEditName(detail.name)
            setEditEmail(detail.email)
            setEditCity(detail.city || '')
            setEditPhone(detail.phone || '')
            setEditBio(detail.bio || '')
          })
          .catch(() => {})
      )
    } else {
      setAdminDetail(null)
    }

    Promise.all(tasks).finally(() => setLoading(false))
  }, [id, user])

  const message = async () => {
    if (!id) return
    setMessaging(true)
    try {
      const conversation = await api.messaging.createConversation(id)
      navigate(`/dashboard/messages/${conversation.id}`)
    } catch (err) {
      show({
        title: "Couldn't start conversation",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setMessaging(false)
    }
  }

  const saveAdminEdits = async () => {
    if (!id) return
    setSavingProfile(true)
    try {
      const updated = await api.admin.updateUser(id, {
        name: editName.trim(),
        email: editEmail.trim(),
        city: editCity.trim(),
        phone: editPhone.trim(),
        bio: editBio,
      })
      setAdminDetail(updated)
      setProfile((p) => (p ? { ...p, name: updated.name, city: updated.city, bio: updated.bio } : p))
      show({ title: 'Profile updated', tone: 'success' })
    } catch (err) {
      show({ title: "Couldn't save changes", description: err instanceof Error ? err.message : undefined, tone: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  const confirmRoleChange = async () => {
    if (!id || !pendingRole) return
    setChangingRole(true)
    try {
      const updated = await api.admin.changeRole(id, pendingRole)
      setAdminDetail(updated)
      setProfile((p) => (p ? { ...p, role: updated.role } : p))
      show({ title: `Role changed to ${ROLE_LABEL[updated.role]}`, tone: 'success' })
    } catch (err) {
      show({ title: "Couldn't change role", description: err instanceof Error ? err.message : undefined, tone: 'error' })
    } finally {
      setChangingRole(false)
      setPendingRole(null)
    }
  }

  const submitPasswordReset = async () => {
    if (!id) return
    setPasswordError('')
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setSettingPassword(true)
    try {
      await api.admin.setPassword(id, newPassword)
      show({ title: 'Password reset', description: `${adminDetail?.name || 'The user'} should sign in with the new password.`, tone: 'success' })
      setPasswordModalOpen(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setSettingPassword(false)
    }
  }

  const toggleActive = async () => {
    if (!id || !adminDetail) return
    setTogglingActive(true)
    try {
      const updated = adminDetail.active ? await api.admin.deactivateUser(id) : await api.admin.reactivateUser(id)
      setAdminDetail(updated)
      show({ title: updated.active ? 'Account reactivated' : 'Account deactivated', tone: 'success' })
    } catch (err) {
      show({ title: "Couldn't update account status", description: err instanceof Error ? err.message : undefined, tone: 'error' })
    } finally {
      setTogglingActive(false)
      setConfirmActiveToggle(false)
    }
  }

  const confirmDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await api.admin.deleteUser(id)
      show({ title: 'User deleted', tone: 'success' })
      navigate('/dashboard/users')
    } catch (err) {
      show({ title: "Couldn't delete user", description: err instanceof Error ? err.message : undefined, tone: 'error' })
      setDeleting(false)
    }
  }

  return (
    <PageShell
      title={profile?.name || 'Public Atelier Profile'}
      subtitle="Verified artisan credentials, atelier portfolio & shared order history"
      loading={loading}
      empty={
        notFound || !profile
          ? {
              icon: 'user',
              title: "This profile isn't available",
              description: 'The account may have been deactivated or not found.',
            }
          : undefined
      }
    >
      {profile && (
        <div className="space-y-6">
          {/* Profile Hero Card */}
          <Card className="overflow-hidden" padding="none">
            <div
              className="p-6 sm:p-8"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-white/15 shadow-md">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold font-display text-white">
                      {profile.name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold font-display text-white tracking-tight sm:text-3xl">
                    {profile.name}
                  </h1>
                  <div className="mt-1.5 text-xs font-data uppercase tracking-widest text-white/80">
                    {ROLE_LABEL[profile.role] ?? profile.role}
                    {profile.city ? ` · ${profile.city}` : ''}
                  </div>
                </div>

                <PillButton
                  variant="secondary"
                  size="md"
                  icon="message"
                  onClick={message}
                  loading={messaging}
                >
                  Direct Message
                </PillButton>
              </div>
            </div>

            {profile.bio && (
              <div className="p-6 bg-surface">
                <div className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest mb-2">
                  Atelier Biography & Philosophy
                </div>
                <p className="text-sm font-body text-ink-muted leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}
          </Card>

          {/* Shared History Section */}
          <div className="space-y-3">
            <div className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest px-1">
              Shared History
            </div>

            {shared.length === 0 ? (
              <Card className="p-8 text-center bg-surface">
                <p className="text-sm font-body text-ink-muted">
                  No orders or fittings shared with this member yet.
                </p>
              </Card>
            ) : (
              <Card className="overflow-hidden" padding="none">
                <div className="divide-y divide-parchment-dark">
                  {shared.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-surface hover:bg-parchment/60 transition-colors"
                    >
                      <span className="truncate text-sm font-semibold font-body text-ink">
                        {'item' in item
                          ? item.item
                          : `Fitting · ${item.date} at ${item.time}`}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* ── Admin Controls ──────────────────────────────────────────── */}
          {isAdminViewingOther && adminDetail && (
            <Card className="p-6 space-y-6">
              <div className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
                Admin Controls
              </div>

              {/* Edit profile */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Full name" value={editName} onChange={setEditName} icon="user" />
                  <Input label="Email address" type="email" value={editEmail} onChange={setEditEmail} icon="mail" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="City" value={editCity} onChange={setEditCity} icon="mapPin" />
                  <Input label="Phone" value={editPhone} onChange={setEditPhone} icon="phone" />
                </div>
                <Input label="Biography" value={editBio} onChange={setEditBio} multiline rows={3} />
                <PillButton variant="primary" onClick={saveAdminEdits} loading={savingProfile}>
                  Save changes
                </PillButton>
              </div>

              {/* Role */}
              <div className="border-t border-parchment-dark pt-5">
                <div className="mb-2 text-xs font-semibold font-body text-ink-muted">Platform role</div>
                <Select
                  label="Role"
                  value={adminDetail.role}
                  onChange={(v) => {
                    const role = v as UserRole
                    if (role !== adminDetail.role) setPendingRole(role)
                  }}
                  options={ROLE_OPTIONS}
                />
              </div>

              {/* Password / active state / delete */}
              <div className="flex flex-wrap items-center gap-3 border-t border-parchment-dark pt-5">
                <PillButton variant="secondary" icon="shieldCheck" onClick={() => setPasswordModalOpen(true)}>
                  Reset password
                </PillButton>
                <PillButton
                  variant={adminDetail.active ? 'danger' : 'primary'}
                  icon={adminDetail.active ? 'phoneOff' : 'check'}
                  onClick={() => setConfirmActiveToggle(true)}
                >
                  {adminDetail.active ? 'Deactivate account' : 'Reactivate account'}
                </PillButton>
                <PillButton variant="danger" icon="trash" onClick={() => setDeleteModalOpen(true)}>
                  Delete account
                </PillButton>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Role change confirmation */}
      <ConfirmDialog
        open={pendingRole !== null}
        onCancel={() => setPendingRole(null)}
        onConfirm={confirmRoleChange}
        title="Change role?"
        description={
          pendingRole && adminDetail
            ? `Change ${adminDetail.name}'s role from ${ROLE_LABEL[adminDetail.role]} to ${ROLE_LABEL[pendingRole]}?`
            : undefined
        }
        confirmLabel={changingRole ? 'Changing…' : 'Change role'}
      />

      {/* Deactivate/reactivate confirmation */}
      <ConfirmDialog
        open={confirmActiveToggle}
        onCancel={() => setConfirmActiveToggle(false)}
        onConfirm={toggleActive}
        title={adminDetail?.active ? 'Deactivate this account?' : 'Reactivate this account?'}
        description={
          adminDetail?.active
            ? `${adminDetail.name} will be signed out and unable to log in until reactivated.`
            : `${adminDetail?.name} will be able to sign in again.`
        }
        confirmLabel={togglingActive ? 'Working…' : adminDetail?.active ? 'Deactivate' : 'Reactivate'}
        danger={adminDetail?.active}
      />

      {/* Reset password modal */}
      <Modal
        open={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false)
          setNewPassword('')
          setConfirmPassword('')
          setPasswordError('')
        }}
        title="Reset password"
        footer={
          <>
            <PillButton variant="secondary" onClick={() => setPasswordModalOpen(false)} disabled={settingPassword}>
              Cancel
            </PillButton>
            <PillButton variant="primary" onClick={submitPasswordReset} loading={settingPassword}>
              Reset password
            </PillButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="New password" type="password" value={newPassword} onChange={setNewPassword} required />
          <Input label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} required error={passwordError} />
        </div>
      </Modal>

      {/* Delete confirmation (typed) */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeleteConfirmText('')
        }}
        title="Delete this account?"
        footer={
          <>
            <PillButton variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Cancel
            </PillButton>
            <PillButton variant="danger" onClick={confirmDelete} loading={deleting} disabled={deleteConfirmText !== 'DELETE'}>
              Delete permanently
            </PillButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm font-body text-ink-muted leading-relaxed">
            This permanently deletes <strong className="text-ink">{adminDetail?.name}</strong>'s account. This cannot be undone.
            Type <strong className="text-seal">DELETE</strong> to confirm.
          </p>
          <Input label="Type DELETE to confirm" value={deleteConfirmText} onChange={setDeleteConfirmText} />
        </div>
      </Modal>
    </PageShell>
  )
}
