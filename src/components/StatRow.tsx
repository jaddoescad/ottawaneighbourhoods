interface StatRowProps {
  icon: string;
  label: string;
  value: string | number;
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
  labelSet?: "income" | "rent" | "homePrice" | "population";
}

export default function StatRow({
  icon,
  label,
  value,
  percent,
  type = "good",
  labelSet = "income",
}: StatRowProps) {
  const colors = {
    great: "bg-green-500",
    good: "bg-green-400",
    okay: "bg-yellow-400",
    bad: "bg-orange-500",
    neutral: "bg-gray-300",
  };

  const qualityLabelsMap = {
    income: {
      great: "High",
      good: "Above Avg",
      okay: "Average",
      bad: "Below Avg",
      neutral: "N/A",
    },
    rent: {
      great: "Affordable",
      good: "Moderate",
      okay: "Average",
      bad: "Expensive",
      neutral: "N/A",
    },
    homePrice: {
      great: "Affordable",
      good: "Moderate",
      okay: "Average",
      bad: "Expensive",
      neutral: "N/A",
    },
    population: {
      great: "Large",
      good: "Medium-Large",
      okay: "Medium",
      bad: "Small",
      neutral: "N/A",
    },
  };

  const qualityLabels = qualityLabelsMap[labelSet];

  const barWidth = Math.max(5, Math.min(percent, 100));

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="w-full flex items-center gap-3 px-5 py-4">
        <div className="flex items-center gap-2 w-28 shrink-0">
          <span className="text-xl">{icon}</span>
          <span className="text-gray-900 font-medium">{label}</span>
        </div>
        <div className="flex-1 relative h-9 bg-gray-100 rounded-lg overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-lg ${colors[type]} transition-all duration-300`}
            style={{ width: `${barWidth}%` }}
          />
          <span className="absolute inset-0 flex items-center px-4 text-gray-800 font-semibold text-sm">
            {qualityLabels[type]}
          </span>
        </div>
        <span className="text-gray-900 font-bold w-28 text-right">{value}</span>
        <div className="w-5 h-5" />
      </div>
    </div>
  );
}
