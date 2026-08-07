import type { CSSProperties } from "react";
import AdSlots from "./AdSlots";
import { LEFT_RAIL_ADS, RIGHT_RAIL_ADS, type Ad } from "./adData";
import { contentEdge, railVisibility, railWidth } from "./railGeometry";

/**
 * Fixed ad rails either side of the max-w-7xl content column, used on
 * pages whose content starts right below the sticky header. Only shown
 * once the viewport can clear the content (the `rail` breakpoint, 1720px)
 * - narrower screens get the banner slots instead.
 *
 * Neighbourhood pages use AdSideRail instead: their hero is full-bleed, so
 * fixed rails would sit on top of it.
 */
function Rail({
  ads,
  side,
  showEmptySlot,
}: {
  ads: Ad[];
  side: "left" | "right";
  showEmptySlot?: boolean;
}) {
  const width = railWidth("wide");
  const edge = contentEdge("wide");
  const style: CSSProperties =
    side === "left" ? { width, right: edge } : { width, left: edge };

  return (
    <aside
      aria-label="Sponsored"
      className={`fixed top-20 bottom-20 z-30 flex-col overflow-hidden ${railVisibility(
        "wide",
      )}`}
      style={style}
    >
      <AdSlots ads={ads} showEmptySlot={showEmptySlot} />
    </aside>
  );
}

export default function AdRails() {
  return (
    <>
      <Rail ads={LEFT_RAIL_ADS} side="left" />
      <Rail ads={RIGHT_RAIL_ADS} side="right" showEmptySlot />
    </>
  );
}
