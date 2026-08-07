import Image from "next/image";
import AdClickLink from "./AdClickLink";
import AdvertiseSlot from "./AdvertiseSlot";
import { TONE_STYLES, type Ad } from "./adData";

interface AdCardProps {
  format: "rail" | "banner";
  /** Omit for an empty "Your ad here" slot */
  ad?: Ad;
  className?: string;
}

function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

/** Logos sit directly on the tint - no tile. They vary from square icons to
 *  wide wordmarks, so fix the height and let the width follow the mark. */
function Logo({ ad, height }: { ad: Ad; height: "rail" | "banner" }) {
  const isRail = height === "rail";
  return (
    <Image
      src={ad.logo}
      alt={`${ad.name} logo`}
      width={ad.logoWidth}
      height={ad.logoHeight}
      // SVG logos are served as-is; the optimizer rejects them
      unoptimized={ad.logo.endsWith(".svg")}
      className={`w-auto shrink-0 object-contain ${
        ad.logoCircle ? "rounded-full" : "rounded-xl"
      } ${isRail ? "h-14 max-w-[170px]" : "h-12 max-w-[140px]"}`}
    />
  );
}

/** Tinted block ad slot. */
export default function AdCard({ format, ad, className = "" }: AdCardProps) {
  const isRail = format === "rail";
  const extra = className ? ` ${className}` : "";
  /**
   * Rail cards share the rail height evenly so the stack fills the gutter,
   * but never compress below their content - on a short window the rail
   * clips the last slot instead of squashing all of them.
   */
  const shell = isRail
    ? "group flex min-h-[156px] flex-1 flex-col w-full rounded-2xl transition"
    : "group block w-full rounded-2xl transition";

  // ---------- empty slot ----------
  if (!ad) {
    return (
      <AdvertiseSlot
        className={`${shell}${extra} border border-dashed border-gray-300 bg-white text-left hover:border-rose-300 hover:bg-rose-50/40`}
      >
        {isRail ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-500">
              <PlusIcon className="w-6 h-6" />
            </span>
            <span className="mt-0.5 text-lg font-semibold leading-tight text-gray-700">
              Your ad here
            </span>
            <span className="text-sm leading-5 text-gray-400">
              Reach Ottawa home seekers
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3.5 px-4 py-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-500">
              <PlusIcon className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <div className="text-lg font-semibold text-gray-800">
                Your ad here
              </div>
              <p className="truncate text-sm text-gray-500">
                Reach Ottawa renters and home buyers.
              </p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white group-hover:bg-rose-500">
              Advertise
            </span>
          </div>
        )}
      </AdvertiseSlot>
    );
  }

  // ---------- filled creative ----------
  const tone = TONE_STYLES[ad.tone];
  const body = isRail ? (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border ${tone.border} ${tone.soft} px-4 py-3 text-center`}
    >
      <Logo ad={ad} height="rail" />
      <span className="mt-0.5 text-lg font-semibold leading-tight text-gray-900">
        {ad.name}
      </span>
      <p className="line-clamp-2 text-sm leading-5 text-gray-600">
        {ad.tagline}
      </p>
    </div>
  ) : (
    <div
      className={`flex items-center gap-3.5 rounded-2xl border ${tone.border} ${tone.soft} px-4 py-4`}
    >
      <Logo ad={ad} height="banner" />
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900">{ad.name}</div>
        <p className="truncate text-sm text-gray-600">{ad.tagline}</p>
      </div>
      <span className={`ml-auto shrink-0 text-sm font-semibold ${tone.text}`}>
        Visit
      </span>
    </div>
  );

  // Advertisers are external, so open in a new tab, mark the link as an ad
  // for search engines, and report the click.
  return (
    <AdClickLink
      adId={ad.id}
      href={ad.href}
      className={`${shell}${extra} hover:brightness-[0.98]`}
    >
      {body}
    </AdClickLink>
  );
}
