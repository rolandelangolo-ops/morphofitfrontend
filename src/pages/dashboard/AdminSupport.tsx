import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { api, type AdminSupportRequest, type SupportRequestPriority, type SupportRequestStatus, type SupportRequestType } from '../../api'
import { Card, PillButton, StatusBadge } from '../../components/ui/primitives'
import { ChipGroup } from '../../components/ui/Chip'
import { Input } from '../../components/ui/Input'
import { PageShell } from '../../components/ui/PageShell'
import { MasterDetail } from '../../components/ui/MasterDetail'
import { AppIcon, type IconName } from '../../components/ui/icons'
import { AuthImage } from '../../components/ui/AuthImage'
import { useToast } from '../../components/ui/Toast'
import { timeAgo } from '../../lib/timeAgo'

const TYPE_ICON: Record<SupportRequestType, IconName> = {
  bug: 'alert',
  feedback: 'sparkles',
  question: 'mail',
}

const TYPE_LABEL: Record<SupportRequestType, string> = {
  bug: 'Bug report',
  feedback: 'Feedback',
  question: 'Question',
}

const STATUS_OPTIONS: SupportRequestStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const STATUS_LABEL: Record<SupportRequestStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}
const PRIORITY_OPTIONS: SupportRequestPriority[] = ['low', 'normal', 'high']
const PRIORITY_LABEL: Record<SupportRequestPriority, string> = { low: 'Low', normal: 'Normal', high: 'High' }

