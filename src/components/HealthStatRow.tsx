"use client";

import { useState } from "react";

interface HealthStatRowProps {
  // Hospital access
  nearestHospital: string | null;
  distanceToHospital: number | null;
  // Overdose data
  overdoseRatePer100k: number | null;
  // NEI Score (includes health domain)
  neiScore: number | null;
  // OCHPP Health indicators
  primaryCareAccess: number | null;
  diabetesPrevalence: number | null;
  asthmaPrevalence: number | null;
  copdPrevalence: number | null;
  hypertensionPrevalence: number | null;
  mentalHealthEdRate: number | null;
  prematureMortality: number | null;
  hospitalAdmissionRate: number | null;
  healthDataYear: string | null;
  healthDataSource: string | null;
  population: number;
}

// Calculate overall health grade based on available metrics
function calculateHealthGrade(props: HealthStatRowProps): { score: number; grade: string; color: string } {
  const scores: number[] = [];
  const weights: number[] = [];

  // Hospital distance (weight: 1)
  if (props.distanceToHospital !== null) {
    let hospitalScore: number;
    if (props.distanceToHospital <= 3) hospitalScore = 100;
    else if (props.distanceToHospital <= 5) hospitalScore = 85;
    else if (props.distanceToHospital <= 8) hospitalScore = 65;
    else if (props.distanceToHospital <= 12) hospitalScore = 45;
    else hospitalScore = 25;
    scores.push(hospitalScore);
    weights.push(1);
  }

  // Overdose rate (weight: 1.5) - more impactful health indicator
  if (props.overdoseRatePer100k !== null) {
    let overdoseScore: number;
    if (props.overdoseRatePer100k < 30) overdoseScore = 100;
    else if (props.overdoseRatePer100k < 70) overdoseScore = 75;
    else if (props.overdoseRatePer100k < 130) overdoseScore = 45;
    else overdoseScore = 20;
    scores.push(overdoseScore);
    weights.push(1.5);
  }

  // Primary care access (weight: 2) - key health indicator
  if (props.primaryCareAccess !== null) {
    // Ottawa average ~85%, higher is better
    const primaryScore = Math.min(100, (props.primaryCareAccess / 95) * 100);
    scores.push(primaryScore);
    weights.push(2);
  }

  // Diabetes prevalence (weight: 1) - lower is better
  if (props.diabetesPrevalence !== null) {
    // Ottawa average ~9.5%, lower is better
    let diabetesScore: number;
    if (props.diabetesPrevalence <= 7) diabetesScore = 100;
    else if (props.diabetesPrevalence <= 10) diabetesScore = 75;
    else if (props.diabetesPrevalence <= 13) diabetesScore = 50;
    else diabetesScore = 30;
    scores.push(diabetesScore);
    weights.push(1);
  }

  // Mental health ED visits (weight: 1.5) - lower is better
  if (props.mentalHealthEdRate !== null) {
    let mentalScore: number;
    if (props.mentalHealthEdRate <= 400) mentalScore = 100;
    else if (props.mentalHealthEdRate <= 650) mentalScore = 75;
    else if (props.mentalHealthEdRate <= 900) mentalScore = 50;
    else mentalScore = 30;
    scores.push(mentalScore);
    weights.push(1.5);
  }

  // Premature mortality (weight: 1.5) - lower is better
  if (props.prematureMortality !== null) {
    let mortalityScore: number;
    if (props.prematureMortality <= 120) mortalityScore = 100;
    else if (props.prematureMortality <= 180) mortalityScore = 75;
    else if (props.prematureMortality <= 250) mortalityScore = 50;
    else mortalityScore = 30;
    scores.push(mortalityScore);
    weights.push(1.5);
  }

  // NEI health component as fallback (weight: 0.5)
  if (props.neiScore !== null && scores.length < 3) {
    let neiScore: number;
    if (props.neiScore >= 80) neiScore = 100;
    else if (props.neiScore >= 65) neiScore = 80;
    else if (props.neiScore >= 50) neiScore = 60;
    else neiScore = 40;
    scores.push(neiScore);
    weights.push(0.5);
  }

  // Calculate weighted average
  if (scores.length === 0) return { score: 0, grade: "N/A", color: "bg-gray-300" };

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
  const avgScore = Math.round(weightedSum / totalWeight);

  let grade: string;
  let color: string;

  if (avgScore >= 85) { grade = "A"; color = "bg-green-500"; }
  else if (avgScore >= 75) { grade = "B+"; color = "bg-green-400"; }
  else if (avgScore >= 65) { grade = "B"; color = "bg-lime-400"; }
  else if (avgScore >= 55) { grade = "C+"; color = "bg-yellow-400"; }
  else if (avgScore >= 45) { grade = "C"; color = "bg-orange-400"; }
  else { grade = "D"; color = "bg-red-400"; }

  return { score: avgScore, grade, color };
}

function getHospitalColor(distance: number | null): string {
  if (distance === null) return "text-gray-400";
  if (distance <= 3) return "text-green-600";
  if (distance <= 5) return "text-green-500";
  if (distance <= 8) return "text-yellow-600";
  return "text-orange-500";
}

