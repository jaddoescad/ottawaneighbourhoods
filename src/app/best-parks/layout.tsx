import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Parks in Ottawa by Neighbourhood 2025 | Green Spaces",
  description: "Find Ottawa neighbourhoods with the most parks and green spaces. Compare park counts and outdoor recreation options across 100+ areas.",
  openGraph: {
    title: "Best Parks in Ottawa by Neighbourhood 2025",
    description: "Find Ottawa neighbourhoods with the most parks and green spaces.",
    url: "https://ottawahoods.com/best-parks",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
