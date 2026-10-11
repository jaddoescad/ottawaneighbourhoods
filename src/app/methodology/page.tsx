import type { Metadata } from "next";
import Link from "next/link";
import { formatMetricValue, scoringConfig, type MetricConfig } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "How Neighbourhood Scores Work | OttawaHoods",
  description:
    "The data, formulas and weights behind OttawaHoods neighbourhood scores and rankings: safety, schools, amenities, getting around, nature, affordability and health.",
};

const pct = (v: number) => `${Math.round(v * 100)}%`;

function Breakpoints({ metric }: { metric: MetricConfig }) {
  const points = [...metric.breakpoints].sort((a, b) => a[0] - b[0]);
  return (
    <div className="flex flex-wrap gap-1">
      {points.map(([value, score]) => (
        <span key={value} className="text-[11px] bg-gray-100 text-gray-700 rounded px-1.5 py-0.5 tabular-nums whitespace-nowrap">
          {formatMetricValue(value, metric.format)} → {score}
        </span>
      ))}
    </div>
  );
}

const limitations = [
  "Statistics Canada's dissemination-block files were unavailable, so resident locations come from City of Ottawa municipal address points on residential, mixed-use and rural zoning. Each neighbourhood's 2021 Census population is spread across its address points.",
  "Distances are straight-line, not along streets or paths.",
  "Collision data covers 2022 and 2024; the City has not published 2023.",
  "Crime is police-reported incidents (2023–24). Unreported crime is not captured, and location precision varies.",
  "EQAO results reflect family income as well as school quality, and catchment boundaries are approximated by the nearest school of each English board.",
  "Primary-care access uses clinics mapped in OpenStreetMap, which is incomplete. It carries a small weight until neighbourhood attachment rates are published.",
  "Rent and home values are 2021 Census medians scaled by one citywide factor, so they rank neighbourhoods consistently but are not current asking prices.",
];

