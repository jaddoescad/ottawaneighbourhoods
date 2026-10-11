"use client";

import Link from "next/link";
import type { CategoryKey, ScoreWeights } from "@/data/neighbourhoods";
import { DEFAULT_WEIGHTS, normalizeWeights, scoringConfig, weightsEqual } from "@/lib/scoring";

interface WeightsPanelProps {
  weights: ScoreWeights;
  onChange: (weights: ScoreWeights) => void;
}

export default function WeightsPanel({ weights, onChange }: WeightsPanelProps) {
  const normalized = normalizeWeights(weights);
  const activePreset = scoringConfig.presets.find((p) => weightsEqual(p.weights, weights));

  const setCategory = (key: CategoryKey, percent: number) => {
    onChange({ ...weights, [key]: percent / 100 });
  };

  return (
    <div className="max-w-3xl mx-auto mt-3 bg-white border border-gray-200 rounded-xl p-4 text-left shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-700 mr-1">Presets</span>
        {scoringConfig.presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onChange({ ...preset.weights })}
            title={preset.description}
            className={`px-3 py-1 rounded-full text-sm border transition ${
              activePreset?.key === preset.key
                ? "bg-rose-500 border-rose-500 text-white"
                : "bg-white border-gray-300 text-gray-700 hover:border-rose-400"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {activePreset && <p className="text-xs text-gray-500 mt-2">{activePreset.description}</p>}

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-4">
        {scoringConfig.categories.map((category) => {
          const raw = Math.round((weights[category.key] ?? 0) * 100);
          const share = Math.round(normalized[category.key] * 100);
          return (
            <label key={category.key} className="block">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-800 font-medium" title={category.description}>
                  {category.label}
                </span>
                <span className="text-gray-500 tabular-nums">{share}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={raw}
                onChange={(e) => setCategory(category.key, Number(e.target.value))}
                className="w-full accent-rose-500"
                aria-label={`${category.label} weight`}
              />
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>Weights are rescaled to add up to 100%. Category scores don&apos;t change, only how they&apos;re combined.</span>
        <button
          onClick={() => onChange({ ...DEFAULT_WEIGHTS })}
          className="shrink-0 ml-3 text-rose-600 hover:underline font-medium"
        >
          Reset
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        <Link href="/methodology" className="hover:underline">
          What goes into each category
        </Link>
      </p>
    </div>
  );
}
