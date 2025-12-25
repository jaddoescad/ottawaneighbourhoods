"use client";

import { useState } from "react";

interface FoodCostBurdenStatRowProps {
  foodCostBurden: number | null;
  foodCostBurdenRating: string | null;
  medianIncome: number;
}

function getRatingColor(rating: string | null): string {
  switch (rating) {
    case "Low": return "bg-green-500";
    case "Moderate": return "bg-green-400";
    case "High": return "bg-yellow-400";
    case "Very High": return "bg-orange-400";
    case "Severe": return "bg-red-500";
    default: return "bg-gray-400";
  }
}

function getRatingTextColor(rating: string | null): string {
  switch (rating) {
    case "Low": return "text-green-600";
    case "Moderate": return "text-green-500";
    case "High": return "text-amber-600";
    case "Very High": return "text-orange-600";
    case "Severe": return "text-red-600";
    default: return "text-gray-500";
  }
}

function getRatingDescription(rating: string | null): string {
  switch (rating) {
    case "Low": return "Minimal food cost burden";
    case "Moderate": return "Manageable food costs";
    case "High": return "Noticeable food cost burden";
    case "Very High": return "Significant financial pressure";
    case "Severe": return "Food insecurity risk";
    default: return "No data available";
  }
}

export default function FoodCostBurdenStatRow({
  foodCostBurden,
  foodCostBurdenRating,
  medianIncome,
}: FoodCostBurdenStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no data
  if (foodCostBurden === null || foodCostBurdenRating === null) return null;

  // Annual food cost for family of 4 (2025 Nutritious Food Basket)
  const annualFoodCost = 14160;
  const monthlyFoodCost = annualFoodCost / 12;

  // Calculate bar width (max out at 30% for visual purposes)
  const barWidth = Math.min(100, (foodCostBurden / 30) * 100);

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
              <span className="text-lg sm:text-xl">🛒</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Food Costs</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className={`font-bold text-sm ${getRatingTextColor(foodCostBurdenRating)}`}>
                {foodCostBurden.toFixed(1)}%
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getRatingColor(foodCostBurdenRating)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {foodCostBurdenRating} ({getRatingDescription(foodCostBurdenRating)})
            </span>
          </div>
          {/* Value - hidden on mobile */}
          <div className="hidden sm:block">
            <span className={`font-bold w-28 text-right block ${getRatingTextColor(foodCostBurdenRating)}`}>
              {foodCostBurden.toFixed(1)}%
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
            Food Cost Burden Analysis
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-gray-500 mb-1">% of Income on Food</div>
              <div className={`font-bold text-2xl ${getRatingTextColor(foodCostBurdenRating)}`}>
                {foodCostBurden.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">{foodCostBurdenRating}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-gray-500 mb-1">Median Income</div>
              <div className="font-bold text-gray-900 text-xl">
                ${medianIncome.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">Household/year</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 col-span-2 sm:col-span-1">
              <div className="text-gray-500 mb-1">Monthly Food Cost</div>
              <div className="font-bold text-gray-900 text-xl">
                ${monthlyFoodCost.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">Family of 4 (NFB)</div>
            </div>
          </div>

          {/* Rating Scale */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Food Cost Burden Scale</div>
            <div className="grid grid-cols-5 gap-1 text-xs">
              <div className={`p-2 rounded text-center ${foodCostBurdenRating === 'Low' ? 'ring-2 ring-green-500' : ''}`}>
                <div className="h-2 bg-green-500 rounded mb-1"></div>
                <div className="font-medium">&lt;12%</div>
                <div className="text-gray-400 text-[10px]">Low</div>
              </div>
              <div className={`p-2 rounded text-center ${foodCostBurdenRating === 'Moderate' ? 'ring-2 ring-green-400' : ''}`}>
                <div className="h-2 bg-green-400 rounded mb-1"></div>
                <div className="font-medium">12-16%</div>
                <div className="text-gray-400 text-[10px]">Moderate</div>
              </div>
              <div className={`p-2 rounded text-center ${foodCostBurdenRating === 'High' ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className="h-2 bg-yellow-400 rounded mb-1"></div>
                <div className="font-medium">16-20%</div>
                <div className="text-gray-400 text-[10px]">High</div>
              </div>
              <div className={`p-2 rounded text-center ${foodCostBurdenRating === 'Very High' ? 'ring-2 ring-orange-400' : ''}`}>
                <div className="h-2 bg-orange-400 rounded mb-1"></div>
                <div className="font-medium">20-25%</div>
                <div className="text-gray-400 text-[10px]">Very High</div>
              </div>
              <div className={`p-2 rounded text-center ${foodCostBurdenRating === 'Severe' ? 'ring-2 ring-red-500' : ''}`}>
                <div className="h-2 bg-red-500 rounded mb-1"></div>
                <div className="font-medium">&gt;25%</div>
                <div className="text-gray-400 text-[10px]">Severe</div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p className="mb-2">
              <strong>Food Cost Burden</strong> measures what percentage of household income is needed
              to afford a nutritious diet. It&apos;s calculated using the 2025 Nutritious Food Basket
              cost ($1,180/month for a family of 4) compared to median household income.
            </p>
            <p>
              A burden above <strong>25%</strong> indicates potential food insecurity risk, where
              households may struggle to afford nutritious food while meeting other basic needs.
            </p>
          </div>

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href="https://www.ottawapublichealth.ca/en/public-health-topics/food-insecurity.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Source: Ottawa Public Health NFB + 2021 Census</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
