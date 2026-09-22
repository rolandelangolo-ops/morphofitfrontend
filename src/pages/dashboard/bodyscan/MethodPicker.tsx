import { useState } from 'react'
import type { ScanMethod } from '../../../api'
import { Card, PillButton } from '../../../components/ui/primitives'
import { AppIcon, type IconName } from '../../../components/ui/icons'

const CONSENT_KEY = 'morphofit_bodyscan_consent_v1'

// Consent is a per-viewer convenience (so it isn't asked on every scan); it
// must never break the page if storage is unavailable.
const readConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1'
  } catch {
    return false
  }
}
const writeConsent = (on: boolean) => {
  try {
    if (on) localStorage.setItem(CONSENT_KEY, '1')
    else localStorage.removeItem(CONSENT_KEY)
  } catch {
    /* ignore */
  }
}

const METHODS: { id: ScanMethod; title: string; icon: IconName; tagline: string; points: string[] }[] = [
  {
    id: 'photo',
    title: 'Photo Body Scan',
    icon: 'image',
    tagline: 'Four photos: front, back, left side, right side.',
    points: ['Take them with your phone camera or upload from your device', 'Preview and retake any angle', 'Works on any connection, with any camera'],
  },
  {
    id: 'live',
    title: 'Live Body Scan',
    icon: 'camera',
    tagline: 'Your camera guides you, then captures each angle for you.',
    points: ['Real-time on-device guidance: step back, centre, turn', 'Auto-captures when you are in position and still', 'Confirm or retake each photo before analysis'],
  },
]

export function MethodPicker({ onChoose }: { onChoose: (method: ScanMethod) => void }) {
  const [consent, setConsent] = useState(readConsent)
  const insecure = typeof window !== 'undefined' && !window.isSecureContext

  return (
    <div className="space-y-6" data-testid="method-picker">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {METHODS.map((m) => (
          <Card key={m.id} className="flex flex-col p-6" variant="elevated">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-forest text-white shadow-md">
                <AppIcon name={m.icon} size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold font-display tracking-tight text-ink">{m.title}</h3>
                <p className="mt-0.5 text-xs font-body leading-relaxed text-ink-muted">{m.tagline}</p>
              </div>
            </div>
            <ul className="mt-4 flex-1 space-y-2">
              {m.points.map((p) => (
                <li key={p} className="flex gap-2 text-xs font-body leading-relaxed text-ink-muted">
                  <AppIcon name="check" size={13} className="mt-0.5 flex-shrink-0 text-forest" />
                  {p}
                </li>
              ))}
            </ul>
            {m.id === 'live' && insecure && (
              <p className="mt-3 rounded-lg bg-parchment px-3 py-2 text-[11px] font-body text-ink-muted" data-testid="insecure-note">
                Live scan needs a secure (https) connection to use the camera. This page isn't on one, so use Photo Body Scan here.
              </p>
            )}
            <div className="mt-5">
              <PillButton variant="primary" size="lg" fullWidth icon={m.icon} disabled={!consent} onClick={() => onChoose(m.id)} testId={`choose-${m.id}`}>
                Start {m.id === 'photo' ? 'photo' : 'live'} scan
              </PillButton>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked)
              writeConsent(e.target.checked)
            }}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--color-forest,#16a34a)]"
            data-testid="scan-consent"
          />
          <span className="text-xs font-body leading-relaxed text-ink-muted">
            <span className="font-semibold text-ink">I understand how my photos are used.</span> My four photos are sent to Google's Gemini AI to estimate my measurements, and are stored privately on Morphofit's servers so I can review them. Only I can see them, and I can delete them from any saved scan. Live scan guidance runs on my device and sends nothing until I confirm my photos.
          </span>
        </label>
        <p className="mt-3 pl-7 text-[11px] font-body text-ink-subtle">
          Results are AI estimates, not tape measurements. You can correct every value, and we recommend verifying with your tailor before production.
        </p>
      </Card>
    </div>
  )
}

export default MethodPicker