function getOverdoseColor(rate: number | null): string {
  if (rate === null) return "text-gray-400";
  if (rate < 30) return "text-green-600";
  if (rate < 70) return "text-yellow-600";
  if (rate < 130) return "text-orange-500";
  return "text-red-500";
}

function getPrimaryCareBadge(rate: number | null): { label: string; color: string } {
  if (rate === null) return { label: "N/A", color: "text-gray-400" };
  if (rate >= 90) return { label: "Excellent", color: "text-green-600" };
  if (rate >= 80) return { label: "Good", color: "text-green-500" };
  if (rate >= 70) return { label: "Fair", color: "text-yellow-600" };
  return { label: "Low", color: "text-orange-500" };
}

function getDiabetesBadge(rate: number | null): { label: string; color: string } {
  if (rate === null) return { label: "N/A", color: "text-gray-400" };
  if (rate <= 7) return { label: "Low", color: "text-green-600" };
  if (rate <= 10) return { label: "Average", color: "text-yellow-600" };
  if (rate <= 13) return { label: "High", color: "text-orange-500" };
  return { label: "Very High", color: "text-red-500" };
}

function getMentalHealthBadge(rate: number | null): { label: string; color: string } {
  if (rate === null) return { label: "N/A", color: "text-gray-400" };
  if (rate <= 400) return { label: "Low", color: "text-green-600" };
  if (rate <= 650) return { label: "Average", color: "text-yellow-600" };
  if (rate <= 900) return { label: "High", color: "text-orange-500" };
  return { label: "Very High", color: "text-red-500" };
}

