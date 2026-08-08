import Image from "next/image";
import AdClickLink from "./AdClickLink";
import AdvertiseSlot from "./AdvertiseSlot";
import { SAMPLE_ADS, TONE_STYLES, type Ad } from "./adData";
import { stripMaxWidth, stripVisibility, type RailLayout } from "./railGeometry";

const CHIP =
  "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 transition";

function Chip({ ad }: { ad: Ad }) {
  const tone = TONE_STYLES[ad.tone];
  return (
    <AdClickLink
      adId={ad.id}
      href={ad.href}
      className={`${CHIP} ${tone.border} ${tone.soft} hover:brightness-[0.98]`}
    >
      <Image
        src={ad.logo}
        alt={`${ad.name} logo`}
        width={ad.logoWidth}
        height={ad.logoHeight}
        unoptimized={ad.logo.endsWith(".svg")}
        className={`h-7 w-auto max-w-[72px] shrink-0 object-contain ${
          ad.logoCircle ? "rounded-full" : "rounded-md"
        }`}
      />
      <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
        {ad.name}
      </span>
    </AdClickLink>
  );
}

/**
 * Narrow-screen ad row: small chips that scroll horizontally, logo and name
 * only. Shown above the content on screens too narrow for the side rails.
 */
export default function AdStrip({
  layout = "wide",
  className = "",
}: {
  layout?: RailLayout;
  className?: string;
}) {
  return (
    <div
      aria-label="Sponsored"
      className={`mx-auto ${stripMaxWidth(layout)} ${stripVisibility(
        layout,
      )} ${className}`}
    >
      <div className="ad-strip flex gap-2 overflow-x-auto px-4 pb-1">
        {SAMPLE_ADS.map((ad) => (
          <Chip key={ad.id} ad={ad} />
        ))}
        <AdvertiseSlot
          className={`${CHIP} border-dashed border-gray-300 bg-white hover:border-rose-300`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          <span className="whitespace-nowrap text-sm font-semibold text-gray-700">
            Your ad here
          </span>
        </AdvertiseSlot>
      </div>
    </div>
  );
}
