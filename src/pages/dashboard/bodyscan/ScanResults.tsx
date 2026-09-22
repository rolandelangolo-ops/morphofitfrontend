import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api, ApiRequestError, type SavedScan, type ScanAnalysis } from '../../../api'
import { useAuth } from '../../../AuthContext'
import { AuthImage } from '../../../components/ui/AuthImage'
import { Card, PillButton } from '../../../components/ui/primitives'
import { AppIcon } from '../../../components/ui/icons'
import { useToast } from '../../../components/ui/Toast'
import { BOUNDS, MEASURE_FIELDS, TONE_TEXT, confidenceLabel, isInBounds, proportions, type MeasureKey } from './insights'
import { VIEW_INFO } from './scanViews'

type Editable = Record<MeasureKey, number>

/**
 * Result of one analysed scan, identical for the Photo and Live methods. Every
 * value is an editable estimate; nothing becomes the user's "latest
 * measurement" (what tailors and the 3D studio read) until they save.
 */
export function ScanResults({
  analysis,
  onSaved,
  onRescan,
}: {
  analysis: ScanAnalysis
  onSaved: (scan: SavedScan) => void
  onRescan: () => void
}) {
  const { updateUser } = useAuth()
  const navigate = useNavigate()
  const { show } = useToast()
  const [values, setValues] = useState<Editable>({ ...analysis.measurements })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<SavedScan | null>(null)
  const [scannedAt] = useState(() => new Date().toISOString())

  const badKeys = MEASURE_FIELDS.filter((f) => !isInBounds(f.key, values[f.key])).map((f) => f.key)
  const edited = MEASURE_FIELDS.some((f) => values[f.key] !== analysis.measurements[f.key])
  const conf = confidenceLabel(analysis.overallConfidence)
  const ratios = proportions(values)
  const morphology = analysis.morphology

  const save = async () => {
    if (badKeys.length) {
      show({ title: 'Check your measurements', description: 'Some values are outside a realistic range.', tone: 'error' })
      return
    }
    setSaving(true)
    try {
      const result = await api.client.saveMeasurements({ ...values, morphology, scannedAt }, analysis.draftId)
      updateUser({ morphology: result.morphology, measurements: result })
      setSaved(result)
      show({ title: 'Scan saved', description: 'It is now part of your body scan history and your tailoring profile.', tone: 'success' })
      onSaved(result)
    } catch (err) {
      // The draft can expire (24h) or already have been saved from another tab.
      const gone = err instanceof ApiRequestError && err.status === 404
      show({
        title: "Couldn't save this scan",
        description: gone ? 'This scan expired or was already saved. Please run a new scan.' : err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-testid="scan-results">
      <div className="space-y-4 lg:col-span-5">
        <Card padding="none" className="overflow-hidden text-white shadow-lg">
          <div className="p-6" style={{ background: 'var(--gradient-primary)' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-data uppercase tracking-widest text-white/80">Detected silhouette</span>
              <span className="flex items-center gap-1.5">
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold font-data">AI estimate</span>
                {conf && <span data-testid="confidence-badge" className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-data bg-white ${TONE_TEXT[conf.tone]}`}>{conf.label}</span>}
              </span>
            </div>
            <h2 className="mt-2 text-3xl font-bold font-display capitalize tracking-tight" data-testid="morphology">
              {morphology.replace('-', ' ')}
            </h2>
            <p className="mt-2 text-xs font-body leading-relaxed text-white/90">
              Based on your shoulder span ({values.shoulder} cm), waist ({values.waist} cm) and hips ({values.hip} cm).
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
              {ratios.slice(0, 3).map((r) => (
                <div key={r.id}>
                  <span className="block text-[9px] font-data uppercase tracking-wider text-white/70">{r.label}</span>
                  <span className="text-base font-bold font-data">{r.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {analysis.warnings.length > 0 && (
          <Card className="border-amber-500/40 p-4" >
            <div data-testid="scan-warnings">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold font-display text-ink">
                <AppIcon name="alert" size={14} className="text-amber-500" /> Things that may affect accuracy
              </div>
              <ul className="space-y-1.5">
                {analysis.warnings.map((w) => (
                  <li key={w} className="text-xs font-body leading-relaxed text-ink-muted">{w}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <span className="mb-2 block text-[10px] font-data font-semibold uppercase tracking-widest text-ink-subtle">Your photos</span>
          <div className="grid grid-cols-4 gap-2">
            {analysis.photos.map((p) => (
              <div key={p.view} className="overflow-hidden rounded-xl border border-parchment-dark">
                <AuthImage src={p.url} alt={`${VIEW_INFO[p.view].label} photo`} className="aspect-[3/4] w-full object-cover" />
                <div className="bg-parchment px-1.5 py-1 text-center text-[10px] font-semibold font-body text-ink-muted">{VIEW_INFO[p.view].label.replace(' side', '')}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-body leading-relaxed text-ink-subtle">
            Only you can see these. They are stored privately and you can delete them from any saved scan.
          </p>
        </Card>

        {saved && (
          <Card className="space-y-2 p-5">
            <span className="block text-[10px] font-data font-semibold uppercase tracking-widest text-ink-subtle">What next</span>
            <NextStep icon="layers" title="See it on the 3D mannequin" body="Try garments on your saved proportions." onClick={() => navigate('/dashboard/visualizer')} />
            <NextStep icon="scissors" title="Choose a tailor" body="Send your saved measurements for production." onClick={() => navigate('/dashboard/tailors')} />
          </Card>
        )}
      </div>

      <div className="lg:col-span-7">
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-parchment-dark bg-surface px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-base font-bold font-display text-ink">Your measurements</h3>
              <span className="text-[10px] font-data uppercase tracking-wider text-ink-subtle">
                {saved ? 'Saved to your profile' : edited ? 'Edited by you, not saved yet' : 'Not saved yet'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PillButton variant="secondary" size="sm" icon="camera" onClick={onRescan}>
                Scan again
              </PillButton>
              {!saved && (
                <PillButton variant="primary" size="sm" icon="check" onClick={save} loading={saving} disabled={badKeys.length > 0} testId="save-scan">
                  Save scan
                </PillButton>
              )}
            </div>
          </div>

          <p className="border-b border-parchment-dark bg-parchment/60 px-5 py-3 text-[11px] font-body leading-relaxed text-ink-muted sm:px-6">
            These are AI estimates from your photos, not tape measurements. Girths (chest, waist, hips, thigh) are the least certain. Correct any value you know, and verify with your tailor before production.
          </p>

          <div className="divide-y divide-parchment-dark">
            {MEASURE_FIELDS.map((f) => {
              const c = analysis.confidences[f.key]
              const bad = !isInBounds(f.key, values[f.key])
              return (
                <div key={f.key} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-parchment sm:px-6">
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold font-body text-ink">{f.label}</span>
                    <span className="text-[10px] font-body text-ink-subtle">
                      {f.tip}
                      {typeof c === 'number' && f.key !== 'height' && <span className="ml-1.5">· {Math.round(c * 100)}% sure</span>}
                    </span>
                    {bad && <span className="block text-[10px] font-body text-[var(--status-error-text)]">Enter {BOUNDS[f.key][0]} to {BOUNDS[f.key][1]} cm</span>}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      aria-label={f.label}
                      data-testid={`value-${f.key}`}
                      disabled={!!saved}
                      value={Number.isFinite(values[f.key]) ? values[f.key] : ''}
                      onChange={(e) => setValues({ ...values, [f.key]: Number(e.target.value) })}
                      className={`w-20 rounded-lg border bg-surface px-2.5 py-1 text-right text-xs font-bold font-data text-forest focus:border-forest focus:outline-none disabled:opacity-70 ${bad ? 'border-seal' : 'border-parchment-dark'}`}
                    />
                    <span className="w-6 text-xs font-data text-ink-subtle">cm</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

function NextStep({ icon, title, body, onClick }: { icon: 'layers' | 'scissors'; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-2xl border border-parchment-dark p-3.5 text-left transition-colors hover:bg-parchment">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white shadow-xs">
          <AppIcon name={icon} size={16} />
        </span>
        <div>
          <div className="text-xs font-bold font-display text-ink">{title}</div>
          <div className="text-[11px] font-body text-ink-muted">{body}</div>
        </div>
      </div>
      <AppIcon name="chevronRight" size={14} className="text-ink-subtle" />
    </button>
  )
}

export default ScanResults
