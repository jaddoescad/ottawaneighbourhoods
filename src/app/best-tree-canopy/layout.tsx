import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Tree Canopy in Ottawa by Neighbourhood 2025 | Green Streets",
  description: "Find Ottawa neighbourhoods with the best tree canopy coverage. Rankings based on urban forest density and tree equity scores.",
  openGraph: {
    title: "Best Tree Canopy in Ottawa by Neighbourhood 2025",
    description: "Find Ottawa neighbourhoods with the best tree canopy coverage.",
    url: "https://ottawahoods.com/best-tree-canopy",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
