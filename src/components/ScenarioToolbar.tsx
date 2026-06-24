/**
 * Header scenario toolbar (spec §5.6): inline-editable name, save / load / duplicate
 * to localStorage, a shareable-URL button (lz-string hash), and CSV/PNG/PDF/JSON
 * export. Mode-independent — a scenario is a scenario in either presentation mode.
 * PNG/PDF grab the visible chart via the chart registry; if none is mounted they
 * fail gracefully with a hint.
 */
import { useRef, useState } from 'react'
import { useStore } from '../state/store'
import {
  saveScenario,
  listScenarios,
  loadScenarioRecord,
  duplicateScenario,
  isModelVersionStale,
  exportScenarioFile,
  importScenarioFile,
} from '../lib/persistence'
import { encodeScenarioToHash } from '../lib/share'
import {
  exportCSV,
  exportLabChecklist,
  exportPNG,
  exportPDF,
  exportPlaybookBrief,
  exportPresetComparison,
  type ExportContext,
} from '../lib/export'
import { getPrimaryGd } from '../lib/chartRegistry'
import { MODEL_VERSION } from '../engine'
import type { Scenario } from '../engine'

const btn = 'rounded-md border border-line px-2.5 py-1 text-[12px] text-ink-soft hover:border-accent disabled:opacity-50'

export function ScenarioToolbar() {
  const params = useStore((s) => s.params)
  const init = useStore((s) => s.init)
  const settings = useStore((s) => s.settings)
  const scenarioName = useStore((s) => s.scenarioName)
  const annotations = useStore((s) => s.annotations)
  const activePresetId = useStore((s) => s.activePresetId)
  const trajectory = useStore((s) => s.trajectory)
  const summary = useStore((s) => s.summary)
  const setScenarioName = useStore((s) => s.setScenarioName)
  const loadScenario = useStore((s) => s.loadScenario)

  const [savedId, setSavedId] = useState<string | null>(null)
  const [listVersion, setListVersion] = useState(0)
  const [stale, setStale] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const saved = listScenarios() // cheap (localStorage); listVersion forces refresh
  void listVersion

  const flash = (msg: string) => {
    setNote(msg)
    setTimeout(() => setNote(null), 1800)
  }

  const ctx = (): ExportContext => ({ params, init, settings, trajectory, summary, scenarioName, presetId: activePresetId })

  const asScenario = (): Scenario => ({
    id: savedId ?? 'working',
    name: scenarioName,
    description: '',
    presetId: activePresetId,
    params,
    init,
    settings,
    annotations,
    createdAt: null,
    updatedAt: null,
  })

  const onSave = () => {
    const sc = saveScenario({
      id: savedId ?? undefined,
      name: scenarioName || 'Untitled scenario',
      params,
      init,
      settings,
      presetId: activePresetId,
      annotations,
    })
    setSavedId(sc.id)
    setStale(false)
    setListVersion((v) => v + 1)
    flash('Saved')
  }

  const onLoad = (id: string) => {
    if (!id) return
    const rec = loadScenarioRecord(id)
    if (!rec) return
    const sc = rec.scenario
    loadScenario({ params: sc.params, init: sc.init, settings: sc.settings, presetId: sc.presetId, name: sc.name, annotations: sc.annotations })
    setSavedId(id)
    setStale(isModelVersionStale(rec))
  }

  const onDuplicate = () => {
    let baseId = savedId
    if (!baseId) baseId = saveScenario({ name: scenarioName || 'Untitled', params, init, settings, presetId: activePresetId, annotations }).id
    const dup = duplicateScenario(baseId)
    if (dup) {
      loadScenario({ params: dup.params, init: dup.init, settings: dup.settings, presetId: dup.presetId, name: dup.name, annotations: dup.annotations })
      setSavedId(dup.id)
      setListVersion((v) => v + 1)
      flash('Duplicated')
    }
  }

  const onShare = async () => {
    const hash = encodeScenarioToHash(asScenario())
    const url = `${location.origin}${location.pathname}${hash}`
    try {
      await navigator.clipboard.writeText(url)
      flash('Share link copied')
    } catch {
      history.replaceState(null, '', hash)
      flash('Link in address bar')
    }
  }

  const onExport = async (kind: 'csv' | 'png' | 'pdf' | 'json' | 'playbook' | 'presetComparison' | 'labChecklist') => {
    setMenuOpen(false)
    try {
      if (kind === 'csv') return exportCSV(ctx())
      if (kind === 'playbook') return exportPlaybookBrief(ctx())
      if (kind === 'presetComparison') return exportPresetComparison(ctx())
      if (kind === 'labChecklist') return exportLabChecklist(ctx())
      if (kind === 'json') return exportScenarioFile(asScenario())
      const gd = getPrimaryGd()
      if (!gd) return flash('Open a chart view first')
      if (kind === 'png') await exportPNG(gd, ctx())
      else await exportPDF(gd, ctx())
    } catch {
      flash('Export failed')
    }
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const sc = await importScenarioFile(file)
      loadScenario({ params: sc.params, init: sc.init, settings: sc.settings, presetId: sc.presetId, name: sc.name, annotations: sc.annotations })
      setSavedId(null)
      flash('Imported')
    } catch {
      flash('Invalid file')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        aria-label="Scenario name"
        value={scenarioName}
        onChange={(e) => setScenarioName(e.target.value)}
        className="w-36 rounded-md border border-line bg-surface px-2 py-1 text-[12px] text-ink"
      />
      {stale && (
        <span title={`Saved under an older model than ${MODEL_VERSION}`} className="rounded bg-estimate-soft px-1.5 py-0.5 text-[10px] font-medium text-estimate">
          old model
        </span>
      )}
      <button type="button" className={btn} onClick={onSave}>
        Save
      </button>
      <select
        aria-label="Load scenario"
        value=""
        onChange={(e) => onLoad(e.target.value)}
        className="rounded-md border border-line bg-surface px-1.5 py-1 text-[12px] text-ink-soft"
      >
        <option value="">Load…</option>
        {saved.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button type="button" className={btn} onClick={onDuplicate}>
        Duplicate
      </button>
      <button type="button" className={btn} onClick={onShare}>
        Share
      </button>

      <div className="relative">
        <button type="button" className={btn} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          Export ▾
        </button>
        {menuOpen && (
          <>
            <button type="button" aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
            <div role="menu" className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-line bg-surface py-1 shadow-lg">
              {(['playbook', 'presetComparison', 'labChecklist', 'csv', 'png', 'pdf', 'json'] as const).map((k) => (
                <button
                  key={k}
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-[12px] text-ink-soft hover:bg-accent-soft hover:text-accent"
                  onClick={() => onExport(k)}
                >
                  {k === 'json'
                    ? 'Scenario JSON'
                    : k === 'playbook'
                      ? 'Playbook brief'
                      : k === 'presetComparison'
                        ? 'Preset comparison'
                        : k === 'labChecklist'
                          ? 'Lab checklist'
                          : k.toUpperCase()}
                </button>
              ))}
              <button
                role="menuitem"
                className="block w-full px-3 py-1.5 text-left text-[12px] text-ink-soft hover:bg-accent-soft hover:text-accent"
                onClick={() => {
                  setMenuOpen(false)
                  fileRef.current?.click()
                }}
              >
                Import JSON…
              </button>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onImportFile(e.target.files?.[0])}
      />

      {note && <span className="text-[11px] text-accent">{note}</span>}
    </div>
  )
}
