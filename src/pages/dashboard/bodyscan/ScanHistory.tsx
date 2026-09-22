import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type SavedScan } from '../../../api'
import { AuthImage } from '../../../components/ui/AuthImage'
import { ConfirmDialog } from '../../../components/ui/Modal'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Card, PillButton } from '../../../components/ui/primitives'
import { SkeletonList } from '../../../components/ui/Skeleton'
import { AppIcon } from '../../../components/ui/icons'
import { useToast } from '../../../components/ui/Toast'
import { MEASURE_FIELDS, TONE_CLASS, confidenceLabel, fmtDate, isLegacyScan, methodLabel, proportions, type MeasureKey } from './insights'
import { VIEW_INFO } from './scanViews'

const SERIES: { key: MeasureKey; label: string; color: string }[] = [
  { key: 'waist', label: 'Waist', color: 'var(--color-forest, #16a34a)' },
  { key: 'hip', label: 'Hip', color: '#2b8a9e' },
  { key: 'chest', label: 'Chest', color: 'var(--color-ink-muted, #888)' },
]

function Trend({ scans }: { scans: SavedScan[] }) {
  // chronological, oldest first
  const pts = useMemo(() => [...scans].sort((a, b) => +new Date(a.scannedAt) - +new Date(b.scannedAt)), [scans])
  if (pts.length < 2) {
    return <p className="text-xs font-body text-ink-muted">Save at least two scans to see how your measurements change over time.</p>
  }
  const W = 320
  const H = 130
  const pad = { l: 30, r: 10, t: 10, b: 20 }
  const all = pts.flatMap((p) => SERIES.map((s) => p[s.key]))
  const lo = Math.floor(Math.min(...all) - 3)
  const hi = Math.ceil(Math.max(...all) + 3)
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (pts.length - 1)
  const y = (v: number) => pad.t + ((hi - v) * (H - pad.t - pad.b)) / (hi - lo || 1)
  return (
    <div data-testid="trend-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Waist, hip and chest over time">
        {[lo, (lo + hi) / 2, hi].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-parchment-dark" strokeWidth="0.6" />
            <text x={pad.l - 4} y={y(t) + 3} textAnchor="end" fontSize="8" fill="currentColor" className="text-ink-subtle">{Math.round(t)}</text>
          </g>
        ))}
        {SERIES.map((s) => (
          <g key={s.key}>
            <polyline fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" points={pts.map((p, i) => `${x(i)},${y(p[s.key])}`).join(' ')} />
            {pts.map((p, i) => (
              <circle key={p.id} cx={x(i)} cy={y(p[s.key])} r="2.6" fill={isLegacyScan(p) ? 'var(--color-surface, #fff)' : s.color} stroke={s.color} strokeWidth="1.4" />
            ))}
          </g>
        ))}
        <text x={pad.l} y={H - 5} fontSize="8" fill="currentColor" className="text-ink-subtle">{fmtDate(pts[0].scannedAt)}</text>
        <text x={W - pad.r} y={H - 5} textAnchor="end" fontSize="8" fill="currentColor" className="text-ink-subtle">{fmtDate(pts[pts.length - 1].scannedAt)}</text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-data text-ink-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label} (cm)
          </span>
        ))}
        {pts.some(isLegacyScan) && <span>Hollow dots: earlier height-based estimates</span>}
      </div>
    </div>
  )
}

