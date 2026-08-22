export type AdTone =
  | "rose"
  | "blue"
  | "amber"
  | "emerald"
  | "violet"
  | "sky"
  | "teal"
  | "orange"
  | "red"
  | "lime"
  | "indigo"
  | "yellow"
  | "fuchsia"
  | "pink";

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
    id: "ottawa-bathroom-renovations",
    name: "Ottawa Bathroom Renovations",
    tagline: "Bathroom design and renovation services in Ottawa.",
    logo: "/ads/ottawa-bathroom-renovations.png",
    logoWidth: 192,
    logoHeight: 78,
    tone: "sky",
    href: "https://www.ottawabathroomrenovations.com/",
  },
  {
    id: "dass-contracting",
    name: "DASS Contracting",
    tagline: "Residential and commercial renovations in Ontario.",
    logo: "/ads/dass.png",
    logoWidth: 192,
    logoHeight: 89,
    tone: "teal",
    href: "https://www.dasscm.com/",
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
    tone: "orange",
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
    tone: "red",
    href: "https://www.gianttiger.com",
  },
  {
    id: "leevalley",
    name: "Lee Valley Tools",
    tagline: "Woodworking and garden tools, Ottawa HQ.",
    logo: "/ads/leevalley.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "lime",
    href: "https://www.leevalley.com",
  },
  {
    id: "kunstadt",
    name: "Kunstadt Sports",
    tagline: "Ski, bike and skate shop in Ottawa.",
    logo: "/ads/kunstadt.svg",
    logoWidth: 166,
    logoHeight: 50,
    tone: "indigo",
    href: "https://kunstadt.com",
  },
  {
    id: "artisin",
    name: "Art-Is-In Bakery",
    tagline: "Sourdough bakery and café in Ottawa.",
    logo: "/ads/artisin.png",
    logoWidth: 192,
    logoHeight: 191,
    tone: "yellow",
    href: "https://artisinbakery.com",
  },
  {
    id: "suzyq",
    name: "Suzy Q Doughnuts",
    tagline: "Small-batch doughnuts made in Ottawa.",
    logo: "/ads/suzyq.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "fuchsia",
    href: "https://suzyq.ca",
  },
  {
    id: "stellaluna",
    name: "Stella Luna Gelato",
    tagline: "Italian gelato café in Ottawa.",
    logo: "/ads/stellaluna.png",
    logoWidth: 192,
    logoHeight: 192,
    tone: "pink",
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
  sky: {
    soft: "bg-sky-100",
    border: "border-sky-200",
    logo: "bg-sky-100",
    text: "text-sky-600",
  },
  teal: {
    soft: "bg-teal-100",
    border: "border-teal-200",
    logo: "bg-teal-100",
    text: "text-teal-600",
  },
  orange: {
    soft: "bg-orange-100",
    border: "border-orange-200",
    logo: "bg-orange-100",
    text: "text-orange-600",
  },
  red: {
    soft: "bg-red-100",
    border: "border-red-200",
    logo: "bg-red-100",
    text: "text-red-600",
  },
  lime: {
    soft: "bg-lime-100",
    border: "border-lime-200",
    logo: "bg-lime-100",
    text: "text-lime-600",
  },
  indigo: {
    soft: "bg-indigo-100",
    border: "border-indigo-200",
    logo: "bg-indigo-100",
    text: "text-indigo-600",
  },
  yellow: {
    soft: "bg-yellow-100",
    border: "border-yellow-200",
    logo: "bg-yellow-100",
    text: "text-yellow-600",
  },
  fuchsia: {
    soft: "bg-fuchsia-100",
    border: "border-fuchsia-200",
    logo: "bg-fuchsia-100",
    text: "text-fuchsia-600",
  },
  pink: {
    soft: "bg-pink-100",
    border: "border-pink-200",
    logo: "bg-pink-100",
    text: "text-pink-600",
  },
};

/** Left rail is all sponsors; the right rail closes with the empty slot. */
export const LEFT_RAIL_ADS = SAMPLE_ADS.slice(0, 6);
export const RIGHT_RAIL_ADS = SAMPLE_ADS.slice(6);

export const ADVERTISE_HREF = "/contact";
