import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { api, type ScanAnalysis, type ScanMethod, type ScanView } from '../../api'
import { PillButton } from '../../components/ui/primitives'
import { PageShell } from '../../components/ui/PageShell'
import { Tabs } from '../../components/ui/Tabs'
import { AnalyzeStep } from './bodyscan/AnalyzeStep'
import { LiveScanFlow } from './bodyscan/LiveScanFlow'
import { MethodPicker } from './bodyscan/MethodPicker'
import { PhotoScanFlow } from './bodyscan/PhotoScanFlow'
import { ScanHistory } from './bodyscan/ScanHistory'
import { ScanResults } from './bodyscan/ScanResults'
import { usePhotoSet } from './bodyscan/usePhotoSet'

type Mode = 'home' | 'capture' | 'analyze' | 'results'

const DEFAULT_HEIGHT_CM = 170

/**
 * Body Scan hub. Exactly two ways in (Photo scan, Live scan), one shared
 * analysis step, one shared results screen, and one history. Both methods
 * fill the same four-photo set, so everything after capture is identical.
 */
export default function MeasurementsScan() {
  const navigate = useNavigate()
  const photoSet = usePhotoSet()
  const [tab, setTab] = useState<'scan' | 'history'>('scan')
  const [mode, setMode] = useState<Mode>('home')
  const [method, setMethod] = useState<ScanMethod>('photo')
  const [heightCm, setHeightCm] = useState(DEFAULT_HEIGHT_CM)
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null)
  const [historyKey, setHistoryKey] = useState(0)

  // Start from the height on file, so a repeat scan is one step shorter.
  useEffect(() => {
    let alive = true
    api.client
      .measurements()
      .then((m) => alive && m?.height && setHeightCm(m.height))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const choose = (next: ScanMethod) => {
    // A photo set belongs to one method: mixing would mislabel how it was made.
    if (next !== method) photoSet.clearAll()
    setMethod(next)
    setMode('capture')
  }

  const backToMethods = () => {
    photoSet.clearAll()
    setAnalysis(null)
    setMode('home')
  }

  const retake = (views: ScanView[]) => {
    photoSet.clearViews(views)
    setMode('capture')
  }

  const inFlow = mode !== 'home'

  return (
    <PageShell
      title="Body Scan"
      subtitle="Estimate your tailoring measurements from four photos or a live camera scan, and track how they change"
      actions={
        mode === 'results' ? (
          <PillButton variant="primary" size="sm" icon="layers" onClick={() => navigate('/dashboard/visualizer')}>
            3D Studio
          </PillButton>
        ) : null
      }
    >
      <div className="space-y-6">
        {!inFlow && (
          <Tabs
            variant="pill"
            value={tab}
            onChange={(t) => setTab(t as 'scan' | 'history')}
            tabs={[
              { id: 'scan', label: 'New scan', icon: 'camera' },
              { id: 'history', label: 'History & progress', icon: 'barChart' },
            ]}
          />
        )}

        {!inFlow && tab === 'scan' && <MethodPicker onChoose={choose} />}
        {!inFlow && tab === 'history' && <ScanHistory refreshKey={historyKey} onNewScan={() => setTab('scan')} />}

        {mode === 'capture' && method === 'photo' && (
          <PhotoScanFlow
            photos={photoSet.photos}
            missing={photoSet.missing}
            onSetPhoto={photoSet.setPhoto}
            onRemovePhoto={(v) => photoSet.clearViews([v])}
            heightCm={heightCm}
            onHeightChange={setHeightCm}
            onAnalyze={() => setMode('analyze')}
            onBack={backToMethods}
          />
        )}

        {mode === 'capture' && method === 'live' && (
          <LiveScanFlow
            photos={photoSet.photos}
            missing={photoSet.missing}
            onSetPhoto={photoSet.setPhoto}
            heightCm={heightCm}
            onHeightChange={setHeightCm}
            onAnalyze={() => setMode('analyze')}
            onBack={backToMethods}
            onUsePhoto={() => choose('photo')}
          />
        )}

        {mode === 'analyze' && photoSet.complete && (
          <AnalyzeStep
            photos={photoSet.photos}
            heightCm={heightCm}
            method={method}
            onDone={(a) => {
              setAnalysis(a)
              setMode('results')
            }}
            onRetakeViews={retake}
            onCancel={() => setMode('capture')}
          />
        )}

        {mode === 'results' && analysis && (
          <ScanResults
            analysis={analysis}
            onSaved={() => setHistoryKey((k) => k + 1)}
            onRescan={backToMethods}
          />
        )}
      </div>
    </PageShell>
  )
}
