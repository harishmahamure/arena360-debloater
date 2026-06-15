import type { ResourceAction } from "../lib/types";

interface Props {
  selectedCount: number;
  loading?: boolean;
  onStop: () => void;
  onUninstall: () => void;
}

export function ResourceActionBar({ selectedCount, loading, onStop, onUninstall }: Props) {
  const disabled = loading || selectedCount === 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-slate-400">{selectedCount} selected</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onStop}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
      >
        Stop forever
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onUninstall}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
      >
        Uninstall
      </button>
    </div>
  );
}

export type { ResourceAction };
