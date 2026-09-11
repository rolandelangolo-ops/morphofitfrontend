import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api, type SupportRequestCategory, type SupportRequestType } from '../../api'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { ChipGroup } from '../ui/Chip'
import { PillButton } from '../ui/primitives'
import { AppIcon } from '../ui/icons'
import { useToast } from '../ui/Toast'
import { useBreadcrumbTrail } from './Breadcrumbs'

const TYPE_LABELS: Record<SupportRequestType, string> = {
  bug: 'Report a problem',
  feedback: 'Give feedback',
  question: 'Contact support',
}

const CATEGORY_OPTIONS: { value: SupportRequestCategory; label: string }[] = [
  { value: 'account', label: 'Account & Profile' },
  { value: 'orders', label: 'Orders & Escrow' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'payments', label: 'Payments' },
  { value: 'messaging', label: 'Messaging' },
  { value: 'measurements', label: 'Body Scan' },
  { value: 'visualizer', label: '3D Style Studio' },
  { value: 'app_bug', label: 'App bug' },
  { value: 'feature_request', label: 'Feature request' },
  { value: 'other', label: 'Something else' },
]

const MAX_FILES = 3
const MAX_FILE_SIZE = 8 * 1024 * 1024

export interface SupportRequestPrefill {
  type?: SupportRequestType
  category?: SupportRequestCategory
}

export function SupportRequestModal({
  open,
  onClose,
  prefill,
}: {
  open: boolean
  onClose: () => void
  prefill?: SupportRequestPrefill
}) {
  const { user } = useAuth()
  const { show } = useToast()
  const loc = useLocation()
  const screenLabel = useBreadcrumbTrail(user?.role, loc.pathname)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<SupportRequestType>('question')
  const [category, setCategory] = useState<SupportRequestCategory>('other')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [subjectError, setSubjectError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setType(prefill?.type ?? 'question')
    setCategory(prefill?.category ?? 'other')
    setSubject('')
    setDescription('')
    setFiles([])
    setSubjectError('')
    setDescriptionError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    if (picked.length === 0) return

    const remaining = MAX_FILES - files.length
    if (remaining <= 0) {
      show({ title: `You can attach up to ${MAX_FILES} screenshots`, tone: 'error' })
      return
    }

    const accepted: File[] = []
    for (const file of picked.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        show({ title: 'Only image files are supported', tone: 'error' })
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        show({ title: 'Image too large', description: `${file.name} is over 8MB.`, tone: 'error' })
        continue
      }
      accepted.push(file)
    }
    if (accepted.length > 0) setFiles((f) => [...f, ...accepted])
  }

  const removeFile = (index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim()
    const trimmedDescription = description.trim()
    setSubjectError(trimmedSubject.length < 3 ? 'Give it a short title (3+ characters)' : '')
    setDescriptionError(trimmedDescription.length < 5 ? 'Tell us a bit more (5+ characters)' : '')
    if (trimmedSubject.length < 3 || trimmedDescription.length < 5) return

    setSubmitting(true)
    try {
      await api.support.create({
        type,
        category,
        subject: trimmedSubject,
        description: trimmedDescription,
        context: { path: loc.pathname, screenLabel },
        files,
      })
      show({
        title: "Thanks — we've got it",
        description: "We'll follow up here and in your notifications.",
        tone: 'success',
      })
      onClose()
    } catch (err) {
      show({
        title: "Couldn't submit your request",
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Help & Support"
      size="md"
      footer={
        <>
          <PillButton variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </PillButton>
          <PillButton variant="primary" onClick={handleSubmit} loading={submitting}>
            Submit request
          </PillButton>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-2 text-xs font-semibold font-body text-ink-muted">What's this about?</div>
          <ChipGroup
            options={Object.values(TYPE_LABELS)}
            value={TYPE_LABELS[type]}
            onChange={(label) => {
              const match = (Object.entries(TYPE_LABELS) as [SupportRequestType, string][]).find(([, l]) => l === label)
              if (match) setType(match[0])
            }}
          />
        </div>

        <Select
          label="Category"
          value={category}
          onChange={(v) => setCategory(v as SupportRequestCategory)}
          options={CATEGORY_OPTIONS}
        />

        <Input label="Subject" value={subject} onChange={setSubject} error={subjectError} required />

        <Input
          label="Details"
          value={description}
          onChange={setDescription}
          error={descriptionError}
          multiline
          rows={4}
          required
        />

        {/* Screenshots */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold font-body text-ink-muted">Screenshots (optional)</span>
            <span className="text-[10px] font-data text-ink-subtle uppercase tracking-wider">{files.length}/{MAX_FILES}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {files.map((file, i) => (
              <div key={i} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-parchment-dark">
                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label="Remove screenshot"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <AppIcon name="close" size={11} />
                </button>
              </div>
            ))}
            {files.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-parchment-dark text-ink-subtle transition-colors hover:border-forest/40 hover:text-forest"
              >
                <AppIcon name="camera" size={18} />
                <span className="text-[9px] font-data uppercase tracking-wider">Add</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={onFilesSelected}
          />
        </div>

        {/* Auto-captured context */}
        <div className="flex items-center gap-2 rounded-xl border border-parchment-dark bg-parchment/60 px-3.5 py-2.5">
          <AppIcon name="mapPin" size={14} className="flex-shrink-0 text-ink-subtle" />
          <span className="text-xs font-body text-ink-subtle">
            Reporting from <span className="font-semibold text-ink">{screenLabel}</span>
          </span>
        </div>
      </div>
    </Modal>
  )
}

export default SupportRequestModal
