export type AdTone = "rose" | "blue" | "amber" | "emerald" | "violet";

export interface Ad {
  id: string;
  name: string;
  tagline: string;
  /** Logo in /public/ads, sized so the longest side is 192px */
  logo: string;
  logoWidth: number;
  logoHeight: number;
  /** Round mark on a square canvas - crop the corners off */
  logoCircle?: boolean;
  tone: AdTone;
  href: string;
}

/**
 * PLACEHOLDER CREATIVES - real Ottawa businesses used to preview the ad
 * slots. None of them are actual advertisers, so replace or empty these
 * before the slots go live. Taglines are plain descriptions on purpose:
 * inventing offers or prices for a real business would be a false claim.
 */
export const SAMPLE_ADS: Ad[] = [
  {
    id: "ottawapainters",
    name: "Ottawa Painters",
    tagline: "Interior and exterior house painting in Ottawa.",
    logo: "/ads/ottawapainters.png",
    logoWidth: 192,
    logoHeight: 192,
    logoCircle: true,
    tone: "amber",
    href: "https://paintersottawa.com",
  },
  {
    id: "claridge",
    name: "Claridge Homes",
    tagline: "New homes and condos across Ottawa.",
    logo: "/ads/claridge.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "blue",
    href: "https://www.claridgehomes.com",
  },
  {
    id: "richcraft",
    name: "Richcraft Homes",
    tagline: "Ottawa home builder and developer.",
    logo: "/ads/richcraft.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "rose",
    href: "https://www.richcraft.com",
  },
  {
    id: "farmboy",
    name: "Farm Boy",
    tagline: "Fresh market grocery stores across Ottawa.",
    logo: "/ads/farmboy.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "emerald",
    href: "https://www.farmboy.ca",
  },
  {
    id: "bridgehead",
    name: "Bridgehead",
    tagline: "Coffee roaster and cafés across Ottawa.",
    logo: "/ads/bridgehead.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "amber",
    href: "https://www.bridgehead.ca",
  },
  {
    id: "tamarack",
    name: "Tamarack Homes",
    tagline: "New home communities around Ottawa.",
    logo: "/ads/tamarack.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "violet",
    href: "https://tamarackhomes.com",
  },
  {
    id: "gianttiger",
    name: "Giant Tiger",
    tagline: "Canadian discount retailer, Ottawa HQ.",
    logo: "/ads/gianttiger.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "rose",
    href: "https://www.gianttiger.com",
  },
  {
    id: "leevalley",
    name: "Lee Valley Tools",
    tagline: "Woodworking and garden tools, Ottawa HQ.",
    logo: "/ads/leevalley.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "emerald",
    href: "https://www.leevalley.com",
  },
  {
    id: "kunstadt",
    name: "Kunstadt Sports",
    tagline: "Ski, bike and skate shop in Ottawa.",
    logo: "/ads/kunstadt.svg",
    logoWidth: 166,
    logoHeight: 50,
    tone: "blue",
    href: "https://kunstadt.com",
  },
  {
    id: "artisin",
    name: "Art-Is-In Bakery",
    tagline: "Sourdough bakery and café in Ottawa.",
    logo: "/ads/artisin.png",
    logoWidth: 192,
    logoHeight: 191,
    tone: "amber",
    href: "https://artisinbakery.com",
  },
  {
    id: "suzyq",
    name: "Suzy Q Doughnuts",
    tagline: "Small-batch doughnuts made in Ottawa.",
    logo: "/ads/suzyq.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "violet",
    href: "https://suzyq.ca",
  },
  {
    id: "stellaluna",
    name: "Stella Luna Gelato",
    tagline: "Italian gelato café in Ottawa.",
    logo: "/ads/stellaluna.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "rose",
    href: "https://stellalunagelato.com",
  },
];

export const TONE_STYLES: Record<
  AdTone,
  { soft: string; border: string; logo: string; text: string }
> = {
  rose: {
    soft: "bg-rose-100",
    border: "border-rose-200",
    logo: "bg-rose-100",
    text: "text-rose-600",
  },
  blue: {
    soft: "bg-blue-100",
    border: "border-blue-200",
    logo: "bg-blue-100",
    text: "text-blue-600",
  },
  amber: {
    soft: "bg-amber-100",
    border: "border-amber-200",
    logo: "bg-amber-100",
    text: "text-amber-600",
  },
  emerald: {
    soft: "bg-emerald-100",
    border: "border-emerald-200",
    logo: "bg-emerald-100",
    text: "text-emerald-600",
  },
  violet: {
    soft: "bg-violet-100",
    border: "border-violet-200",
    logo: "bg-violet-100",
    text: "text-violet-600",
  },
};

/** Left rail is all sponsors; the right rail closes with the empty slot. */
export const LEFT_RAIL_ADS = SAMPLE_ADS.slice(0, 6);
export const RIGHT_RAIL_ADS = SAMPLE_ADS.slice(6);

export const ADVERTISE_HREF = "/contact";
