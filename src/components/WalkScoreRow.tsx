"use client";

interface WalkScoreRowProps {
  walkScore: number;
  transitScore: number;
  bikeScore: number;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Walker's Paradise";
  if (score >= 70) return "Very Walkable";
  if (score >= 50) return "Somewhat Walkable";
  if (score >= 25) return "Car-Dependent";
  return "Almost All Errands Require a Car";
}

function getTransitLabel(score: number): string {
  if (score >= 90) return "Excellent Transit";
  if (score >= 70) return "Great Transit";
  if (score >= 50) return "Moderate Transit";
  if (score >= 25) return "Limited Transit";
  return "Minimal Transit";
}

function getBikeLabel(score: number): string {
  if (score >= 90) return "Biker's Paradise";
  if (score >= 70) return "Very Bikeable";
  if (score >= 50) return "Bikeable";
  return "Somewhat Bikeable";
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-400";
  if (score >= 25) return "bg-orange-400";
  return "bg-red-400";
}

export default function WalkScoreRow({ walkScore, transitScore, bikeScore }: WalkScoreRowProps) {
  const scores = [
    {
      label: "Walk Score",
      score: walkScore,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z"/>
        </svg>
      ),
      description: getScoreLabel(walkScore)
    },
    {
      label: "Transit Score",
      score: transitScore,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z"/>
        </svg>
      ),
      description: getTransitLabel(transitScore)
    },
    {
      label: "Bike Score",
      score: bikeScore,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/>
        </svg>
      ),
      description: getBikeLabel(bikeScore)
    },
  ];

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="px-3 sm:px-5 py-3 sm:py-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <span className="text-lg sm:text-xl">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </span>
          <span className="text-gray-900 font-medium text-sm sm:text-base">Getting Around</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {scores.map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-2 sm:p-4">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-gray-600 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">{item.icon}</span>
                <span className="text-[10px] sm:text-sm font-medium text-gray-700 truncate">{item.label}</span>
              </div>

              {/* Score display */}
              <div className="flex items-baseline gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                <span className="text-xl sm:text-3xl font-bold text-gray-900">{item.score}</span>
                <span className="text-[10px] sm:text-sm text-gray-500">/100</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden mb-1 sm:mb-2">
                <div
                  className={`h-full rounded-full ${getScoreColor(item.score)} transition-all duration-500`}
                  style={{ width: `${item.score}%` }}
                />
              </div>

              {/* Description */}
              <p className="text-[9px] sm:text-xs text-gray-500 leading-tight">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Source link */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <a
            href="https://www.walkscore.com/CA-ON/Ottawa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Source: WalkScore.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
