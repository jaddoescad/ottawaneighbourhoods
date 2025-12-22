"use client";

import { useState } from "react";

interface HospitalStatRowProps {
  nearestHospital: string | null;
  nearestHospitalAddress: string | null;
  distanceKm: number | null;
}

// Distance thresholds (km)
// Great: <= 3km (very close, ~5 min drive)
// Good: <= 5km (close, ~10 min drive)
// Okay: <= 8km (medium, ~15 min drive)
// Bad: > 8km (far, 15+ min drive)

function getDistanceColor(distanceKm: number | null): string {
  if (distanceKm === null) return "bg-gray-300";
  if (distanceKm <= 3) return "bg-green-500";
  if (distanceKm <= 5) return "bg-green-400";
  if (distanceKm <= 8) return "bg-yellow-400";
  return "bg-orange-500";
}

function getDistanceLabel(distanceKm: number | null): string {
  if (distanceKm === null) return "N/A";
  if (distanceKm <= 3) return "Very Close";
  if (distanceKm <= 5) return "Close";
  if (distanceKm <= 8) return "Medium";
  return "Far";
}

function getDistanceType(distanceKm: number | null): "great" | "good" | "okay" | "bad" | "neutral" {
  if (distanceKm === null) return "neutral";
  if (distanceKm <= 3) return "great";
  if (distanceKm <= 5) return "good";
  if (distanceKm <= 8) return "okay";
  return "bad";
}

// Ottawa hospitals data for reference
const OTTAWA_HOSPITALS = [
  { name: "Ottawa Hospital - Civic Campus", address: "1053 Carling Avenue", type: "Major Trauma Centre" },
  { name: "Ottawa Hospital - General Campus", address: "501 Smyth Road", type: "Major Hospital" },
  { name: "Ottawa Hospital - Riverside Campus", address: "1967 Riverside Drive", type: "Hospital" },
  { name: "Queensway-Carleton Hospital", address: "3045 Baseline Road", type: "Community Hospital" },
  { name: "Montfort Hospital", address: "713 Montreal Road", type: "Community Hospital" },
  { name: "Children's Hospital of Eastern Ontario", address: "401 Smyth Road", type: "Pediatric Hospital" },
  { name: "Royal Ottawa Hospital", address: "1145 Carling Avenue", type: "Mental Health" },
  { name: "Elizabeth Bruyere Hospital", address: "43 Bruyere Street", type: "Continuing Care" },
  { name: "Saint Vincent Hospital", address: "60 Cambridge Street North", type: "Long-term Care" },
  { name: "Rehabilitation Centre", address: "505 Smyth Road", type: "Rehabilitation" },
];

export default function HospitalStatRow({
  nearestHospital,
  nearestHospitalAddress,
  distanceKm,
}: HospitalStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Bar width (inverse - closer = fuller bar)
  const maxDistance = 25;
  const barWidth = distanceKm !== null
    ? Math.max(10, 100 - (distanceKm / maxDistance) * 100)
    : 0;

  const formattedDistance = distanceKm !== null ? `${distanceKm} km` : "N/A";
  const hasData = nearestHospital !== null;

  // Find hospital info
  const hospitalInfo = OTTAWA_HOSPITALS.find(h =>
    nearestHospital && h.name.toLowerCase().includes(nearestHospital.toLowerCase().split(' - ')[0].replace('ottawa hospital', '').trim())
  ) || OTTAWA_HOSPITALS.find(h =>
    nearestHospital && nearestHospital.toLowerCase().includes(h.name.toLowerCase().split(' - ')[0])
  );

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        {/* Mobile: stacked layout, Desktop: horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🏥</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Hospital</span>
            </div>
            {/* Value and chevron shown inline on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{formattedDistance}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {/* Bar - reflects proximity (closer = fuller bar) */}
          <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${getDistanceColor(distanceKm)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getDistanceLabel(distanceKm)}
            </span>
          </div>
          {/* Value - hidden on mobile, shown on desktop */}
          <span className="hidden sm:block text-gray-900 font-bold w-28 text-right">{formattedDistance}</span>
          <div className="hidden sm:block w-5 h-5">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          {hasData ? (
            <>
              {/* Nearest Hospital Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🏥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{nearestHospital}</div>
                    {nearestHospitalAddress && (
                      <div className="text-sm text-gray-600 mt-0.5">{nearestHospitalAddress}</div>
                    )}
                    {hospitalInfo && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {hospitalInfo.type}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-bold ${getDistanceType(distanceKm) === 'great' || getDistanceType(distanceKm) === 'good' ? 'text-green-600' : getDistanceType(distanceKm) === 'okay' ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {formattedDistance}
                    </div>
                    <div className="text-xs text-gray-500">away</div>
                  </div>
                </div>
              </div>

              {/* Distance Context */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Drive Time</div>
                  <div className="text-lg font-bold text-gray-900">
                    ~{distanceKm !== null ? Math.round(distanceKm * 2) : '?'} min
                  </div>
                  <div className="text-xs text-gray-500">estimated</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Proximity</div>
                  <div className={`text-lg font-bold ${getDistanceType(distanceKm) === 'great' || getDistanceType(distanceKm) === 'good' ? 'text-green-600' : getDistanceType(distanceKm) === 'okay' ? 'text-yellow-600' : 'text-orange-600'}`}>
                    {getDistanceLabel(distanceKm)}
                  </div>
                </div>
              </div>

              {/* Distance Scale */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Distance Scale</div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-2 rounded-full bg-green-500" title="0-3 km: Very Close"></div>
                  <div className="flex-1 h-2 rounded-full bg-green-400" title="3-5 km: Close"></div>
                  <div className="flex-1 h-2 rounded-full bg-yellow-400" title="5-8 km: Medium"></div>
                  <div className="flex-1 h-2 rounded-full bg-orange-500" title="8+ km: Far"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 km</span>
                  <span>3 km</span>
                  <span>5 km</span>
                  <span>8 km</span>
                  <span>12+ km</span>
                </div>
                {/* Marker for current distance */}
                {distanceKm !== null && (
                  <div className="relative mt-2">
                    <div
                      className="absolute -top-1 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-gray-800"
                      style={{ left: `${Math.min((distanceKm / 12) * 100, 100)}%`, transform: 'translateX(-50%)' }}
                    />
                  </div>
                )}
              </div>

              {/* Ottawa Hospitals Info */}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  Ottawa Major Hospitals
                </div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                    <span><strong>Ottawa Hospital</strong> - Civic, General, Riverside campuses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                    <span><strong>Queensway-Carleton</strong> - West end community hospital</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                    <span><strong>Montfort</strong> - East end, bilingual services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                    <span><strong>CHEO</strong> - Children&apos;s hospital</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hospital data available for this neighbourhood.
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Source:</span>
              <a
                href="https://open.ottawa.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                City of Ottawa Open Data
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