export default function MethodologyPage() {
  const totalWeight = scoringConfig.categories.reduce((s, c) => s + c.weight, 0);
  const maxWeight = Math.max(...scoringConfig.categories.map((c) => c.weight));
  const { parameters } = scoringConfig;
  const [pLo, pHi] = parameters.rankRangePercentiles;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 px-4 py-2">
            <span className="text-lg font-bold text-white">OttawaHoods</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-rose-600 hover:underline">
            See the rankings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">Methodology</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">How neighbourhood scores work</h1>
          <p className="mt-4 text-gray-600 leading-7">{scoringConfig.summary}</p>
          <p className="mt-2 text-xs text-gray-400">
            Scoring model v{scoringConfig.version}, updated {scoringConfig.updated}. Every number on this page is read from the
            same configuration file the data pipeline uses.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Overall score</h2>
          <p className="mt-2 text-sm text-gray-600">
            The overall score is the weighted average of seven category scores. On the home page you can change these weights or
            pick a preset; category scores stay the same, only how they are combined changes.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {scoringConfig.categories.map((c) => (
              <a key={c.key} href={`#${c.key}`} className="flex items-center gap-3 group">
                <span className="w-12 text-right font-semibold tabular-nums text-gray-900">{pct(c.weight / totalWeight)}</span>
                <span className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <span className="block h-full bg-rose-500" style={{ width: pct(c.weight / maxWeight) }} />
                </span>
                <span className="w-40 text-sm text-gray-700 group-hover:text-rose-600">{c.label}</span>
              </a>
            ))}
          </div>
        </section>

        {scoringConfig.categories.map((category) => {
          const metricTotal = category.metrics.reduce((s, m) => s + m.weight, 0);
          return (
            <section key={category.key} id={category.key} className="rounded-2xl border border-gray-200 bg-white p-6 scroll-mt-20">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">{category.label}</h2>
                <span className="text-sm text-gray-500">{pct(category.weight / totalWeight)} of overall</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{category.description}</p>
              <div className="mt-4 divide-y divide-gray-100">
                {category.metrics.map((m) => (
                  <div key={m.key} className="py-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-medium text-gray-900">
                        {m.label}{" "}
                        <span className="text-xs font-normal text-gray-500">
                          · {pct(m.weight / metricTotal)} of {category.label} · {m.unit}, {m.direction} is better
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{m.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Source: {m.source}</p>
                    </div>
                    <div className="sm:max-w-[16rem]">
                      <Breakpoints metric={m} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Turning values into scores</h2>
          <p className="text-sm text-gray-600">
            Each metric is mapped to 0–100 with fixed breakpoints (shown beside each metric) and straight lines between them.
            Values beyond the first or last breakpoint get that breakpoint&apos;s score. Because the breakpoints are fixed, a
            neighbourhood&apos;s score only changes when its own data changes.
          </p>
          <p className="text-sm text-gray-600">
            Counts of rare events (crime, collisions, overdoses) are noisy in small neighbourhoods. Rates are shrunk toward the
            city rate by adding {Number(parameters.shrinkagePersonYears).toLocaleString()} person-years (or{" "}
            {String(parameters.shrinkageRoadKmYears)} road-km-years for collisions) at the city average. This pulls small
            neighbourhoods toward the middle in both directions; large neighbourhoods barely move.
          </p>
          <p className="text-sm text-gray-600">
            Missing data is never treated as zero. A category&apos;s score is the weighted average of the metrics that have data;
            if less than {pct(parameters.minCategoryCoverage)} of its weight has data, the category is left out of the overall
            score and the neighbourhood is flagged.
          </p>
          <p className="text-sm text-gray-600">Score labels:{" "}
            {scoringConfig.scoreLabels.map((l, i) => (
              <span key={l.label}>
                {l.label} ({l.min}+){i < scoringConfig.scoreLabels.length - 1 ? ", " : "."}
              </span>
            ))}{" "}
            The thresholds are set so a label never contradicts a neighbourhood&apos;s tier (no &ldquo;Very good&rdquo; in the
            bottom half).
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Rankings</h2>
          <p className="text-sm text-gray-600">
            Neighbourhoods with the same rounded score share a rank. Because reasonable people weigh categories differently, each
            neighbourhood also shows a likely rank range: the overall score is recomputed {String(parameters.rankSimulations)} times
            with every category weight multiplied by a random factor between {1 - parameters.rankWeightJitter} and{" "}
            {1 + parameters.rankWeightJitter}, and the range covers the {Math.round(pLo * 100)}th to {Math.round(pHi * 100)}th
            percentile of the resulting ranks.
          </p>
          <p className="text-sm text-gray-600">
            Tiers: {scoringConfig.tiers.map((t) => t.label).join(", ")}. A narrow range means the rank holds up under different
            weightings; a wide one means it depends on what you value.
          </p>
          <div className="text-sm text-gray-600">
            Presets on the home page:
            <ul className="mt-1 list-disc pl-5 space-y-0.5">
              {scoringConfig.presets.map((p) => (
                <li key={p.key}>
                  <span className="font-medium text-gray-800">{p.label}</span>: {p.description}{" "}
                  <span className="text-gray-400">
                    (
                    {scoringConfig.categories
                      .filter((c) => p.weights[c.key] > 0)
                      .map((c) => `${c.label} ${pct(p.weights[c.key])}`)
                      .join(", ")}
                    )
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Shown but not scored</h2>
          <p className="mt-1 text-sm text-gray-600">
            These appear in each neighbourhood&apos;s breakdown for context but do not affect scores.
          </p>
          <dl className="mt-3 divide-y divide-gray-100">
            {scoringConfig.context.map((c) => (
              <div key={c.key} className="py-2 grid sm:grid-cols-[14rem_1fr] gap-1">
                <dt className="text-sm font-medium text-gray-800">{c.label}</dt>
                <dd className="text-sm text-gray-600">{c.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Known limitations</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm text-gray-600">
            {limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
