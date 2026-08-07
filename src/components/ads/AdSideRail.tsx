import AdSlots from "./AdSlots";
import { LEFT_RAIL_ADS, RIGHT_RAIL_ADS } from "./adData";
import { railVisibility, railWidth, type RailLayout } from "./railGeometry";

/**
 * Sticky in-flow ad rail, for pages with a full-bleed hero where a fixed
 * rail would overlay the image. Sits beside the content inside a
 * `flex justify-center` row, so the content column stays centred in the
 * viewport and the rail grows into the gutter.
 *
 * Its height matches the fixed rails (80px of clearance top and bottom, the
 * latter keeping the last card clear of the Feedback button), so the same
 * slot-dropping thresholds in globals.css apply.
 */
export default function AdSideRail({
  side,
  layout = "narrow",
}: {
  side: "left" | "right";
  layout?: RailLayout;
}) {
  return (
    <aside
      aria-label="Sponsored"
      className={`sticky top-20 my-4 h-[calc(100vh-10rem)] shrink-0 self-start flex-col overflow-hidden sm:my-8 ${railVisibility(
        layout,
      )}`}
      style={{ width: railWidth(layout) }}
    >
      <AdSlots
        ads={side === "left" ? LEFT_RAIL_ADS : RIGHT_RAIL_ADS}
        showEmptySlot={side === "right"}
      />
    </aside>
  );
}
