import Link from "next/link";
import { neighbourhoods } from "@/data/neighbourhoods";

const topNeighbourhoods = [...neighbourhoods]
  .sort((a, b) => b.overallScore - a.overallScore)
  .slice(0, 6)
  .map(({ id, name }) => ({ id, name }));

const rankingLinks = [
  { href: "/most-affordable", label: "Most Affordable" },
  { href: "/dangerous-neighbourhoods", label: "Most Dangerous" },
  { href: "/most-walkable", label: "Most Walkable" },
  { href: "/safest-neighbourhoods", label: "Safest Neighbourhoods" },
  { href: "/best-schools", label: "Best Schools" },
  { href: "/best-transit", label: "Best Transit" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_1fr]">
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 px-4 py-2"
            >
              <span className="text-lg font-bold text-white">OttawaHoods</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Compare Ottawa neighbourhoods with real data on schools, rent,
              safety, walkability, transit, parks, and more.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Contact Sabrina
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Top Neighbourhoods
            </h2>
            <ul className="mt-4 space-y-3">
              {topNeighbourhoods.map((neighbourhood) => (
                <li key={neighbourhood.id}>
                  <Link
                    href={`/neighbourhood/${neighbourhood.id}`}
                    className="text-sm text-slate-700 transition hover:text-rose-600"
                  >
                    {neighbourhood.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Popular Lists
            </h2>
            <ul className="mt-4 space-y-3">
              {rankingLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-700 transition hover:text-rose-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          OttawaHoods {new Date().getFullYear()}.
        </div>
      </div>
    </footer>
  );
}
