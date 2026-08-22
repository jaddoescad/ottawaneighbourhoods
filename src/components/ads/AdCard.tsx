import Image from "next/image";
import AdClickLink from "./AdClickLink";
import AdvertiseSlot from "./AdvertiseSlot";
import { TONE_STYLES, type Ad } from "./adData";

interface AdCardProps {
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

/**
 * Tinted block ad slot for the side rails. Cards share the rail height
 * evenly so the stack fills the gutter, but never compress below their
 * content - on a short window the rail clips the last slot instead of
 * squashing all of them.
 *
 * Narrow screens use AdStrip instead.
 */
const SHELL =
  "group flex min-h-[140px] flex-1 flex-col w-full overflow-hidden rounded-2xl transition";

export default function AdCard({ ad, className = "" }: AdCardProps) {
  const extra = className ? ` ${className}` : "";

  // ---------- empty slot ----------
  if (!ad) {
    return (
      <AdvertiseSlot
        className={`${SHELL}${extra} border border-dashed border-gray-300 bg-white text-left hover:border-rose-300 hover:bg-rose-50/40`}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-1 overflow-hidden px-3 py-2.5 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-500">
            <PlusIcon className="w-5 h-5" />
          </span>
          <span className="mt-0.5 text-sm font-semibold leading-tight text-gray-700">
            Your ad here
          </span>
          <span className="text-xs leading-4 text-gray-400">
            Reach Ottawa home seekers
          </span>
        </div>
      </AdvertiseSlot>
    );
  }

  // ---------- filled creative ----------
  const tone = TONE_STYLES[ad.tone];

  return (
    <AdClickLink
      adId={ad.id}
      href={ad.href}
      className={`${SHELL}${extra} hover:brightness-[0.98]`}
    >
      <div
        className={`flex flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border ${tone.border} ${tone.soft} px-3 py-2.5 text-center`}
      >
        <Image
          src={ad.logo}
          alt={`${ad.name} logo`}
          width={ad.logoWidth}
          height={ad.logoHeight}
          // SVG logos are served as-is; the optimizer rejects them
          unoptimized={ad.logo.endsWith(".svg")}
          className={`h-10 w-auto max-w-[120px] shrink-0 object-contain ${
            ad.logoCircle ? "rounded-full" : "rounded-lg"
          }`}
        />
        <span className="mt-0.5 line-clamp-2 text-sm font-semibold leading-tight text-gray-900">
          {ad.name}
        </span>
        <p className="line-clamp-2 text-xs leading-4 text-gray-600">
          {ad.tagline}
        </p>
      </div>
    </AdClickLink>
  );
}
