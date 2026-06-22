/**
 * Sensitivity view (spec §3.6, §5.5). Pick an output and a subset of parameters,
 * then see three complementary lenses: a tornado (one-at-a-time swings, computed
 * synchronously — it's light), and Sobol (variance-based S1/ST) plus PRCC
 * (monotonic rank correlation), both run in the Web Worker so the UI never freezes.
 */
import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { SensitivityBars } from '../components/SensitivityBars'
import { TornadoChart } from '../components/TornadoChart'
import { ChartSkeleton } from '../components/ChartSkeleton'
import { useWorkerTask } from '../workers/useWorkerTask'
import {
  tornado,
  modelOutput,
  OUTPUT_LABELS,
  LEVER_KEYS,
  PARAM_SPEC_BY_ID,
  type OutputName,
  type ParamKey,
} from '../engine'
import { regimeColors } from '../lib/theme'

const OUTPUT_OPTS = (Object.keys(OUTPUT_LABELS) as OutputName[]).map((k) => ({ value: k, label: OUTPUT_LABELS[k] }))
const labelOf = (k: string) => PARAM_SPEC_BY_ID[k as ParamKey]?.label ?? k

export function SensitivityView() {
  const params = useStore((s) => s.params)
  const init = useStore((s) => s.init)
  const settings = useStore((s) => s.settings)

  const [output, setOutput] = useState<OutputName>('finalFdoc')
  const [selected, setSelected] = useState<Set<ParamKey>>(() => new Set<ParamKey>(LEVER_KEYS))

  const keys = useMemo(() => LEVER_KEYS.filter((k) => selected.has(k)) as ParamKey[], [selected])
  const enough = keys.length >= 2

  const paramsKey = useMemo(() => JSON.stringify(params), [params])
  const initKey = useMemo(() => JSON.stringify(init), [init])
  const settingsKey = useMemo(() => JSON.stringify(settings), [settings])
  const keysKey = keys.join(',')

  const tornadoBars = useMemo(
    () => (enough ? tornado(params, keys, modelOutput(output, init, settings)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enough, keysKey, output, paramsKey, initKey, settingsKey],
  )

  const sobol = useWorkerTask(
    enough ? { op: 'sobol' as const, base: params, keys, output, init, settings, opts: { n: 200 } } : null,
    [keysKey, output, paramsKey, initKey, settingsKey],
  )
  const prcc = useWorkerTask(
    enough ? { op: 'prcc' as const, base: params, keys, output, init, settings, opts: { n: 300 } } : null,
    [keysKey, output, paramsKey, initKey, settingsKey],
  )

  const c = regimeColors()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-surface p-3">
        <label className="flex flex-col gap-1 text-[11px] text-muted">
          Output of interest
          <select
            value={output}
            onChange={(e) => setOutput(e.target.value as OutputName)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-[12px] text-ink"
          >
            {OUTPUT_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <legend className="mb-1 text-[11px] text-muted">Parameters (≥ 2)</legend>
          {LEVER_KEYS.map((k) => (
            <label key={k} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
              <input
                type="checkbox"
                checked={selected.has(k)}
                onChange={(e) =>
                  setSelected((prev) => {
                    const next = new Set(prev)
                    if (e.target.checked) next.add(k)
                    else next.delete(k)
                    return next
                  })
                }
              />
              {labelOf(k)}
            </label>
          ))}
        </fieldset>
      </div>

      {!enough && (
        <div role="status" className="rounded-md border border-line bg-surface p-4 text-[12px] text-muted">
          Select at least two parameters to run a sensitivity analysis.
        </div>
      )}

      {enough && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Tornado — one-at-a-time swings">
            <TornadoChart bars={tornadoBars} labelOf={labelOf} outputLabel={OUTPUT_LABELS[output]} />
          </Panel>

          <Panel title="Sobol indices — variance decomposition">
            {sobol.error ? (
              <ErrorBox msg={sobol.error} />
            ) : sobol.result ? (
              <SensitivityBars
                labels={sobol.result.keys.map(labelOf)}
                series={[
                  { name: 'S1 (first-order)', values: sobol.result.S1, color: c.learning },
                  { name: 'ST (total-effect)', values: sobol.result.ST, color: c.accent },
                ]}
                yTitle="Sobol index"
                ariaLabel={`Sobol first-order and total-effect indices for ${OUTPUT_LABELS[output]}.`}
              />
            ) : (
              <ChartSkeleton label="Running Sobol (Saltelli sampling)…" />
            )}
          </Panel>

          <Panel title="PRCC — partial rank correlation">
            {prcc.error ? (
              <ErrorBox msg={prcc.error} />
            ) : prcc.result ? (
              <SensitivityBars
                labels={prcc.result.keys.map(labelOf)}
                series={[{ name: 'PRCC', values: prcc.result.prcc, color: c.estimate }]}
                yTitle="Partial rank correlation"
                range={[-1, 1]}
                ariaLabel={`Partial rank correlation coefficients for ${OUTPUT_LABELS[output]}.`}
              />
            ) : (
              <ChartSkeleton label="Running PRCC (Latin-hypercube)…" />
            )}
          </Panel>

          <Panel title="How to read this">
            <div className="space-y-2 p-1 text-[12px] leading-relaxed text-ink-soft">
              <p className="m-0">
                <strong>Tornado</strong> shows raw impact: how far the output moves when each lever is pushed from its
                minimum to its maximum, one at a time.
              </p>
              <p className="m-0">
                <strong>Sobol</strong> apportions output variance: S1 is a lever's effect alone; ST includes its
                interactions. A large ST − S1 gap means the lever matters mostly in combination with others.
              </p>
              <p className="m-0">
                <strong>PRCC</strong> captures direction and monotonic strength (−1…+1): positive means raising the
                lever raises the output.
              </p>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h3 className="m-0 mb-2 text-[13px] font-semibold text-ink">{title}</h3>
      {children}
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="rounded-md border border-chilling/40 bg-chilling-soft p-3 text-[12px] text-chilling">
      Analysis failed: {msg}
    </div>
  )
}
