"use client";

import { useState } from "react";
import SingleNeighbourhoodMap from "./SingleNeighbourhoodMap";

interface Boundary {
  onsId: number | string;
  name: string;
  rings: number[][][];
}

interface CoverageButtonProps {
  neighbourhoodName: string;
  boundaries: Boundary[];
}

export default function CoverageButton({
  neighbourhoodName,
  boundaries,
}: CoverageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white text-sm font-medium hover:bg-white/30 transition flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        Coverage
      </button>

      <SingleNeighbourhoodMap
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        neighbourhoodName={neighbourhoodName}
        boundaries={boundaries}
      />
    </>
  );
}
