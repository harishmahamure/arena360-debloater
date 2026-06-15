import type { DashboardDetailView } from "../lib/dashboardDetails";
import type { TabId } from "../lib/types";

interface Props {
  detail: DashboardDetailView | null;
  onClose: () => void;
  onNavigate?: (tab: TabId) => void;
}

export function DashboardDetailPanel({ detail, onClose, onNavigate }: Props) {
  if (!detail) return null;

  return (
    <div className="rounded-xl border border-sky-500/30 bg-slate-900/90">
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{detail.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{detail.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-400 hover:text-slate-200"
        >
          Close
        </button>
      </div>

      <div className="max-h-80 overflow-auto p-4">
        {detail.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{detail.emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {detail.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-800/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-100">{item.title}</p>
                  {item.subtitle && (
                    <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
                  )}
                </div>
                {item.metric && (
                  <span className="shrink-0 rounded-full bg-slate-700/80 px-2.5 py-0.5 text-xs font-medium text-sky-200">
                    {item.metric}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {detail.actionLabel && detail.actionTab && onNavigate && (
        <div className="border-t border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={() => onNavigate(detail.actionTab!)}
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            {detail.actionLabel} →
          </button>
        </div>
      )}
    </div>
  );
}
