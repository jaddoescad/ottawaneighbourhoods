import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Most Walkable Neighbourhoods in Ottawa 2025 | Walk Score Rankings",
  description: "Find the most walkable neighbourhoods in Ottawa. Rankings based on Walk Score measuring access to grocery stores, restaurants, parks, and daily errands on foot.",
  openGraph: {
    title: "Most Walkable Neighbourhoods in Ottawa 2025",
    description: "Find the most walkable neighbourhoods in Ottawa based on Walk Score.",
    url: "https://ottawahoods.com/most-walkable",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