function Compare({ a, b }: { a: SavedScan; b: SavedScan }) {
  const [older, newer] = +new Date(a.scannedAt) <= +new Date(b.scannedAt) ? [a, b] : [b, a]
  const rOld = proportions(older)
  const rNew = proportions(newer)
  const fmt = (d: number, digits = 1) => `${d > 0 ? '+' : ''}${d.toFixed(digits)}`
  return (
    <Card className="p-5">
      <div data-testid="compare-panel">
        <h3 className="text-sm font-bold font-display text-ink">Comparison</h3>
        <p className="mt-0.5 text-[11px] font-body text-ink-muted">
          {fmtDate(older.scannedAt)} to {fmtDate(newer.scannedAt)}
        </p>
        {(isLegacyScan(older) || isLegacyScan(newer)) && (
          <p className="mt-2 rounded-lg bg-parchment px-3 py-2 text-[11px] font-body text-ink-muted">
            One of these is an earlier height-based estimate, so its differences reflect the estimate method as much as your body.
          </p>
        )}
        <div className="mt-3 divide-y divide-parchment-dark text-xs font-body">
          {MEASURE_FIELDS.map((f) => {
            const d = newer[f.key] - older[f.key]
            return (
              <div key={f.key} className="flex items-center justify-between py-2">
                <span className="text-ink-muted">{f.label}</span>
                <span className="font-data text-ink">
                  {older[f.key]} <span className="text-ink-subtle">to</span> {newer[f.key]}
                  <span className={`ml-2 inline-block w-14 text-right font-bold ${Math.abs(d) < 0.05 ? 'text-ink-subtle' : 'text-forest'}`} data-testid={`delta-${f.key}`}>
                    {Math.abs(d) < 0.05 ? '0.0' : fmt(d)} cm
                  </span>
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-parchment-dark pt-3">
          {rNew.map((r, i) => (
            <div key={r.id} className="text-[11px] font-body text-ink-muted">
              {r.label}: <span className="font-data font-bold text-ink">{rOld[i].value.toFixed(2)} to {r.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function Detail({ scan, onPhotosDeleted }: { scan: SavedScan; onPhotosDeleted: (updated: SavedScan) => void }) {
  const { show } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const conf = confidenceLabel(scan.confidence)

  const deletePhotos = async () => {
    setBusy(true)
    try {
      const updated = await api.client.deleteScanPhotos(scan.id)
      onPhotosDeleted(updated)
      show({ title: 'Photos deleted', description: 'The measurements from this scan were kept.', tone: 'success' })
    } catch (err) {
      show({ title: "Couldn't delete the photos", description: err instanceof Error ? err.message : 'Please try again.', tone: 'error' })
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }

  return (
    <Card className="p-5">
      <div data-testid="scan-detail" data-scan-id={scan.id}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold font-display capitalize text-ink">{scan.morphology.replace('-', ' ')}</h3>
            <p className="text-[11px] font-body text-ink-muted">
              {fmtDate(scan.scannedAt)} · {methodLabel(scan)}
            </p>
          </div>
          {conf && <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-data ${TONE_CLASS[conf.tone]}`}>{conf.label}</span>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          {MEASURE_FIELDS.map((f) => (
            <div key={f.key}>
              <span className="block text-[10px] font-data uppercase tracking-wider text-ink-subtle">{f.label.split(' (')[0].split(' /')[0]}</span>
              <span className="text-sm font-bold font-data text-forest">{scan[f.key]} cm</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-parchment-dark pt-3 sm:grid-cols-4">
          {proportions(scan).map((r) => (
            <div key={r.id} title={r.hint}>
              <span className="block text-[10px] font-data uppercase tracking-wider text-ink-subtle">{r.label}</span>
              <span className="text-sm font-bold font-data text-ink">{r.value.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {scan.warnings && scan.warnings.length > 0 && (
          <ul className="mt-3 space-y-1">
            {scan.warnings.map((w) => (
              <li key={w} className="text-[11px] font-body text-ink-muted">· {w}</li>
            ))}
          </ul>
        )}

        <div className="mt-4 border-t border-parchment-dark pt-3">
          {scan.photos.length > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-2" data-testid="scan-photos">
                {scan.photos.map((p) => (
                  <div key={p.view} className="overflow-hidden rounded-xl border border-parchment-dark">
                    <AuthImage src={p.url} alt={`${VIEW_INFO[p.view].label} photo`} className="aspect-[3/4] w-full object-cover" />
                    <div className="bg-parchment px-1 py-0.5 text-center text-[10px] font-body text-ink-muted">{VIEW_INFO[p.view].label.replace(' side', '')}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-body text-ink-subtle">Private to you. Deleting keeps the measurements.</p>
                <PillButton variant="danger" size="sm" icon="trash" onClick={() => setConfirm(true)} loading={busy} testId="delete-photos">
                  Delete photos
                </PillButton>
              </div>
            </>
          ) : (
            <p className="text-[11px] font-body text-ink-subtle" data-testid="no-photos">
              {isLegacyScan(scan) ? 'This earlier scan has no stored photos.' : 'The photos for this scan were deleted. Its measurements are kept.'}
            </p>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        danger
        title="Delete these photos?"
        description="The four photos from this scan will be permanently removed from Morphofit. The measurements and history entry stay. This can't be undone."
        confirmLabel="Delete photos"
        onCancel={() => setConfirm(false)}
        onConfirm={deletePhotos}
      />
    </Card>
  )
}

export function ScanHistory({ refreshKey, onNewScan }: { refreshKey: number; onNewScan: () => void }) {
  const [scans, setScans] = useState<SavedScan[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [compare, setCompare] = useState<string[]>([])

  const load = useCallback(() => {
    setError(null)
    api.client
      .measurementHistory()
      .then((s) => {
        setScans(s)
        setOpenId((cur) => (cur && s.some((x) => x.id === cur) ? cur : null))
        setCompare((cur) => cur.filter((id) => s.some((x) => x.id === id)))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your scan history.'))
  }, [])

  useEffect(load, [load, refreshKey])

  const toggleCompare = (id: string) =>
    setCompare((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 2 ? [cur[1], id] : [...cur, id]))

  if (error) {
    return (
      <EmptyState icon="alert" tone="error" title="Couldn't load your scans" description={error} action={<PillButton variant="secondary" icon="refresh" onClick={load}>Try again</PillButton>} />
    )
  }
  if (!scans) return <SkeletonList rows={3} />
  if (scans.length === 0) {
    return (
      <EmptyState
        icon="camera"
        title="No saved scans yet"
        description="Run a photo or live scan and save it. Your history, comparisons and progress appear here."
        action={<PillButton variant="primary" icon="camera" onClick={onNewScan}>Start a scan</PillButton>}
      />
    )
  }

  const open = scans.find((s) => s.id === openId)
  const cmp = compare.map((id) => scans.find((s) => s.id === id)).filter((s): s is SavedScan => !!s)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-testid="scan-history">
      <div className="space-y-3 lg:col-span-5">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold font-display text-ink">Progress over time</h3>
          <Trend scans={scans} />
        </Card>
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold font-display text-ink">Saved scans ({scans.length})</h3>
          <span className="text-[10px] font-data uppercase tracking-wider text-ink-subtle">Tick two to compare</span>
        </div>
        <ul className="space-y-2">
          {scans.map((s) => {
            const conf = confidenceLabel(s.confidence)
            const selected = s.id === openId
            return (
              <li key={s.id} data-testid="scan-row" data-scan-id={s.id}>
                <div className={`flex items-center gap-3 rounded-2xl border bg-surface p-3 transition-colors ${selected ? 'border-forest' : 'border-parchment-dark'}`}>
                  <input
                    type="checkbox"
                    aria-label={`Compare scan from ${fmtDate(s.scannedAt)}`}
                    checked={compare.includes(s.id)}
                    onChange={() => toggleCompare(s.id)}
                    className="h-4 w-4 flex-shrink-0 accent-[var(--color-forest,#16a34a)]"
                  />
                  <button type="button" onClick={() => setOpenId(selected ? null : s.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold font-display capitalize text-ink">{s.morphology.replace('-', ' ')}</span>
                      <span className="flex-shrink-0 text-[10px] font-data text-ink-subtle">{fmtDate(s.scannedAt)}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] font-body text-ink-muted">
                      <span>{methodLabel(s)}</span>
                      {conf && <span className={`rounded-full px-1.5 text-[10px] font-bold ${TONE_CLASS[conf.tone]}`}>{conf.label.replace(' confidence', '')}</span>}
                      {s.photos.length > 0 && <AppIcon name="image" size={12} className="text-ink-subtle" />}
                    </div>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="space-y-4 lg:col-span-7">
        {cmp.length === 2 && <Compare a={cmp[0]} b={cmp[1]} />}
        {open ? (
          <Detail key={open.id} scan={open} onPhotosDeleted={(u) => setScans((cur) => cur && cur.map((x) => (x.id === u.id ? { ...x, photos: u.photos } : x)))} />
        ) : (
          cmp.length < 2 && (
            <Card className="p-8 text-center">
              <p className="text-sm font-body text-ink-muted">Select a scan to see its measurements and photos, or tick two scans to compare them.</p>
            </Card>
          )
        )}
      </div>
    </div>
  )
}

export default ScanHistory
