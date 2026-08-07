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
  /** max-w-7xl content (home page). Rails fit from 1720px. */
  wide: {
    content: "80rem",
    rail: "hidden rail:flex",
    banner: "rail:hidden",
    bannerMaxWidth: "max-w-7xl",
  },
  /** max-w-5xl content (neighbourhood pages). Rails fit from 1470px. */
  narrow: {
    content: "64rem",
    rail: "hidden rail-sm:flex",
    banner: "rail-sm:hidden",
    bannerMaxWidth: "max-w-5xl",
  },
} as const;

/** Gap between a rail and the content column. */
export const RAIL_GAP = "0.75rem";

export function railWidth(layout: RailLayout) {
  return `clamp(190px, calc((100% - ${LAYOUTS[layout].content}) / 2 - 2rem), 340px)`;
}

/** Distance from the centre line to the outer edge of a rail's gap. */
export function contentEdge(layout: RailLayout) {
  return `calc(50% + ${LAYOUTS[layout].content} / 2 + ${RAIL_GAP})`;
}

export const railVisibility = (layout: RailLayout) => LAYOUTS[layout].rail;
export const bannerVisibility = (layout: RailLayout) => LAYOUTS[layout].banner;
export const bannerMaxWidth = (layout: RailLayout) =>
  LAYOUTS[layout].bannerMaxWidth;

/**
 * The last three slots drop out on shorter windows (thresholds in
 * globals.css) so a rail never clips a card in half. Counting from the end
 * keeps a rail's "Your ad here" slot as the last visible card.
 */
export function slotClass(index: number, adCount: number) {
  return ["ad-slot-5", "ad-slot-4", "ad-slot-3"][adCount - 1 - index] ?? "";
}
