import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { neighbourhoods } from "@/data/neighbourhoods";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return neighbourhoods.map((n) => ({ id: n.id }));
}

// Stat row component with label and bar
function StatRow({
  icon,
  label,
  value,
  percent,
  type = "good"
}: {
  icon: string;
  label: string;
  value: string | number;
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
}) {
  const colors = {
    great: "bg-green-500",
    good: "bg-green-400",
    okay: "bg-yellow-400",
    bad: "bg-orange-500",
    neutral: "bg-gray-300",
  };

  const textColors = {
    great: "text-white",
    good: "text-white",
    okay: "text-gray-900",
    bad: "text-white",
    neutral: "text-gray-700",
  };

  // Clamp percent between 20 (minimum for text) and 100
  const barWidth = Math.max(20, Math.min(percent, 100));

  return (
    <div className="flex items-center px-5 py-4">
      <div className="flex items-center gap-2 w-24 shrink-0">
        <span className="text-base">{icon}</span>
        <span className="text-gray-700 text-sm">{label}</span>
      </div>
      <div className="flex-1 flex justify-end">
        <div
          className={`h-9 rounded flex items-center justify-center px-3 text-sm font-medium ${colors[type]} ${textColors[type]}`}
          style={{ width: `${barWidth}%`, minWidth: 'fit-content' }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// Determine bar type based on score
function getScoreType(score: number, max: number = 100): "great" | "good" | "okay" | "bad" {
  const percent = (score / max) * 100;
  if (percent >= 80) return "great";
  if (percent >= 60) return "good";
  if (percent >= 40) return "okay";
  return "bad";
}

// Calculate percentage
function getPercent(score: number, max: number = 100): number {
  return Math.min((score / max) * 100, 100);
}

export default async function NeighbourhoodPage({ params }: PageProps) {
  const { id } = await params;
  const neighbourhood = neighbourhoods.find((n) => n.id === id);

  if (!neighbourhood) {
    notFound();
  }

  const { name, area, image, rank, score, quickStats, details, pros, cons } = neighbourhood;

  // Calculate cost score (inverse - lower rent is better)
  const costScore = Math.max(0, 100 - (quickStats.avgRent / 30));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[35vh] min-h-[280px]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />

        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/40 transition"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{name}</h1>
            <p className="text-white/80 text-lg">{area}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <nav className="flex gap-8 overflow-x-auto">
            <button className="py-4 text-rose-500 border-b-2 border-rose-500 font-medium text-sm whitespace-nowrap">
              Scores
            </button>
            <button className="py-4 text-gray-500 hover:text-gray-700 font-medium text-sm whitespace-nowrap">
              Cost of Living
            </button>
            <button className="py-4 text-gray-500 hover:text-gray-700 font-medium text-sm whitespace-nowrap">
              Pros and Cons
            </button>
            <button className="py-4 text-gray-500 hover:text-gray-700 font-medium text-sm whitespace-nowrap">
              Reviews
            </button>
            <button className="py-4 text-gray-500 hover:text-gray-700 font-medium text-sm whitespace-nowrap">
              Amenities
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Grid - Nomad List Style */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Column */}
            <div className="divide-y divide-gray-100">
              <StatRow icon="⭐" label="Overall score" value={`${(score / 20).toFixed(2)}/5 (Rank #${rank})`} percent={score} type={getScoreType(score)} />
              <StatRow icon="👨‍👩‍👧" label="Family score" value={quickStats.safety >= 90 ? "Great" : quickStats.safety >= 80 ? "Good" : "Okay"} percent={quickStats.safety} type={getScoreType(quickStats.safety)} />
              <StatRow icon="📡" label="Internet" value={`${quickStats.internetMbps >= 150 ? "Fast" : "Good"}: ${quickStats.internetMbps}Mbps`} percent={getPercent(quickStats.internetMbps, 300)} type={getScoreType(quickStats.internetMbps, 300)} />
              <StatRow icon="🚶" label="Walk Score" value={`${quickStats.walkScore >= 80 ? "Excellent" : "Good"}: ${quickStats.walkScore}`} percent={quickStats.walkScore} type={getScoreType(quickStats.walkScore)} />
              <StatRow icon="🚨" label="Safety" value={quickStats.safety >= 90 ? "Great" : quickStats.safety >= 80 ? "Good" : "Okay"} percent={quickStats.safety} type={getScoreType(quickStats.safety)} />
              <StatRow icon="💰" label="Income level" value={details.avgIncome} percent={50} type="neutral" />
            </div>

            {/* Right Column */}
            <div className="divide-y divide-gray-100 md:border-l border-gray-200">
              <StatRow icon="🏡" label="Quality of life" value={score >= 85 ? "Great" : score >= 75 ? "Good" : "Average"} percent={score} type={getScoreType(score)} />
              <StatRow icon="💵" label="Cost" value={`${costScore >= 60 ? "Affordable" : "Pricey"}: $${quickStats.avgRent.toLocaleString()}/mo`} percent={costScore} type={getScoreType(costScore)} />
              <StatRow icon="🚌" label="Transit" value={`Grade: ${quickStats.transit}`} percent={quickStats.transit.startsWith("A") ? 90 : quickStats.transit.startsWith("B") ? 70 : 50} type={quickStats.transit.startsWith("A") ? "great" : quickStats.transit.startsWith("B") ? "good" : "okay"} />
              <StatRow icon="🚴" label="Bike Score" value={`${details.bikeScore >= 80 ? "Bikeable" : "Good"}: ${details.bikeScore}`} percent={details.bikeScore} type={getScoreType(details.bikeScore)} />
              <StatRow icon="🌳" label="Parks" value={`${details.parks} parks`} percent={getPercent(details.parks, 50)} type={getScoreType(details.parks, 50)} />
              <StatRow icon="🏫" label="Schools" value={`${details.schools} schools`} percent={getPercent(details.schools, 30)} type={getScoreType(details.schools, 20)} />
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="bg-white rounded-lg border border-gray-200 mt-4 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="border-b md:border-b-0">
              <StatRow icon="🍽️" label="Restaurants" value={`${details.restaurants} places`} percent={getPercent(details.restaurants, 150)} type={getScoreType(details.restaurants, 100)} />
            </div>
            <div className="md:border-l border-gray-200">
              <StatRow icon="👥" label="Population" value={details.population} percent={50} type="neutral" />
            </div>
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">👍</span> Pros
            </h3>
            <ul className="space-y-3">
              {pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">👎</span> Cons
            </h3>
            <ul className="space-y-3">
              {cons.map((con, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700">
                  <span className="text-red-500 mt-0.5">✗</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
