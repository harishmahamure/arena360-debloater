import type { RiskLevel } from "../lib/types";

const styles: Record<RiskLevel, string> = {
  safe: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  moderate: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  advanced: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[risk]}`}
    >
      {risk}
    </span>
  );
}