export default function AdminSupport() {
  const { show } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [requests, setRequests] = useState<AdminSupportRequest[]>([])
  const [selected, setSelected] = useState<AdminSupportRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [reply, setReply] = useState('')
  const [updating, setUpdating] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api.admin.support
      .list()
      .then((items) => {
        setRequests(items)
        const wantedId = searchParams.get('requestId')
        setSelected((prev) => {
          const wanted = wantedId || prev?.id
          if (!wanted) return prev
          return items.find((r) => r.id === wanted) || prev
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load support requests'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesType = typeFilter === 'all' || r.type === typeFilter
      const matchesSearch = !q || r.subject.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.requester?.name.toLowerCase().includes(q)
      return matchesStatus && matchesType && matchesSearch
    })
  }, [requests, search, statusFilter, typeFilter])

  const applyUpdate = (updated: AdminSupportRequest) => {
    setRequests((list) => list.map((r) => (r.id === updated.id ? updated : r)))
    setSelected(updated)
  }

  const changeStatus = async (status: SupportRequestStatus) => {
    if (!selected) return
    setUpdating(true)
    try {
      const updated = await api.admin.support.updateStatus(selected.id, { status })
      applyUpdate(updated)
      show({ title: `Marked ${STATUS_LABEL[status].toLowerCase()}`, tone: 'success' })
    } catch (err) {
      show({ title: "Couldn't update status", description: err instanceof Error ? err.message : undefined, tone: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const changePriority = async (priority: SupportRequestPriority) => {
    if (!selected) return
    setUpdating(true)
    try {
      const updated = await api.admin.support.updateStatus(selected.id, { priority })
      applyUpdate(updated)
    } catch (err) {
      show({ title: "Couldn't update priority", description: err instanceof Error ? err.message : undefined, tone: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setUpdating(true)
    try {
      const updated = await api.admin.support.respond(selected.id, reply.trim())
      applyUpdate(updated)
      setReply('')
      show({ title: 'Reply sent', tone: 'success' })
    } catch (err) {
      show({ title: "Couldn't send reply", description: err instanceof Error ? err.message : undefined, tone: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <PageShell
      title="Support Requests"
      subtitle="Bug reports, feedback, and questions submitted across the app"
      loading={loading}
      error={error}
      onRetry={load}
    >
      <MasterDetail
        hasSelection={!!selected}
        onBack={() => setSelected(null)}
        masterContent={
          <Card className="overflow-hidden" padding="none">
            <div className="space-y-3 border-b border-parchment-dark bg-surface p-4">
              <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
                {filtered.length} of {requests.length} requests
              </span>

              <div className="relative">
                <AppIcon name="search" size={14} className="absolute left-3 top-2.5 text-ink-subtle" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search subject, requester..."
                  className="w-full rounded-xl border border-parchment-dark bg-parchment pl-8 pr-3 py-1.5 text-xs font-body text-ink placeholder:text-ink-subtle focus:border-forest focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['all', ...STATUS_OPTIONS].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-data font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                      statusFilter === st ? 'bg-forest text-white' : 'bg-parchment text-ink-muted hover:bg-parchment-dark/60'
                    }`}
                  >
                    {st === 'all' ? 'All' : STATUS_LABEL[st as SupportRequestStatus]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['all', 'bug', 'feedback', 'question'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-data font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                      typeFilter === t ? 'bg-amber text-white' : 'bg-parchment text-ink-muted hover:bg-parchment-dark/60'
                    }`}
                  >
                    {t === 'all' ? 'All types' : TYPE_LABEL[t as SupportRequestType]}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[70dvh] divide-y divide-parchment-dark overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs font-body text-ink-subtle">No matching requests</div>
              ) : (
                filtered.map((r) => {
                  const active = selected?.id === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelected(r)}
                      className={`block w-full p-4 text-left transition-colors ${
                        active ? 'bg-parchment/80 border-l-4 border-forest shadow-2xs' : 'hover:bg-parchment/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex items-center gap-2 truncate text-sm font-bold font-display text-ink">
                          <AppIcon name={TYPE_ICON[r.type]} size={14} className="flex-shrink-0 text-forest" />
                          {r.subject}
                        </span>
                        {r.priority === 'high' && (
                          <span className="flex-shrink-0 rounded-full bg-[var(--status-error-bg)] px-2 py-0.5 text-[9px] font-data font-semibold uppercase text-[var(--status-error-text)]">
                            High
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[10px] font-data text-ink-subtle tracking-wider">
                        {r.requester?.name || 'Unknown'} · {timeAgo(r.updatedAt)}
                      </div>
                      <div className="mt-2.5">
                        <StatusBadge status={r.status} size="sm" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </Card>
        }
        detailContent={
          selected && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.status} />
                    <span className="rounded-full border border-parchment-dark px-2.5 py-0.5 text-[10px] font-data font-semibold uppercase tracking-wider text-ink-subtle">
                      {TYPE_LABEL[selected.type]}
                    </span>
                  </div>
                  {selected.requester && (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/users/${selected.requester!.id}`)}
                      className="flex items-center gap-2 text-xs font-semibold text-forest hover:underline"
                    >
                      <AppIcon name="user" size={13} />
                      {selected.requester.name}
                    </button>
                  )}
                </div>

                <h2 className="mt-3 text-lg font-bold font-display text-ink">{selected.subject}</h2>
                {selected.context?.screenLabel && (
                  <p className="mt-1 text-xs font-body text-ink-subtle">Reported from {selected.context.screenLabel}</p>
                )}
                <p className="mt-3 text-sm font-body text-ink-muted leading-relaxed">{selected.description}</p>

                {selected.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {selected.attachments.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-24 w-24 overflow-hidden rounded-xl border border-parchment-dark">
                        <AuthImage src={url} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">Status</div>
                    <ChipGroup
                      options={STATUS_OPTIONS.map((s) => STATUS_LABEL[s])}
                      value={STATUS_LABEL[selected.status]}
                      onChange={(label) => {
                        const match = STATUS_OPTIONS.find((s) => STATUS_LABEL[s] === label)
                        if (match) changeStatus(match)
                      }}
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">Priority</div>
                    <ChipGroup
                      tone="amber"
                      options={PRIORITY_OPTIONS.map((p) => PRIORITY_LABEL[p])}
                      value={PRIORITY_LABEL[selected.priority]}
                      onChange={(label) => {
                        const match = PRIORITY_OPTIONS.find((p) => PRIORITY_LABEL[p] === label)
                        if (match) changePriority(match)
                      }}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="mb-4 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">Conversation</div>
                <div className="space-y-3">
                  {selected.responses.length === 0 ? (
                    <p className="text-xs font-body text-ink-subtle italic">No replies yet.</p>
                  ) : (
                    selected.responses.map((r) => (
                      <div key={r.id} className={`flex ${r.authorRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed ${
                            r.authorRole === 'admin' ? 'bg-forest text-white' : 'bg-parchment text-ink'
                          }`}
                        >
                          {r.message}
                          <div className={`mt-1 text-[9px] font-data uppercase tracking-wider ${r.authorRole === 'admin' ? 'text-white/70' : 'text-ink-subtle'}`}>
                            {r.authorRole === 'admin' ? 'Support team' : selected.requester?.name || 'Requester'} · {timeAgo(r.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <Input label="Reply to requester" value={reply} onChange={setReply} multiline rows={2} className="flex-1" />
                  <PillButton variant="primary" icon="send" loading={updating} onClick={sendReply} disabled={!reply.trim()}>
                    Send
                  </PillButton>
                </div>
              </Card>
            </div>
          )
        }
      />
    </PageShell>
  )
}
