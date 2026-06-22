/**
 * DocFlow application shell. Progressive disclosure via two modes (spec §5):
 * Executive (clean narrative, one chart, headline readout) and Scientific (full
 * levers, Monte Carlo, assumptions, analytics). The no-forecast banner is pinned.
 */
import { useEffect, useState } from 'react'
import { useStore } from './state/store'
import { LeverSliders } from './components/LeverSliders'
import { PresetGallery } from './components/PresetGallery'
import { HeadlineReadout } from './components/HeadlineReadout'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { AssumptionsPanel } from './components/AssumptionsPanel'
import { EpistemicBanner } from './components/EpistemicBanner'

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
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 py-2.5 backdrop-blur">
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

function ScientificMode() {
  const [showAssumptions, setShowAssumptions] = useState(true)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-4">
          <PresetGallery />
          <LeverSliders />
        </div>
        <div className="space-y-4">
          <HeadlineReadout />
          <div className="rounded-lg border border-line bg-surface p-4">
            <h2 className="m-0 mb-2 text-[15px] font-semibold text-ink">All stocks &amp; documentation fraction</h2>
            <TimeSeriesChart seriesKeys={['f_doc', 'C', 'U', 'D', 'TD', 'L', 'E']} height={380} />
            <p className="mt-1 text-[11px] text-muted">
              0–1 indices (documentation fraction, culture) on the left axis; counts/indices on the right.
              Toggle Monte Carlo in the header for 10–90% bands.
            </p>
          </div>
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={() => setShowAssumptions((v) => !v)}
          className="mb-3 rounded-md border border-line px-3 py-1 text-[12px] text-ink-soft hover:border-accent"
          aria-expanded={showAssumptions}
        >
          {showAssumptions ? 'Hide' : 'Show'} assumptions &amp; methods
        </button>
        {showAssumptions && <AssumptionsPanel />}
      </div>
    </div>
  )
}

export default function App() {
  const mode = useStore((s) => s.mode)
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
