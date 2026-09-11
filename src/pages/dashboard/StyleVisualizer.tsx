import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../AuthContext'
import { api, type Measurements } from '../../api'
import { Card, PillButton } from '../../components/ui/primitives'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { useToast } from '../../components/ui/Toast'
import MannequinViewer3D, {
  type MorphologyShape,
  GARMENT_STYLES,
  FABRIC_OPTIONS,
  COLOR_SWATCHES,
} from '../../components/visualizer/MannequinViewer3D'

const MORPHOLOGY_GUIDES: Record<
  MorphologyShape,
  {
    name: string
    proportions: string
    strengths: string
    flatteringCuts: string[]
    cautionCuts: string[]
    stylistAdvice: string
  }
> = {
  hourglass: {
    name: 'Hourglass Archetype',
    proportions:
      'Balanced shoulder & hip width with a sharply indented natural waistline (waist-to-hip ratio < 0.75).',
    strengths: 'Natural symmetry and defined midriff curvature.',
    flatteringCuts: [
      'Wrap Midi Dresses',
      'Fitted Peplum Jackets',
      'Belted Trench Coats',
      'V-Neck Bodices',
      'Mermaid Skirts',
    ],
    cautionCuts: ['Shapeless Boxy Shifts', 'Stiff Drop-Waist Silhouettes'],
    stylistAdvice:
      'Celebrate the natural waist cinch without adding artificial bulk around the hips or shoulders.',
  },
  rectangle: {
    name: 'Rectangle Archetype',
    proportions:
      'Shoulder, bust, waist, and hip widths align evenly with subtle waist indentation.',
    strengths: 'Long athletic lines and versatile styling versatility.',
    flatteringCuts: [
      'Architectural Tailored Blazers',
      'A-Line Skirts',
      'Ruched & Draped Bodices',
      'Wide-Leg Pleated Trousers',
    ],
    cautionCuts: ['Skin-tight Column Dresses with no waist accents'],
    stylistAdvice:
      'Use diagonal draping, color-blocking, or a cinching belt to construct dynamic curves and visual depth.',
  },
  pear: {
    name: 'Pear (Triangle) Archetype',
    proportions:
      'Shoulders and bust are visually narrower than the hips and thigh line.',
    strengths: 'Graceful neckline, delicate collarbones, and feminine curves.',
    flatteringCuts: [
      'Bateau / Boatneck Gowns',
      'Puff / Structured Shoulders',
      'Empire Cut Dresses',
      'Dark Tapered Pants',
    ],
    cautionCuts: [
      'Hip-level Patch Pockets',
      'Heavy gathered waist ruffles at hip level',
    ],
    stylistAdvice:
      'Draw the eye upward with horizontal necklines and shoulder accents while allowing skirts to drape fluidly over the hips.',
  },
  'inverted-triangle': {
    name: 'Inverted Triangle Archetype',
    proportions:
      'Athletic broad shoulders or full bust tapering down to narrower hips and slim legs.',
    strengths:
      'Striking posture, regal shoulder presence, and slender lower limbs.',
    flatteringCuts: [
      'Plunging V-Necklines',
      'Flared & Godet Skirts',
      'Palazzo Trousers',
      'Raglan Sleeves',
      'Peplum Tops',
    ],
    cautionCuts: [
      'Heavy Shoulder Pads',
      'High boatneck collars with puff sleeves',
    ],
    stylistAdvice:
      'Soften the shoulder line with vertical lapels and add flared volume below the waist to create proportional equilibrium.',
  },
  oval: {
    name: 'Oval (Apple) Archetype',
    proportions:
      'Fullness concentrated around the torso and waist with slender extremities and shapely legs.',
    strengths: 'Magnificent decolletage and slender arms and ankles.',
    flatteringCuts: [
      'Empire-Waist Maxi Gowns',
      'Single-Breasted Longline Blazers',
      'Flowing Kimono Wraps',
      'Asymmetric Tunics',
    ],
    cautionCuts: [
      'Horizontal stripes around midriff',
      'Tight bodycon waistbands',
    ],
    stylistAdvice:
      'Lift the eye with vertical panels, monochromatic palettes, and empire waist seams positioned right beneath the bust.',
  },
}

