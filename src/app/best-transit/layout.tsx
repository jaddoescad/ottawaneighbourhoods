import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Transit in Ottawa by Neighbourhood 2025 | O-Train & Bus Access",
  description: "Find Ottawa neighbourhoods with the best public transit. Rankings based on O-Train access, bus coverage, and overall Transit Score.",
  openGraph: {
    title: "Best Transit in Ottawa by Neighbourhood 2025",
    description: "Find Ottawa neighbourhoods with the best public transit access.",
    url: "https://ottawahoods.com/best-transit",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
