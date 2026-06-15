import type { Tweak, TweakStatus } from "../lib/types";
import { RiskBadge } from "./RiskBadge";

interface Props {
  tweaks: Tweak[];
  statuses?: TweakStatus[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  groupByRisk?: boolean;
}

export function TweakChecklist({
  tweaks,
  statuses = [],
  selectedIds,
  onToggle,
  groupByRisk = false,
}: Props) {
  const statusMap = new Map(statuses.map((s) => [s.id, s]));

  const renderItem = (tweak: Tweak) => {
    const status = statusMap.get(tweak.id);
    const checked = selectedIds.has(tweak.id);
    const alreadyApplied = status?.applied;

    return (
      <label
        key={tweak.id}
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
          alreadyApplied
            ? "border-slate-700/50 bg-slate-900/30 opacity-60"
            : "border-slate-700 bg-slate-900/60 hover:border-sky-500/40"
        }`}
      >
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-sky-500"
          checked={checked}
          disabled={alreadyApplied}
          onChange={() => onToggle(tweak.id)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-100">{tweak.name}</span>
            <RiskBadge risk={tweak.risk} />
            {alreadyApplied && (
              <span className="text-xs text-emerald-400">Already applied</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">{tweak.description}</p>
          {tweak.warning && (
            <p className="mt-2 text-xs text-amber-300">Warning: {tweak.warning}</p>
          )}
        </div>
      </label>
    );
  };

  if (!groupByRisk) {
    return <div className="space-y-3">{tweaks.map(renderItem)}</div>;
  }

  const groups: Record<string, Tweak[]> = { safe: [], moderate: [], advanced: [] };
  for (const tweak of tweaks) groups[tweak.risk].push(tweak);

  return (
    <div className="space-y-6">
      {(["safe", "moderate", "advanced"] as const).map((risk) =>
        groups[risk].length > 0 ? (
          <section key={risk}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {risk} risk
            </h3>
            <div className="space-y-3">{groups[risk].map(renderItem)}</div>
          </section>
        ) : null,
      )}
    </div>
  );
}
