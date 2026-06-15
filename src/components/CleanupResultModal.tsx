import type { CleanupSummary } from "../lib/types";

interface Props {
  summary: CleanupSummary | null;
  onDismiss: () => void;
}

export function CleanupResultModal({ summary, onDismiss }: Props) {
  if (!summary) return null;

  const { result, items, benefits, title } = summary;
  const succeeded = items.filter((i) => i.success);
  const failed = items.filter((i) => !i.success);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {result.successCount} succeeded
              {result.failureCount > 0 ? ` · ${result.failureCount} failed` : ""}
              {result.requiresReboot ? " · reboot recommended" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        </div>

        {benefits.length > 0 && (
          <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <h4 className="text-sm font-semibold text-emerald-200">What you gain</h4>
            <ul className="mt-2 space-y-1.5">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2 text-sm text-emerald-100/90">
                  <span className="text-emerald-400">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {succeeded.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-300">
              {summary.kind === "resources" ? "What was stopped / removed" : "What changed"}
            </h4>
            <ul className="mt-2 space-y-2">
              {succeeded.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-100">{item.name}</span>
                    <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      {item.action}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400">{item.benefit}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {failed.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-rose-300">Could not complete</h4>
            <ul className="mt-2 space-y-2">
              {failed.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm"
                >
                  <div className="font-medium text-rose-200">{item.name}</div>
                  {item.detail && <p className="mt-1 text-rose-300/80">{item.detail}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
