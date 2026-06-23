/**
 * DocFlow application shell. Progressive disclosure via two modes (spec §5):
 * Executive (clean narrative, one chart, headline readout) and Scientific (a
 * secondary tab strip over Workbench / Causal loops / Tipping / Sensitivity /
 * Compare). The analytical views are lazy-loaded so they (and Plotly) stay out of
 * Executive's initial bundle. The no-forecast banner is pinned. A shared scenario
 * encoded in the URL hash is decoded on load.
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { useStore } from './state/store'
import { LeverSliders } from './components/LeverSliders'
import { PresetGallery } from './components/PresetGallery'
import { HeadlineReadout } from './components/HeadlineReadout'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { EpistemicBanner } from './components/EpistemicBanner'
import { ScientificTabs } from './components/ScientificTabs'
import { ScenarioToolbar } from './components/ScenarioToolbar'
import { decodeScenarioFromHash } from './lib/share'

const Workbench = lazy(() => import('./views/Workbench').then((m) => ({ default: m.Workbench })))
const InstitutionalView = lazy(() => import('./views/InstitutionalView').then((m) => ({ default: m.InstitutionalView })))
const CausalLoopView = lazy(() => import('./views/CausalLoopView').then((m) => ({ default: m.CausalLoopView })))
const TippingView = lazy(() => import('./views/TippingView').then((m) => ({ default: m.TippingView })))
const SensitivityView = lazy(() => import('./views/SensitivityView').then((m) => ({ default: m.SensitivityView })))
const CompareView = lazy(() => import('./views/CompareView').then((m) => ({ default: m.CompareView })))

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return [dark, () => setDark((d) => !d)]
}

function Header() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const showMC = useStore((s) => s.showMonteCarlo)
  const toggleMC = useStore((s) => s.toggleMonteCarlo)
  const [dark, toggleDark] = useDarkMode()

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-[20px] font-semibold tracking-tight text-ink">DocFlow</span>
          <span className="hidden text-[12px] text-muted sm:inline">
            AI incident-documentation: chilling vs. learning equilibria
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'scientific' && (
            <button
              type="button"
              onClick={toggleMC}
              aria-pressed={showMC}
              className={`rounded-md border px-2.5 py-1 text-[12px] transition-colors ${showMC ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-soft hover:border-accent'}`}
            >
              Monte Carlo {showMC ? 'on' : 'off'}
            </button>
          )}
          <div role="tablist" aria-label="Presentation mode" className="flex rounded-md border border-line p-0.5">
            {(['executive', 'scientific'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded px-3 py-1 text-[12px] font-medium capitalize transition-colors ${mode === m ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="rounded-md border border-line px-2 py-1 text-[12px] text-ink-soft hover:border-accent"
          >
            {dark ? '☀' : '☾'}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-line/60 px-4 py-1.5">
        <ScenarioToolbar />
      </div>
    </header>
  )
}

function ExecutiveMode() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="space-y-4">
        <PresetGallery />
        <LeverSliders />
      </div>
      <div className="space-y-4">
        <HeadlineReadout />
        <div className="rounded-lg border border-line bg-surface p-4">
          <h2 className="m-0 mb-2 text-[15px] font-semibold text-ink">The documentation story</h2>
          <TimeSeriesChart
            seriesKeys={['f_doc', 'C', 'TD']}
            title="Documentation fraction & culture (left) · technical debt (right)"
          />
        </div>
      </div>
    </div>
  )
}

const FALLBACK = <div className="p-6 text-center text-[12px] text-muted">Loading view…</div>

function ScientificMode() {
  const view = useStore((s) => s.view)
  return (
    <div className="space-y-4">
      <ScientificTabs />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <PresetGallery />
          <LeverSliders />
        </div>
        <div>
          <Suspense fallback={FALLBACK}>
            {view === 'workbench' && <Workbench />}
            {view === 'institutional' && <InstitutionalView />}
            {view === 'cld' && <CausalLoopView />}
            {view === 'tipping' && <TippingView />}
            {view === 'sensitivity' && <SensitivityView />}
            {view === 'compare' && <CompareView />}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const mode = useStore((s) => s.mode)
  const loadScenario = useStore((s) => s.loadScenario)

  // Decode a shared scenario from the URL hash on first load, then clear the hash.
  useEffect(() => {
    const sc = decodeScenarioFromHash(window.location.hash)
    if (sc) {
      loadScenario({ params: sc.params, init: sc.init, settings: sc.settings, presetId: sc.presetId, name: sc.name, annotations: sc.annotations })
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-4">
        {mode === 'executive' ? <ExecutiveMode /> : <ScientificMode />}
      </main>
      <div className="sticky bottom-0 z-10">
        <EpistemicBanner />
      </div>
    </div>
  )
}