export default function StyleVisualizer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { show } = useToast()

  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [selectedShape, setSelectedShape] =
    useState<MorphologyShape>('hourglass')
  const [selectedStyleId, setSelectedStyleId] = useState('wrap-dress')
  const [selectedFabricId, setSelectedFabricId] = useState('silk')
  const [selectedColorHex, setSelectedColorHex] = useState('#1A4D3E')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'client') {
      api.client
        .measurements()
        .then((m) => {
          if (m) {
            setMeasurements(m)
            const normalized = m.morphology
              .toLowerCase()
              .replace(/\s+/g, '-') as MorphologyShape
            if (MORPHOLOGY_GUIDES[normalized]) {
              setSelectedShape(normalized)
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const activeGuide =
    MORPHOLOGY_GUIDES[selectedShape] || MORPHOLOGY_GUIDES.hourglass
  const activeStyle =
    GARMENT_STYLES.find((s) => s.id === selectedStyleId) || GARMENT_STYLES[0]
  const activeFabric =
    FABRIC_OPTIONS.find((f) => f.id === selectedFabricId) || FABRIC_OPTIONS[0]
  const isMatch = activeStyle.recommendedFor.includes(selectedShape)

  const handleStartCustomOrder = () => {
    const draftOrder = {
      item: activeStyle.name,
      morphology: selectedShape,
      fabric: activeFabric.name,
      color: selectedColorHex,
      styleId: activeStyle.id,
      notes: `Custom tailored ${activeStyle.name} in ${activeFabric.name} calibrated for ${selectedShape.toUpperCase()} morphology silhouette.`,
    }
    localStorage.setItem('morphofit_draft_order', JSON.stringify(draftOrder))

    show({
      title: 'Style Configuration Saved',
      description:
        'Redirecting to Tailors Directory to choose your artisan and start negotiation.',
      tone: 'success',
    })

    navigate('/dashboard/tailors')
  }

  const headerActions = (
    <div className="flex items-center gap-2.5">
      <PillButton
        variant="secondary"
        size="sm"
        icon="ruler"
        onClick={() => navigate('/dashboard/measurements')}
      >
        {measurements ? 'Recalibrate Scan' : 'Take Body Scan'}
      </PillButton>
      <PillButton
        variant="primary"
        size="sm"
        icon="handshake"
        onClick={handleStartCustomOrder}
      >
        Order with Tailor
      </PillButton>
    </div>
  )

  return (
    <PageShell
      title="3D Style Visualizer & Simulation"
      subtitle="Interact with real-time 3D garments sculpted to your exact morphology proportions"
      actions={headerActions}
      loading={loading}
    >
      <div className="space-y-6">
        {/* ── Morphology Model Selector ────────────────────────────────── */}
        <Card className="p-4 bg-surface">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
              Active Morphology Model
            </span>
            {measurements?.morphology && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-0.5 text-[10px] font-semibold font-data text-forest">
                <AppIcon name="checkCircle" size={12} />
                <span>Calibrated from 2-Photo Scan</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(
              [
                'hourglass',
                'rectangle',
                'pear',
                'inverted-triangle',
                'oval',
              ] as MorphologyShape[]
            ).map((shape) => {
              const active = selectedShape === shape
              const guide = MORPHOLOGY_GUIDES[shape]

              return (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setSelectedShape(shape)}
                  className={`flex flex-col items-center rounded-2xl border p-3 text-center transition-all ${
                    active
                      ? 'border-forest bg-forest text-white shadow-md'
                      : 'border-parchment-dark bg-surface text-ink hover:border-forest/40'
                  }`}
                >
                  <span className="text-xs font-bold font-display capitalize">
                    {shape.replace('-', ' ')}
                  </span>
                  <span
                    className={`mt-1 text-[9px] font-data uppercase tracking-wider ${
                      active ? 'text-white/80' : 'text-ink-subtle'
                    }`}
                  >
                    {guide.flatteringCuts[0].split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* ── Main Workspace: 3D Canvas + Stylist Directives ─────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: 3D Interactive Mannequin */}
          <div className="lg:col-span-7">
            <MannequinViewer3D
              morphology={selectedShape}
              selectedStyleId={selectedStyleId}
              selectedFabricId={selectedFabricId}
              selectedColorHex={selectedColorHex}
              onStyleChange={setSelectedStyleId}
              onFabricChange={setSelectedFabricId}
              onColorChange={setSelectedColorHex}
              height={560}
              interactive
            />
          </div>

          {/* Right: Architectural Intelligence Panel */}
          <div className="space-y-4 lg:col-span-5">
            {/* Morphological Harmony Card */}
            <Card className="p-6 bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-widest">
                  Architectural Harmony
                </span>
                {isMatch ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold font-data text-emerald-800">
                    <AppIcon name="sparkles" size={11} /> Ideal Silhouette Match
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-parchment px-2.5 py-0.5 text-[10px] font-data text-ink-subtle">
                    Alternative Cut
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-xl font-bold font-display text-ink tracking-tight">
                {activeGuide.name}
              </h2>
              <p className="mt-1 text-xs font-body text-ink-muted leading-relaxed">
                {activeGuide.proportions}
              </p>

              {/* Stylist Advice */}
              <div className="mt-4 rounded-xl border border-parchment-dark bg-parchment p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold font-body text-forest mb-1">
                  <AppIcon name="sparkles" size={13} />
                  <span>Haute Couture Directive</span>
                </div>
                <p className="text-xs font-body text-ink-subtle leading-relaxed">
                  {activeGuide.stylistAdvice}
                </p>
              </div>

              {/* Harmonic vs Caution Cuts */}
              <div className="mt-4 space-y-2 pt-2 border-t border-parchment-dark">
                <div>
                  <span className="block text-[9px] font-data font-semibold text-ink-subtle uppercase tracking-wider mb-1">
                    Harmonizing Cuts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeGuide.flatteringCuts.map((cut) => (
                      <span
                        key={cut}
                        className="rounded-lg bg-surface border border-parchment-dark px-2 py-1 text-[10px] font-body text-ink font-medium"
                      >
                        {cut}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-[9px] font-data font-semibold text-ink-subtle uppercase tracking-wider mb-1">
                    Silhouettes to Avoid
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeGuide.cautionCuts.map((cut) => (
                      <span
                        key={cut}
                        className="rounded-lg bg-red-500/5 border border-seal/20 px-2 py-1 text-[10px] font-body text-seal"
                      >
                        {cut}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Selected Garment Spec Summary */}
            <Card className="p-5 bg-parchment space-y-3">
              <span className="block text-[10px] font-data font-semibold text-forest uppercase tracking-widest">
                Selected Specification
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-subtle">Silhouette:</span>
                  <span className="font-semibold text-ink">
                    {activeStyle.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-subtle">Textile:</span>
                  <span className="font-semibold text-ink">
                    {activeFabric.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-subtle">Selected Hue:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ background: selectedColorHex }}
                    />
                    <span className="font-data font-semibold text-ink">
                      {
                        COLOR_SWATCHES.find(
                          (c) =>
                            c.hex.toLowerCase() ===
                            selectedColorHex.toLowerCase()
                        )?.name || selectedColorHex
                      }
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartCustomOrder}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-xs font-bold font-data uppercase tracking-wider text-white shadow-md hover:brightness-105 active:scale-95 transition-all"
              >
                <AppIcon name="handshake" size={14} />
                Order This Garment
              </button>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
