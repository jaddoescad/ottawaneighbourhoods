import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Most Affordable Neighbourhoods in Ottawa 2025 | Cheap Rent Areas",
  description: "Find the most affordable neighbourhoods in Ottawa with the lowest rent prices. Compare average rents across 100+ areas to find budget-friendly places to live.",
  openGraph: {
    title: "Most Affordable Neighbourhoods in Ottawa 2025",
    description: "Find the most affordable neighbourhoods in Ottawa with the lowest rent prices.",
    url: "https://ottawahoods.com/most-affordable",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
