import { useEffect } from "react";
import { PresetCard } from "../components/PresetCard";
import { useDebloatStore } from "../stores/debloatStore";

export function PresetsPage() {
  const { presets, applyPresetById, loadPresets, loading } = useDebloatStore();

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Preset Profiles</h2>
        <p className="text-sm text-slate-400">
          One-click debloat bundles. A restore point is created before each preset runs.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onApply={applyPresetById}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