export default function HealthStatRow(props: HealthStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { score, grade, color } = calculateHealthGrade(props);

  const barWidth = Math.max(5, score);

  // Count available metrics
  const availableMetrics = [
    props.distanceToHospital,
    props.overdoseRatePer100k,
    props.primaryCareAccess,
    props.diabetesPrevalence,
    props.mentalHealthEdRate,
    props.prematureMortality,
    props.neiScore,
  ].filter(x => x !== null).length;

  // Check if we have any data
  if (availableMetrics === 0) {
    return (
      <div className="border-b border-gray-100 last:border-b-0">
        <div className="w-full px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:w-28 sm:shrink-0">
              <span className="text-lg sm:text-xl">🏥</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Health</span>
            </div>
            <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
              <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-500 text-xs sm:text-sm">
                No data available
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🏥</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Health</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className={`font-bold text-sm px-2 py-0.5 rounded ${color} text-white`}>
                {grade}
              </span>
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
          {/* Bar */}
          <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${color} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {score >= 85 ? "Excellent" : score >= 65 ? "Good" : score >= 45 ? "Fair" : "Needs Attention"}
            </span>
          </div>
          {/* Value - hidden on mobile */}
          <div className="hidden sm:block">
            <span className={`font-bold w-28 text-right block px-3 py-1 rounded ${color} text-white`}>
              Grade: {grade}
            </span>
          </div>
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

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Neighbourhood Health Indicators {props.healthDataYear && `(${props.healthDataYear})`}
          </div>

          {/* Health Score Overview */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-gray-500 text-xs mb-1">Health Score</div>
              <div className={`text-2xl font-bold ${score >= 65 ? 'text-green-600' : score >= 45 ? 'text-yellow-600' : 'text-orange-600'}`}>
                {score}/100
              </div>
              <div className="text-xs text-gray-400 mt-1">Grade: {grade}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-gray-500 text-xs mb-1">Data Points</div>
              <div className="text-lg font-bold text-gray-900">
                {availableMetrics}
              </div>
              <div className="text-xs text-gray-400 mt-1">health metrics</div>
            </div>
          </div>

          {/* Healthcare Access Section */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Healthcare Access</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Hospital Access */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏨</span>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Hospital</div>
                      <div className="text-xs text-gray-500">Nearest facility</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getHospitalColor(props.distanceToHospital)}`}>
                      {props.distanceToHospital !== null ? `${props.distanceToHospital} km` : "N/A"}
                    </div>
                  </div>
                </div>
                {props.nearestHospital && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 truncate">
                    {props.nearestHospital}
                  </div>
                )}
              </div>

              {/* Primary Care Access */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👨‍⚕️</span>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Primary Care</div>
                      <div className="text-xs text-gray-500">With family doctor</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getPrimaryCareBadge(props.primaryCareAccess).color}`}>
                      {props.primaryCareAccess !== null ? `${props.primaryCareAccess.toFixed(1)}%` : "N/A"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {getPrimaryCareBadge(props.primaryCareAccess).label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chronic Conditions Section */}
          {(props.diabetesPrevalence !== null || props.asthmaPrevalence !== null ||
            props.hypertensionPrevalence !== null || props.copdPrevalence !== null) && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                Chronic Conditions (Adult Prevalence) {props.healthDataYear && <span className="normal-case">({props.healthDataYear})</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {props.diabetesPrevalence !== null && (
                  <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                    <div className="text-lg mb-1">🩺</div>
                    <div className={`font-bold text-sm ${getDiabetesBadge(props.diabetesPrevalence).color}`}>
                      {props.diabetesPrevalence.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Diabetes</div>
                  </div>
                )}
                {props.asthmaPrevalence !== null && (
                  <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                    <div className="text-lg mb-1">🫁</div>
                    <div className="font-bold text-sm text-gray-900">
                      {props.asthmaPrevalence.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Asthma</div>
                  </div>
                )}
                {props.hypertensionPrevalence !== null && (
                  <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                    <div className="text-lg mb-1">❤️</div>
                    <div className="font-bold text-sm text-gray-900">
                      {props.hypertensionPrevalence.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Hypertension</div>
                  </div>
                )}
                {props.copdPrevalence !== null && (
                  <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                    <div className="text-lg mb-1">🌬️</div>
                    <div className="font-bold text-sm text-gray-900">
                      {props.copdPrevalence.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">COPD</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Outcomes Section */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
              Health Outcomes {props.healthDataYear && <span className="normal-case">({props.healthDataYear})</span>}
            </div>
            <div className="space-y-2">
              {/* Mental Health ED Visits */}
              {props.mentalHealthEdRate !== null && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🧠</span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Mental Health ED Visits</div>
                        <div className="text-xs text-gray-500">Annual rate per 100,000</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getMentalHealthBadge(props.mentalHealthEdRate).color}`}>
                        {props.mentalHealthEdRate.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {getMentalHealthBadge(props.mentalHealthEdRate).label}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overdose Rate */}
              {props.overdoseRatePer100k !== null && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💊</span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Overdose ED Visits</div>
                        <div className="text-xs text-gray-500">Rate per 100K (2020-2024 avg)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getOverdoseColor(props.overdoseRatePer100k)}`}>
                        {props.overdoseRatePer100k.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-400">Ottawa avg: ~65</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Premature Mortality */}
              {props.prematureMortality !== null && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Premature Mortality</div>
                        <div className="text-xs text-gray-500">Deaths before 75, per 100,000</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${props.prematureMortality <= 180 ? 'text-green-600' : props.prematureMortality <= 250 ? 'text-yellow-600' : 'text-orange-500'}`}>
                        {props.prematureMortality.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-400">Ottawa avg: ~180</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hospital Admissions */}
              {props.hospitalAdmissionRate !== null && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏥</span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Hospital Admissions</div>
                        <div className="text-xs text-gray-500">Annual rate per 1,000</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${props.hospitalAdmissionRate <= 45 ? 'text-green-600' : props.hospitalAdmissionRate <= 60 ? 'text-yellow-600' : 'text-orange-500'}`}>
                        {props.hospitalAdmissionRate.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Score Scale */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Health Grade Scale</div>
            <div className="grid grid-cols-6 gap-1 text-xs">
              <div className={`p-1.5 rounded text-center ${grade === 'A' ? 'ring-2 ring-offset-1 ring-green-500' : ''}`}>
                <div className="h-1.5 bg-green-500 rounded mb-1"></div>
                <div className="font-medium text-[10px]">A</div>
              </div>
              <div className={`p-1.5 rounded text-center ${grade === 'B+' ? 'ring-2 ring-offset-1 ring-green-400' : ''}`}>
                <div className="h-1.5 bg-green-400 rounded mb-1"></div>
                <div className="font-medium text-[10px]">B+</div>
              </div>
              <div className={`p-1.5 rounded text-center ${grade === 'B' ? 'ring-2 ring-offset-1 ring-lime-400' : ''}`}>
                <div className="h-1.5 bg-lime-400 rounded mb-1"></div>
                <div className="font-medium text-[10px]">B</div>
              </div>
              <div className={`p-1.5 rounded text-center ${grade === 'C+' ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}>
                <div className="h-1.5 bg-yellow-400 rounded mb-1"></div>
                <div className="font-medium text-[10px]">C+</div>
              </div>
              <div className={`p-1.5 rounded text-center ${grade === 'C' ? 'ring-2 ring-offset-1 ring-orange-400' : ''}`}>
                <div className="h-1.5 bg-orange-400 rounded mb-1"></div>
                <div className="font-medium text-[10px]">C</div>
              </div>
              <div className={`p-1.5 rounded text-center ${grade === 'D' ? 'ring-2 ring-offset-1 ring-red-400' : ''}`}>
                <div className="h-1.5 bg-red-400 rounded mb-1"></div>
                <div className="font-medium text-[10px]">D</div>
              </div>
            </div>
          </div>

          {/* Data Source Note */}
          {props.healthDataSource && (
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 mb-3">
              <strong>Data Source:</strong> {props.healthDataSource}
              {props.healthDataSource.includes('Sample') && (
                <span className="block mt-1 text-blue-600">
                  Download real OCHPP data for accurate neighbourhood health indicators.
                </span>
              )}
            </div>
          )}

          {/* Sources */}
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Data Sources</div>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.ontariohealthprofiles.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>OCHPP</span>
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://www.ottawapublichealth.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Ottawa Public Health</span>
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://open.ottawa.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Open Ottawa</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
