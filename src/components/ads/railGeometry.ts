/**
 * Ad rail geometry, shared by the fixed rails on the home page and the
 * sticky rails on neighbourhood pages.
 *
 * A rail is anchored to the edge of the content column and grows into the
 * gutter, capped so ads stay ad-shaped. Percentages are used instead of
 * `100vw` because `100vw` includes the scrollbar and would push the page
 * sideways.
 */
export type RailLayout = "wide" | "narrow";

const LAYOUTS = {
  /** max-w-7xl content (home page). */
  wide: {
    content: "80rem",
    rail: "hidden rail:flex",
    strip: "rail:hidden",
    stripMaxWidth: "max-w-7xl",
  },
  /** max-w-5xl content (neighbourhood pages). */
  narrow: {
    content: "64rem",
    rail: "hidden rail-sm:flex",
    strip: "rail-sm:hidden",
    stripMaxWidth: "max-w-5xl",
  },
} as const;

/** Gap between a rail and the content column. */
export const RAIL_GAP = "0.75rem";

export function railWidth(layout: RailLayout) {
  return `clamp(190px, calc((100% - ${LAYOUTS[layout].content}) / 2 - 2rem), 240px)`;
}

/**
 * Distance from the centre line to the outer edge of a rail's gap, pinned so
 * the rail keeps a gap-sized margin from the viewport edge when it shows
 * below the width where it fits beside full-width content.
 */
export function contentEdge(layout: RailLayout) {
  return `min(calc(50% + ${LAYOUTS[layout].content} / 2 + ${RAIL_GAP}), calc(100% - ${railWidth(
    layout,
  )} - ${RAIL_GAP}))`;
}

export const railVisibility = (layout: RailLayout) => LAYOUTS[layout].rail;
export const stripVisibility = (layout: RailLayout) => LAYOUTS[layout].strip;
export const stripMaxWidth = (layout: RailLayout) =>
  LAYOUTS[layout].stripMaxWidth;

/**
 * Trailing slots drop out on shorter windows (thresholds in globals.css) so
 * a rail never clips a card in half.
 *
 * `ad-min-N` hides a card unless the rail has room for N slots. An ad is the
 * (index + 1)th slot, plus one more if the rail closes with a "Your ad here"
 * slot - which is what keeps that slot last visible as ads drop off.
 */
export function slotClass(index: number, hasEmptySlot: boolean) {
  const slotsNeeded = index + 1 + (hasEmptySlot ? 1 : 0);
  return slotsNeeded >= 4 ? `ad-min-${slotsNeeded}` : "";
}
