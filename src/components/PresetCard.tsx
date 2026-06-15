import type { Preset } from "../lib/types";

interface Props {
  preset: Preset;
  onApply: (id: string) => void;
  loading?: boolean;
}

export function PresetCard({ preset, onApply, loading }: Props) {
  const { summary } = preset;
  const parts = [
    summary.apps > 0 && `${summary.apps} apps`,
    summary.services > 0 && `${summary.services} services`,
    summary.privacy > 0 && `${summary.privacy} privacy`,
    summary.ui > 0 && `${summary.ui} UI`,
    summary.cleanup > 0 && `${summary.cleanup} cleanup`,
    summary.windowsUpdate > 0 && `${summary.windowsUpdate} WU`,
    summary.tasks > 0 && `${summary.tasks} tasks`,
    summary.gaming > 0 && `${summary.gaming} gaming`,
    summary.performance > 0 && `${summary.performance} performance`,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{preset.name}</h3>
          <p className="mt-1 text-sm text-sky-300">For {preset.targetUser} users</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {summary.total} tweaks
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-400">{preset.description}</p>
      <p className="mt-3 text-xs text-slate-500">{parts.join(" · ")}</p>
      <button
        type="button"
        disabled={loading}
        onClick={() => onApply(preset.id)}
        className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
      >
        Apply preset
      </button>
    </div>
  );
}
