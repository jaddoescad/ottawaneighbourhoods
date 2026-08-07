import AdCard from "./AdCard";
import { slotClass } from "./railGeometry";
import type { Ad } from "./adData";

/**
 * The stack of cards inside a rail. Cards share the rail height evenly, so
 * the stack fills the gutter instead of clustering at the top.
 */
export default function AdSlots({
  ads,
  showEmptySlot,
}: {
  ads: Ad[];
  showEmptySlot?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {ads.map((ad, i) => (
        <AdCard
          key={ad.id}
          ad={ad}
          format="rail"
          className={slotClass(i, Boolean(showEmptySlot))}
        />
      ))}
      {showEmptySlot && <AdCard format="rail" />}
    </div>
  );
}
