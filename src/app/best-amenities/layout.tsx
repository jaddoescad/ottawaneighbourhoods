import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Amenities in Ottawa by Neighbourhood 2025 | Shops & Services",
  description: "Find Ottawa neighbourhoods with the best amenities. Rankings based on grocery stores, restaurants, recreation facilities, libraries, and local services.",
  openGraph: {
    title: "Best Amenities in Ottawa by Neighbourhood 2025",
    description: "Find Ottawa neighbourhoods with the best amenities and services.",
    url: "https://ottawahoods.com/best-amenities",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
