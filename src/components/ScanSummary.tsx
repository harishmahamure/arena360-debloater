import type { ScanReport } from "../lib/types";

interface Props {
  report: ScanReport;
  highUsageCount?: number;
  onViewBackgroundUsage?: () => void;
}

export function ScanSummary({ report, highUsageCount, onViewBackgroundUsage }: Props) {
  const cards = [
    { label: "Bloat apps", value: report.bloatAppCount, sub: `${report.bloatAppSizeMb.toFixed(0)} MB` },
    { label: "Unnecessary services", value: report.unnecessaryServiceCount },
    { label: "Telemetry", value: report.telemetryEnabled ? "On" : "Off" },
    { label: "Reclaimable space", value: `${report.reclaimableSpaceMb.toFixed(0)} MB` },
    { label: "Debloat score", value: `${report.debloatScore}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-700 bg-slate-900/70 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{card.value}</p>
            {card.sub && <p className="text-xs text-slate-400">{card.sub}</p>}
          </div>
        ))}
      </div>
      {highUsageCount !== undefined && (
        <button
          type="button"
          onClick={onViewBackgroundUsage}
          className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left transition hover:border-amber-500/50"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-300/80">
              High-usage background items
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-100">{highUsageCount}</p>
          </div>
          <span className="text-sm text-amber-200">View in Background Usage →</span>
        </button>
      )}
    </div>
  );
}
