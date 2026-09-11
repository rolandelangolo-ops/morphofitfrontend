import { useEffect, useState, useMemo } from 'react'
import {
  api,
  type Appointment,
  type AppointmentStatus,
  type User,
} from '../../api'
import { useAuth } from '../../AuthContext'
import { Card, StatusBadge, PillButton } from '../../components/ui/primitives'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { PageShell } from '../../components/ui/PageShell'
import { useToast } from '../../components/ui/Toast'

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const TIME_OPTIONS = [
  { value: '09:00', label: '09:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '16:00', label: '04:00 PM' },
]

export default function Appointments() {
  const { user } = useAuth()
  const { show } = useToast()
  const isClient = user?.role === 'client'
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [tailors, setTailors] = useState<User[]>([])
  const [tailorId, setTailorId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadAppointments = () =>
    api.appointments
      .list()
      .then(setAppointments)
      .finally(() => setLoading(false))

  useEffect(() => {
    if (!user) return
    loadAppointments().catch(() =>
      setError('Unable to load fitting appointments.')
    )
    if (isClient)
      api.appointments
        .tailors()
        .then((data) => {
          setTailors(data)
          if (data[0]) setTailorId(String(data[0].id))
        })
        .catch(() => setError('Unable to load tailors roster.'))
  }, [user, isClient])

  const tailorOptions = useMemo(() => {
    return tailors.map((t) => ({
      value: String(t.id),
      label: `${t.name}${t.city ? ` · ${t.city}` : ''}`,
      icon: 'scissors' as const,
    }))
  }, [tailors])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!tailorId || !date) {
      // Previously a bare `return` — the button looked dead when the date
      // was empty, with no request, message, or hint as to why.
      setError(
        !tailorId
          ? 'Choose an artisan tailor for this fitting.'
          : 'Pick a fitting date before requesting an appointment.'
      )
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.appointments.create(tailorId, date, time, notes)
      setDate('')
      setNotes('')
      show({
        title: 'Fitting request dispatched',
        description: 'Your chosen artisan tailor will review and confirm.',
        tone: 'success',
      })
      await loadAppointments()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to book fitting.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (
    appointment: Appointment,
    status: AppointmentStatus
  ) => {
    try {
      const updated = await api.appointments.updateStatus(
        appointment.id,
        status
      )
      setAppointments((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item
        )
      )
      show({
        title:
          status === 'confirmed'
            ? 'Fitting confirmed'
            : 'Fitting declined',
        tone: status === 'confirmed' ? 'success' : 'neutral',
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update appointment.'
      )
    }
  }

  return (
    <PageShell
      title={isClient ? 'Book a Fitting' : 'Fitting Appointments'}
      subtitle="Atelier fitting schedule, in-person consultations & measurements"
      loading={loading}
      error={error}
      onRetry={loadAppointments}
    >
      <div className="space-y-8">
        {/* ── Client Booking Section ───────────────────────────────────── */}
        {isClient && (
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-12"
          >
            <Card className="p-6 lg:col-span-7 space-y-4">
              <div className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
                New Atelier Fitting Request
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Artisan Tailor"
                  value={tailorId}
                  onChange={setTailorId}
                  options={tailorOptions}
                  required
                />
                <Input
                  label="Fitting Date"
                  type="date"
                  value={date}
                  onChange={setDate}
                  min={new Date().toISOString().slice(0, 10)}
                  required
                  icon="calendar"
                />
              </div>

              <Select
                label="Preferred Time Window"
                value={time}
                onChange={setTime}
                options={TIME_OPTIONS}
              />

              <Input
                label="Garment vision / Discussion notes"
                value={notes}
                onChange={setNotes}
                multiline
                rows={3}
                placeholder="e.g. In-person measurement check for royal micro-velvet evening suit."
              />

              <div>
                <PillButton
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  icon="calendar"
                >
                  {submitting ? 'Dispatching…' : 'Request Appointment'}
                </PillButton>
              </div>
            </Card>

            {/* Atmospheric Guide Card */}
            <Card className="p-6 lg:col-span-5 bg-parchment flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold font-display text-ink leading-snug">
                  A fitting is where the garment begins to take human shape.
                </h3>
                <p className="mt-3 text-xs font-body text-ink-muted leading-relaxed">
                  Your master tailor will verify your dual-photo calibrated
                  measurements, check posture balance, and pin your draft
                  toiles for an impeccable bespoke drape.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-parchment-dark bg-surface p-4 shadow-2xs">
                <span className="block text-[9px] font-data text-ink-subtle uppercase tracking-widest">
                  Atelier Etiquette
                </span>
                <p className="mt-1 text-xs font-body text-ink">
                  Wear well-fitted base garments for precision pin fittings.
                </p>
              </div>
            </Card>
          </form>
        )}

        {/* ── Appointments Schedule List ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest px-1">
            {isClient ? 'Your Scheduled Fittings' : 'Incoming Fitting Requests'}
          </div>

          {appointments.length === 0 ? (
            <Card className="p-8 text-center bg-surface">
              <p className="text-sm font-body text-ink-muted">
                No fitting appointments scheduled yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                  hover
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold font-body text-ink-muted uppercase tracking-wide">
                      {isClient
                        ? `Tailor: ${appointment.tailor?.name || 'Artisan'}`
                        : `Client: ${appointment.client?.name || 'Client'}`}
                    </div>
                    <div className="mt-1 text-lg font-bold font-display text-forest">
                      {formatDate(appointment.date)}{' '}
                      <span className="text-sm font-normal font-body text-ink-muted">
                        at {appointment.time}
                      </span>
                    </div>
                    {appointment.notes && (
                      <p className="mt-1 text-xs font-body text-ink-subtle">
                        {appointment.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-3">
                    <StatusBadge status={appointment.status} />

                    {!isClient && appointment.status === 'requested' && (
                      <div className="flex items-center gap-2">
                        <PillButton
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            updateStatus(appointment, 'confirmed')
                          }
                        >
                          Confirm
                        </PillButton>
                        <PillButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            updateStatus(appointment, 'declined')
                          }
                        >
                          Decline
                        </PillButton>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
