import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api, type SupportRequest, type SupportRequestType } from '../../api'
import { Card, PillButton, StatusBadge } from '../../components/ui/primitives'
import { Input } from '../../components/ui/Input'
import { ChipGroup } from '../../components/ui/Chip'
import { Tabs } from '../../components/ui/Tabs'
import { PageShell } from '../../components/ui/PageShell'
import { MasterDetail } from '../../components/ui/MasterDetail'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { AppIcon, type IconName } from '../../components/ui/icons'
import { AuthImage } from '../../components/ui/AuthImage'
import { useToast } from '../../components/ui/Toast'
import { useSupportRequest } from '../../SupportRequestContext'
import { FAQS, HELP_CATEGORIES } from '../../content/helpTopics'
import { timeAgo } from '../../lib/timeAgo'

const TYPE_ICON: Record<SupportRequestType, IconName> = {
  bug: 'alert',
  feedback: 'sparkles',
  question: 'mail'
}

function FaqsTab() {
  const { open } = useSupportRequest()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const categoryOptions = ['All', ...HELP_CATEGORIES.map((c) => c.label)]
  const categoryIdByLabel = new Map(HELP_CATEGORIES.map((c) => [c.label, c.id]))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const categoryId = category === 'All' ? null : categoryIdByLabel.get(category)
    return FAQS.filter((f) => {
      if (categoryId && f.category !== categoryId) return false
      if (!q) return true
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category])

  return (
    <div className="space-y-4">
      <Input label="Search help topics" value={search} onChange={setSearch} icon="search" />
      <div className="overflow-x-auto pb-1">
        <ChipGroup options={categoryOptions} value={category} onChange={(v) => setCategory(v as string)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="helpCircle"
          title="No matching topics"
          description="Try a different search, or reach out directly and we'll help."
          action={
            <PillButton variant="primary" icon="mail" onClick={() => open({ type: 'question' })}>
              Contact support
            </PillButton>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((faq) => {
            const isOpen = expanded === faq.id
            return (
              <Card key={faq.id} padding="none" className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : faq.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="text-sm font-semibold font-body text-ink">{faq.question}</span>
                  <AppIcon
                    name="chevronDown"
                    size={16}
                    className={`flex-shrink-0 text-ink-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-parchment-dark px-4 pb-4 pt-3">
                    <p className="text-sm font-body text-ink-subtle leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RequestsTab({ initialRequestId }: { initialRequestId: string | null }) {
  const { show } = useToast()
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [selected, setSelected] = useState<SupportRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api.support
      .mine()
      .then((items) => {
        setRequests(items)
        setSelected((prev) => {
          const wantedId = prev?.id ?? initialRequestId
          if (!wantedId) return prev
          return items.find((r) => r.id === wantedId) || prev
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load your requests'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  useEffect(load, [])

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      const updated = await api.support.addResponse(selected.id, reply.trim())
      setReply('')
      setSelected(updated)
      setRequests((list) => list.map((r) => (r.id === updated.id ? updated : r)))
    } catch (err) {
      show({ title: "Couldn't send reply", description: err instanceof Error ? err.message : undefined, tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon="alert"
        title="Something went wrong"
        description={error}
        tone="error"
        action={
          <PillButton variant="secondary" onClick={load}>
            Try again
          </PillButton>
        }
      />
    )
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon="lifeBuoy"
        title="No requests yet"
        description="Reports, feedback, and questions you submit will show up here."
      />
    )
  }

  return (
      <MasterDetail
        hasSelection={!!selected}
        onBack={() => setSelected(null)}
        masterContent={
          <div className="space-y-1.5">
            {requests.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  selected?.id === r.id ? 'border-forest bg-parchment/70' : 'border-parchment-dark bg-surface hover:bg-parchment/50'
                }`}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-parchment text-forest">
                  <AppIcon name={TYPE_ICON[r.type]} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold font-body text-ink">{r.subject}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <StatusBadge status={r.status} size="sm" />
                    <span className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">{timeAgo(r.updatedAt)}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        }
        detailContent={
          selected && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">
                    Reported {timeAgo(selected.createdAt)}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold font-display text-ink">{selected.subject}</h2>
                {selected.context?.screenLabel && (
                  <p className="mt-1 text-xs font-body text-ink-subtle">From {selected.context.screenLabel}</p>
                )}
                <p className="mt-3 text-sm font-body text-ink-muted leading-relaxed">{selected.description}</p>
                {selected.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {selected.attachments.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-xl border border-parchment-dark">
                        <AuthImage src={url} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <div className="mb-4 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">Conversation</div>
                <div className="space-y-3">
                  {selected.responses.length === 0 ? (
                    <p className="text-xs font-body text-ink-subtle italic">No replies yet — our team will respond here.</p>
                  ) : (
                    selected.responses.map((r) => (
                      <div key={r.id} className={`flex ${r.authorRole === 'admin' ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed ${
                            r.authorRole === 'admin' ? 'bg-parchment text-ink' : 'bg-forest text-white'
                          }`}
                        >
                          {r.message}
                          <div className={`mt-1 text-[9px] font-data uppercase tracking-wider ${r.authorRole === 'admin' ? 'text-ink-subtle' : 'text-white/70'}`}>
                            {r.authorRole === 'admin' ? 'MorphoFit team' : 'You'} · {timeAgo(r.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selected.status !== 'closed' && (
                  <div className="mt-4 flex items-end gap-2">
                    <Input label="Add a reply" value={reply} onChange={setReply} multiline rows={2} className="flex-1" />
                    <PillButton variant="primary" icon="send" loading={sending} onClick={sendReply} disabled={!reply.trim()}>
                      Send
                    </PillButton>
                  </div>
                )}
              </Card>
            </div>
          )
        }
      />
  )
}

export default function Help() {
  const { user } = useAuth()
  const { open } = useSupportRequest()
  const [searchParams] = useSearchParams()
  const requestIdParam = searchParams.get('requestId')
  const [tab, setTab] = useState(requestIdParam ? 'requests' : 'faqs')

  if (!user) return null

  return (
    <PageShell
      title="Help & Support"
      subtitle="Search topics, track your requests, or reach our team"
      actions={
        <PillButton variant="primary" icon="lifeBuoy" onClick={() => open()}>
          New request
        </PillButton>
      }
    >
      <div className="space-y-5">
        <Tabs
          tabs={[
            { id: 'faqs', label: 'FAQs', icon: 'helpCircle' },
            { id: 'requests', label: 'My Requests', icon: 'lifeBuoy' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'faqs' ? <FaqsTab /> : <RequestsTab initialRequestId={requestIdParam} />}
      </div>
    </PageShell>
  )
}
