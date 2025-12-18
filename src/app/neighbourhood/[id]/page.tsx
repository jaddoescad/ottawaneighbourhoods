import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { neighbourhoods } from "@/data/neighbourhoods";
import ExpandableStatRow from "@/components/ExpandableStatRow";
import CrimeStatRow from "@/components/CrimeStatRow";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return neighbourhoods.map((n) => ({ id: n.id }));
}

// Thresholds for each category
const THRESHOLDS = {
  parks: { max: 25, great: 20, okay: 10 },
  schools: { max: 15, great: 12, okay: 6 },
  libraries: { max: 2, great: 2, okay: 1 },
};

// Determine bar color based on thresholds
function getScoreType(value: number, category: keyof typeof THRESHOLDS): "great" | "good" | "okay" | "bad" {
  const t = THRESHOLDS[category];
  if (value >= t.great) return "great";
  if (value >= t.okay) return "okay";
  return "bad";
}

// Calculate bar percentage based on threshold max
function getPercent(value: number, category: keyof typeof THRESHOLDS): number {
  const max = THRESHOLDS[category].max;
  return Math.min((value / max) * 100, 100);
}

export default async function NeighbourhoodPage({ params }: PageProps) {
  const { id } = await params;
  const neighbourhood = neighbourhoods.find((n) => n.id === id);

  if (!neighbourhood) {
    notFound();
  }

  const { name, area, image, details } = neighbourhood;

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

      {/* Stats Grid - Real Data Only */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <ExpandableStatRow
            icon="🌳"
            label="Parks"
            value={`${details.parks} parks`}
            percent={getPercent(details.parks, "parks")}
            type={getScoreType(details.parks, "parks")}
            items={details.parksList}
            itemLabel="parks"
          />
          <ExpandableStatRow
            icon="🏫"
            label="Schools"
            value={`${details.schools} schools`}
            percent={getPercent(details.schools, "schools")}
            type={getScoreType(details.schools, "schools")}
            items={details.schoolsList}
            itemLabel="schools"
          />
          <ExpandableStatRow
            icon="📚"
            label="Libraries"
            value={`${details.libraries} ${details.libraries === 1 ? 'library' : 'libraries'}`}
            percent={getPercent(details.libraries, "libraries")}
            type={getScoreType(details.libraries, "libraries")}
            items={details.librariesList}
            itemLabel="libraries"
          />
          <CrimeStatRow
            total={details.crimeTotal}
            byCategory={details.crimeByCategory}
          />
        </div>
      </div>
    </div>
  );
}
