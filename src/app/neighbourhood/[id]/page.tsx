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

export default async function NeighbourhoodPage({ params }: PageProps) {
  const { id } = await params;
  const neighbourhood = neighbourhoods.find((n) => n.id === id);

  if (!neighbourhood) {
    notFound();
  }

  const { name, area, image, rank, score, quickStats, details, pros, cons } = neighbourhood;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px]">
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

        {/* Rank Badge */}
        <div className="absolute top-6 right-6 bg-rose-500 px-4 py-2 rounded-full">
          <span className="text-white font-bold text-lg">#{rank}</span>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{name}</h1>
            <p className="text-white/80 text-lg">{area}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Overall Score</div>
            <div className="text-4xl font-bold text-gray-900">{score}<span className="text-xl text-gray-400">/100</span></div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{quickStats.walkScore}</div>
              <div className="text-xs text-gray-500">Walk Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{quickStats.transit}</div>
              <div className="text-xs text-gray-500">Transit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{quickStats.safety}%</div>
              <div className="text-xs text-gray-500">Safety</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{quickStats.internetMbps}</div>
              <div className="text-xs text-gray-500">Mbps</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Cost of Living */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Cost of Living</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Rent</span>
                <span className="text-xl font-bold text-gray-900">${quickStats.avgRent.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Income</span>
                <span className="text-lg font-semibold text-gray-900">{details.avgIncome}</span>
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Demographics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Population</span>
                <span className="text-xl font-bold text-gray-900">{details.population}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bike Score</span>
                <span className="text-lg font-semibold text-gray-900">{details.bikeScore}</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Amenities</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Restaurants</span>
                <span className="text-xl font-bold text-gray-900">{details.restaurants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Parks</span>
                <span className="text-lg font-semibold text-gray-900">{details.parks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Schools</span>
                <span className="text-lg font-semibold text-gray-900">{details.schools}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-2xl border border-green-100 p-6">
            <h3 className="text-green-700 font-semibold text-lg mb-4 flex items-center gap-2">
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

          <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
            <h3 className="text-red-700 font-semibold text-lg mb-4 flex items-center gap-2">
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
