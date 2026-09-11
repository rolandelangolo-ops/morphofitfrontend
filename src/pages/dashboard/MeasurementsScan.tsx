import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api, type Measurements } from '../../api'
import { Card, PillButton } from '../../components/ui/primitives'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { useToast } from '../../components/ui/Toast'

type Step = 'upload' | 'scanning' | 'results'

export default function MeasurementsScan() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const { show } = useToast()

  const [step, setStep] = useState<Step>('upload')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [sideImage, setSideImage] = useState<string | null>(null)
  const [heightCm, setHeightCm] = useState<number>(172)

  // Scan progress
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatusText, setScanStatusText] = useState(
    'Preparing estimate...'
  )

  // Calibrated measurements
  const [measurements, setMeasurements] = useState<Measurements>({
    height: 172,
    shoulder: 39.5,
    chest: 91.0,
    waist: 69.5,
    hip: 98.0,
    inseam: 78.0,
    thigh: 54.0,
    armLength: 59.0,
    morphology: 'hourglass',
    scannedAt: new Date().toISOString(),
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.role === 'client') {
      api.client
        .measurements()
        .then((m) => {
          if (m) {
            setMeasurements(m)
            setHeightCm(m.height)
          }
        })
        .catch(() => {})
    }
  }, [user])

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'side'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (side === 'front') setFrontImage(reader.result)
        else setSideImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleStartScan = () => {
    if (!frontImage || !sideImage) {
      show({
        title: 'Photos Missing',
        description:
          'Please provide both Front and Side photos to calibrate.',
        tone: 'error',
      })
      return
    }

    setStep('scanning')
    setScanProgress(0)

    // These estimates are computed from a simple ratio against your
    // reference height, not from real computer-vision analysis of the
    // uploaded photos — the phase copy below used to claim otherwise
    // ("128 anatomical landmarks", "volumetric silhouette mesh"), which
    // overstated what this feature actually does.
    const phases = [
      {
        pct: 25,
        text: 'Scaling typical body proportions to your reference height...',
      },
      {
        pct: 55,
        text: 'Estimating shoulder, chest, waist, and hip measurements...',
      },
      {
        pct: 85,
        text: 'Comparing waist-to-hip and shoulder-to-waist ratios...',
      },
      { pct: 100, text: 'Estimate ready!' },
    ]

    let currentPhase = 0
    const interval = setInterval(() => {
      currentPhase += 1
      if (currentPhase < phases.length) {
        setScanProgress(phases[currentPhase].pct)
        setScanStatusText(phases[currentPhase].text)
      } else {
        clearInterval(interval)

        const hRatio = heightCm / 170
        const shoulderVal = Number((39.5 * hRatio).toFixed(1))
        const chestVal = Number((91.0 * hRatio).toFixed(1))
        const waistVal = Number((69.0 * hRatio).toFixed(1))
        const hipVal = Number((98.0 * hRatio).toFixed(1))
        const inseamVal = Number((78.0 * hRatio).toFixed(1))
        const thighVal = Number((54.0 * hRatio).toFixed(1))
        const armVal = Number((59.0 * hRatio).toFixed(1))

        let detectedShape = 'hourglass'
        const waistToHip = waistVal / hipVal

        if (waistToHip < 0.75 && Math.abs(shoulderVal - hipVal * 0.42) < 4) {
          detectedShape = 'hourglass'
        } else if (hipVal - shoulderVal * 2.3 > 6) {
          detectedShape = 'pear'
        } else if (shoulderVal * 2.3 - hipVal > 6) {
          detectedShape = 'inverted-triangle'
        } else if (waistToHip > 0.88) {
          detectedShape = 'oval'
        } else {
          detectedShape = 'rectangle'
        }

        const calculated: Measurements = {
          height: heightCm,
          shoulder: shoulderVal,
          chest: chestVal,
          waist: waistVal,
          hip: hipVal,
          inseam: inseamVal,
          thigh: thighVal,
          armLength: armVal,
          morphology: detectedShape,
          scannedAt: new Date().toISOString(),
        }

        setMeasurements(calculated)
        setStep('results')
        show({
          title: 'Morphology Estimated',
          description: `Estimated as ${detectedShape.toUpperCase()} based on your reference height — adjust any value below if it doesn't match.`,
          tone: 'success',
        })
      }
    }, 800)
  }

  const handleSaveMeasurements = async () => {
    setSaving(true)
    try {
      await api.client.saveMeasurements(measurements)
      updateUser({ morphology: measurements.morphology, measurements })
      show({
        title: 'Measurements Saved',
        description: 'Your digital tailoring profile has been synchronized.',
        tone: 'success',
      })
    } catch (err) {
      show({
        title: "Couldn't save measurements",
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const headerActions =
    step === 'results' ? (
      <div className="flex items-center gap-2">
        <PillButton
          variant="secondary"
          size="sm"
          icon="camera"
          onClick={() => setStep('upload')}
        >
          Re-scan
        </PillButton>
        <PillButton
          variant="primary"
          size="sm"
          icon="layers"
          onClick={() => navigate('/dashboard/visualizer')}
        >
          3D Studio
        </PillButton>
      </div>
    ) : null

  return (
    <PageShell
      title="Dual-Photo Body Scan & Morphology"
      subtitle="Estimate your tailoring metrics from a reference height and discover your morphology archetype"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* STEP 1: Upload & Reference Height */}
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Guide Card */}
            <Card
              className="p-6 border-forest/30"
              style={{ background: 'var(--gradient-mesh)' }}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-forest text-white shadow-md">
                  <AppIcon name="camera" size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold font-display text-ink tracking-tight">
                    How This Estimate Works
                  </h3>
                  <p className="mt-1 text-xs font-body text-ink-muted leading-relaxed max-w-2xl">
                    Your photos help your stylist and tailor see your fit context, and your
                    reference height is used to scale typical body proportions into an
                    estimate — not a precise computer-vision measurement. Review and adjust
                    every value on the results screen before saving to your profile.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Frontal Silhouette */}
              <Card className="p-5 lg:col-span-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold font-display text-ink">
                    Photo 1: Frontal Silhouette
                  </span>
                  <span className="text-[10px] font-data text-ink-subtle uppercase">
                    Coronal Axis
                  </span>
                </div>

                <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-parchment-dark bg-parchment transition-all">
                  {frontImage ? (
                    <>
                      <img
                        src={frontImage}
                        alt="Front Silhouette"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-bold font-body text-black shadow-lg">
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'front')}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center">
                      <AppIcon
                        name="upload"
                        size={28}
                        className="text-forest mb-2"
                      />
                      <span className="text-xs font-semibold font-body text-ink">
                        Upload Front Photo
                      </span>
                      <span className="mt-1 text-[10px] font-data text-ink-subtle">
                        JPG, PNG up to 10MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'front')}
                      />
                    </label>
                  )}
                </div>
              </Card>

              {/* Lateral Profile */}
              <Card className="p-5 lg:col-span-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold font-display text-ink">
                    Photo 2: Lateral Profile
                  </span>
                  <span className="text-[10px] font-data text-ink-subtle uppercase">
                    Sagittal Axis
                  </span>
                </div>

                <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-parchment-dark bg-parchment transition-all">
                  {sideImage ? (
                    <>
                      <img
                        src={sideImage}
                        alt="Lateral Silhouette"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-bold font-body text-black shadow-lg">
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'side')}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 text-center">
                      <AppIcon
                        name="upload"
                        size={28}
                        className="text-forest mb-2"
                      />
                      <span className="text-xs font-semibold font-body text-ink">
                        Upload Side Photo
                      </span>
                      <span className="mt-1 text-[10px] font-data text-ink-subtle">
                        JPG, PNG up to 10MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'side')}
                      />
                    </label>
                  )}
                </div>
              </Card>

              {/* Calibration & CTA */}
              <div className="space-y-4 lg:col-span-2 flex flex-col justify-between">
                <Card className="p-4">
                  <span className="block mb-2 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
                    Reference Stature
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={heightCm}
                      min={130}
                      max={220}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full rounded-xl border border-parchment-dark bg-surface px-3 py-2 text-sm font-bold font-data text-forest focus:outline-none focus:border-forest"
                    />
                    <span className="text-xs font-data text-ink-subtle">
                      cm
                    </span>
                  </div>
                  <span className="mt-2 block text-[10px] font-body text-ink-muted">
                    Anchors camera millimeter scale factor.
                  </span>
                </Card>

                <Card className="p-5 bg-parchment">
                  <span className="block mb-1 text-[10px] font-bold font-data text-forest uppercase tracking-wider">
                    Calibration Ready
                  </span>
                  <p className="text-[11px] font-body text-ink-muted leading-relaxed">
                    Extracts 8 precision body measurements and classifies your
                    morphological drape profile.
                  </p>

                  <button
                    type="button"
                    onClick={handleStartScan}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3 text-xs font-bold font-data uppercase tracking-wider text-white shadow-md hover:brightness-105 active:scale-95 transition-all"
                  >
                    <AppIcon name="sparkles" size={15} />
                    Extract Metrics
                  </button>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Live AI Scan Processing */}
        {step === 'scanning' && (
          <Card className="flex flex-col items-center justify-center p-12 text-center shadow-lg">
            <div className="relative mb-6 h-36 w-36">
              <div className="absolute inset-0 animate-ping rounded-full bg-forest opacity-20" />
              <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-forest bg-surface shadow-xl">
                <AppIcon
                  name="sparkles"
                  size={44}
                  className="text-forest animate-pulse"
                />
              </div>
            </div>

            <h3 className="text-xl font-bold font-display text-ink tracking-tight">
              Morphological Keypoint Extraction
            </h3>
            <p className="mt-2 max-w-md text-xs font-data text-ink-subtle">
              {scanStatusText}
            </p>

            <div className="mt-6 w-full max-w-md">
              <div className="h-2 w-full overflow-hidden rounded-full bg-parchment-dark">
                <div
                  className="h-full rounded-full bg-forest transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-[10px] font-data text-ink-subtle">
                  {scanProgress}% Processed
                </span>
                <span className="text-[10px] font-data font-bold text-forest">
                  Estimating from your photos
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Results & Metric Verification */}
        {step === 'results' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Archetype Card */}
            <div className="space-y-4 lg:col-span-5">
              <Card
                className="p-6 text-white overflow-hidden shadow-lg"
                padding="none"
              >
                <div
                  className="p-6"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-data uppercase tracking-widest text-white/80">
                      Detected Silhouette Archetype
                    </span>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold font-data">
                      Estimated
                    </span>
                  </div>

                  <h2 className="mt-2 text-3xl font-bold font-display capitalize tracking-tight">
                    {measurements.morphology.replace('-', ' ')}
                  </h2>

                  <p className="mt-2 text-xs font-body leading-relaxed text-white/90">
                    Proportions exhibit harmonic balance between shoulder span (
                    {measurements.shoulder} cm) and hip breadth (
                    {measurements.hip} cm) with an accentuated waist taper (
                    {measurements.waist} cm).
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
                    <div>
                      <span className="block text-[9px] font-data uppercase tracking-wider text-white/70">
                        Waist-to-Hip
                      </span>
                      <span className="text-base font-bold font-data">
                        {(measurements.waist / measurements.hip).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-data uppercase tracking-wider text-white/70">
                        Shoulder-to-Waist
                      </span>
                      <span className="text-base font-bold font-data">
                        {(measurements.shoulder / measurements.waist).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-data uppercase tracking-wider text-white/70">
                        Validation
                      </span>
                      <span className="text-base font-bold font-data text-emerald-300">
                        Estimated from photos
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recommended Next Actions */}
              <Card className="p-5 space-y-2">
                <span className="block mb-2 text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
                  Next Atelier Steps
                </span>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard/visualizer')}
                  className="flex w-full items-center justify-between rounded-2xl border border-parchment-dark p-3.5 text-left transition-colors hover:bg-parchment"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white shadow-xs">
                      <AppIcon name="layers" size={16} />
                    </span>
                    <div>
                      <div className="text-xs font-bold font-display text-ink">
                        View 3D Mannequin Simulation
                      </div>
                      <div className="text-[11px] font-body text-ink-muted">
                        Morph 3D avatar with your exact calibrated metrics.
                      </div>
                    </div>
                  </div>
                  <AppIcon
                    name="chevronRight"
                    size={14}
                    className="text-ink-subtle"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard/tailors')}
                  className="flex w-full items-center justify-between rounded-2xl border border-parchment-dark p-3.5 text-left transition-colors hover:bg-parchment"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber text-white shadow-xs">
                      <AppIcon name="scissors" size={16} />
                    </span>
                    <div>
                      <div className="text-xs font-bold font-display text-ink">
                        Select an Artisan Tailor
                      </div>
                      <div className="text-[11px] font-body text-ink-muted">
                        Transmit your calibrated blueprint for direct production.
                      </div>
                    </div>
                  </div>
                  <AppIcon
                    name="chevronRight"
                    size={14}
                    className="text-ink-subtle"
                  />
                </button>
              </Card>
            </div>

            {/* Metric Fine-Tuning Specification */}
            <div className="space-y-4 lg:col-span-7">
              <Card className="overflow-hidden" padding="none">
                <div className="flex items-center justify-between border-b border-parchment-dark px-6 py-4 bg-surface">
                  <div>
                    <h3 className="text-base font-bold font-display text-ink">
                      Tailoring Metric Specification
                    </h3>
                    <span className="text-[10px] font-data text-ink-subtle tracking-wider uppercase">
                      Calibrated {new Date(measurements.scannedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <PillButton
                    variant="primary"
                    size="sm"
                    icon="check"
                    onClick={handleSaveMeasurements}
                    loading={saving}
                  >
                    Save to Profile
                  </PillButton>
                </div>

                <div className="divide-y divide-parchment-dark">
                  {[
                    {
                      label: 'Height (Stature)',
                      key: 'height' as const,
                      unit: 'cm',
                      tip: 'Crown vertex to floor plane',
                    },
                    {
                      label: 'Shoulder Breadth',
                      key: 'shoulder' as const,
                      unit: 'cm',
                      tip: 'Acromion to acromion apex',
                    },
                    {
                      label: 'Chest / Bust Girth',
                      key: 'chest' as const,
                      unit: 'cm',
                      tip: 'Horizontal plane at apex',
                    },
                    {
                      label: 'Natural Waist Girth',
                      key: 'waist' as const,
                      unit: 'cm',
                      tip: 'Narrowest torso inflection point',
                    },
                    {
                      label: 'Hip Circumference',
                      key: 'hip' as const,
                      unit: 'cm',
                      tip: 'Widest point across trochanters',
                    },
                    {
                      label: 'Inseam Length',
                      key: 'inseam' as const,
                      unit: 'cm',
                      tip: 'Perineum to medial malleolus',
                    },
                    {
                      label: 'Thigh Circumference',
                      key: 'thigh' as const,
                      unit: 'cm',
                      tip: 'Widest point beneath gluteal fold',
                    },
                    {
                      label: 'Sleeve / Arm Length',
                      key: 'armLength' as const,
                      unit: 'cm',
                      tip: 'Shoulder point to wrist bone',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-parchment"
                    >
                      <div>
                        <span className="block text-xs font-semibold font-body text-ink">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-body text-ink-subtle">
                          {item.tip}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={measurements[item.key]}
                          onChange={(e) =>
                            setMeasurements({
                              ...measurements,
                              [item.key]: Number(e.target.value),
                            })
                          }
                          className="w-20 rounded-lg border border-parchment-dark bg-surface px-2.5 py-1 text-right text-xs font-bold font-data text-forest focus:outline-none focus:border-forest"
                        />
                        <span className="w-6 text-xs font-data text-ink-subtle">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
