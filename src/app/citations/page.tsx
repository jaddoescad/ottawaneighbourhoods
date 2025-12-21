import { Metadata } from "next";
import Link from "next/link";
import { neighbourhoods } from "@/data/neighbourhoods";

export const metadata: Metadata = {
  title: "Data Citations | OttawaHoods",
  description: "Population data sources and citations for all Ottawa ONS (Ottawa Neighbourhood Study) zones used in OttawaHoods.",
};

// Get all unique ONS zones from all neighbourhoods
function getAllOnsZones() {
  const zones: {
    onsId: number | string;
    name: string;
    population: number;
    dataYear: string;
    source: string;
    sourceUrl: string;
    neighbourhoodId: string;
    neighbourhoodName: string;
  }[] = [];

  for (const neighbourhood of neighbourhoods) {
    for (const boundary of neighbourhood.boundaries) {
      zones.push({
        onsId: boundary.onsId,
        name: boundary.name,
        population: boundary.population,
        dataYear: boundary.dataYear,
        source: boundary.source,
        sourceUrl: boundary.sourceUrl,
        neighbourhoodId: neighbourhood.id,
        neighbourhoodName: neighbourhood.name,
      });
    }
  }

  // Sort by ONS ID
  return zones.sort((a, b) => {
    const idA = typeof a.onsId === "number" ? a.onsId : parseInt(String(a.onsId)) || 0;
    const idB = typeof b.onsId === "number" ? b.onsId : parseInt(String(b.onsId)) || 0;
    return idA - idB;
  });
}

export default function CitationsPage() {
  const onsZones = getAllOnsZones();
  const totalPopulation = onsZones.reduce((sum, zone) => sum + zone.population, 0);

  // Count data years
  const dataYearCounts: Record<string, number> = {};
  for (const zone of onsZones) {
    dataYearCounts[zone.dataYear] = (dataYearCounts[zone.dataYear] || 0) + 1;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Neighbourhoods
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Population Data Citations</h1>
          <p className="text-gray-600 mt-2">
            This page documents the data sources for population figures used throughout OttawaHoods.
            Population data is organized by ONS (Ottawa Neighbourhood Study) zones.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Total ONS Zones</div>
            <div className="text-2xl font-bold text-gray-900">{onsZones.length}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Combined Population</div>
            <div className="text-2xl font-bold text-gray-900">{totalPopulation.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Data Sources</div>
            <div className="text-sm mt-1">
              {Object.entries(dataYearCounts).map(([year, count]) => (
                <span key={year} className="inline-block mr-2">
                  <span className="font-medium">{year}:</span> {count} zones
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Methodology Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">Data Methodology</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>2021 Census Data:</strong> Where available, we use Statistics Canada 2021 Census
              population figures for Ottawa neighbourhoods and population centres.
            </li>
            <li>
              <strong>POPEST (2011 Estimates):</strong> For zones without updated census data, we use
              the City of Ottawa&apos;s POPEST field from their Open Data API, which reflects ~2011 estimates.
              These are marked as &quot;needs 2021 update&quot;.
            </li>
            <li>
              <strong>Aggregation:</strong> Neighbourhood population totals are calculated by summing
              the populations of their constituent ONS zones.
            </li>
          </ul>
        </div>

        {/* ONS Zones Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">ONS Zone Population Data</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ONS ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ONS Zone Name</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Population</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Year</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Neighbourhood</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {onsZones.map((zone) => (
                  <tr key={`${zone.onsId}-${zone.neighbourhoodId}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-600">{zone.onsId}</td>
                    <td className="px-4 py-3 text-gray-900">{zone.name}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {zone.population.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        zone.dataYear === "2021"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {zone.dataYear}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/neighbourhood/${zone.neighbourhoodId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {zone.neighbourhoodName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {zone.sourceUrl ? (
                        <a
                          href={zone.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          {zone.source}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-gray-500">{zone.source}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Data Sources */}
        <div className="mt-8 bg-white rounded-lg border p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Primary Data Sources</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-gray-400">1.</span>
              <div>
                <a
                  href="https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Statistics Canada 2021 Census Profile
                </a>
                <span className="text-gray-500"> - Official census population data</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">2.</span>
              <div>
                <a
                  href="https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  City of Ottawa Open Data - Neighbourhoods API
                </a>
                <span className="text-gray-500"> - ONS zone boundaries and POPEST estimates</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">3.</span>
              <div>
                <a
                  href="https://www.neighbourhoodstudy.ca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ottawa Neighbourhood Study (ONS)
                </a>
                <span className="text-gray-500"> - Neighbourhood boundary definitions</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Data last updated: December 2024 |
            <a href="mailto:contact@ottawahoods.com" className="text-blue-600 hover:underline ml-1">
              Report data issues
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
